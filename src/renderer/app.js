/* DesignInspire 渲染进程逻辑：只通过 window.inspire（preload 暴露）与主进程通信 */
const $ = (s) => document.querySelector(s);

const state = {
  tab: 'inspire',
  items: [],
  errors: [],
  favorites: {},
  library: [],
  sources: [],
  query: '',
  category: '全部',
  libraryTag: '全部',
};

const TAB_TITLES = {
  inspire: '灵感信息流',
  news: '设计资讯',
  favorites: '我的收藏',
  library: '本地图库',
  sources: '订阅源管理',
};

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function relTime(d) {
  if (!d) return '';
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const day = Math.floor(h / 24);
  if (day < 30) return `${day} 天前`;
  return new Date(t).toLocaleDateString();
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2400);
}

/* ---------- 大图预览 ---------- */
function openLightbox(src) {
  if (!src) return;
  $('#lightbox img').src = src;
  $('#lightbox').classList.add('show');
}
function closeLightbox() {
  $('#lightbox').classList.remove('show');
}

/* ---------- 启动 ---------- */
async function boot() {
  const [sources, favorites, library] = await Promise.all([
    window.inspire.listSources(),
    window.inspire.listFavorites(),
    window.inspire.listLibrary(),
  ]);
  Object.assign(state, { sources, favorites, library });
  bindChrome();
  // 远程配图被防盗链拦截时替换为占位块（CSP 禁止内联 onerror，用捕获阶段代理）
  document.addEventListener('error', (e) => {
    if (e.target && e.target.tagName === 'IMG' && e.target.closest('#content')) {
      const d = document.createElement('div');
      d.className = 'card-img placeholder';
      e.target.replaceWith(d);
    }
  }, true);
  await refresh(false);
}

function bindChrome() {
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => { state.tab = btn.dataset.tab; render(); });
  });
  $('#search').addEventListener('input', (e) => { state.query = e.target.value; renderList(); });
  $('#category').addEventListener('change', (e) => { state.category = e.target.value; renderList(); });
  $('#refresh').addEventListener('click', () => refresh(true));
  $('#content').addEventListener('click', onContentClick);
  $('#content').addEventListener('submit', onContentSubmit);
  $('#lightbox').addEventListener('click', closeLightbox);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  // 托盘后台刷新到新内容 / 窗口重新聚焦时，读一次缓存刷新界面
  window.inspire.onFeedsUpdated(() => refresh(false));
  window.addEventListener('focus', () => {
    if (['inspire', 'news'].includes(state.tab)) refresh(false);
  });
}

async function refresh(force) {
  $('#content').innerHTML = '<div class="loading">正在聚合全网设计灵感…</div>';
  try {
    const res = await window.inspire.fetchFeeds({ force });
    state.items = res.items || [];
    state.errors = res.errors || [];
    render();
    if (state.errors.length) toast(`${state.errors.length} 个源抓取失败，详见「订阅源管理」`);
  } catch (err) {
    $('#content').innerHTML = `<div class="loading">抓取失败：${esc(err.message || err)}<br>请检查网络后点击右上角「刷新」</div>`;
  }
}

/* ---------- 渲染 ---------- */
function filteredItems() {
  const q = state.query.trim().toLowerCase();
  return state.items.filter((it) =>
    (state.category === '全部' || it.category === state.category) &&
    (!q || (it.title + ' ' + it.snippet + ' ' + it.sourceName).toLowerCase().includes(q))
  );
}

function render() {
  document.querySelectorAll('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.tab === state.tab));
  $('#tab-title').textContent = TAB_TITLES[state.tab] || '';
  $('#filterbar').style.display = ['inspire', 'news'].includes(state.tab) ? 'flex' : 'none';
  $('#badge-favorites').textContent = Object.keys(state.favorites).length || '';
  $('#badge-library').textContent = state.library.length || '';
  renderList();
}

function renderList() {
  const c = $('#content');
  if (state.tab === 'inspire') {
    const items = filteredItems();
    c.innerHTML = items.length
      ? `<div class="grid">${items.map(cardHtml).join('')}</div>`
      : '<div class="empty">没有匹配的内容，换个关键词或分类试试</div>';
  } else if (state.tab === 'news') {
    const items = filteredItems();
    c.innerHTML = items.length
      ? `<div class="news-list">${items.map(newsRowHtml).join('')}</div>`
      : '<div class="empty">没有匹配的资讯</div>';
  } else if (state.tab === 'favorites') {
    const favs = Object.values(state.favorites).sort((a, b) => b.savedAt - a.savedAt);
    c.innerHTML =
      `<div class="fav-toolbar">
        <span>${favs.length} 条收藏</span>
        <button data-action="export-moodboard">🧩 导出 Moodboard</button>
      </div>` +
      (favs.length
        ? `<div class="grid">${favs.map(favCardHtml).join('')}</div>`
        : '<div class="empty">还没有收藏<br>在灵感卡片上点「☆ 收藏」即可加入</div>');
  } else if (state.tab === 'library') {
    renderLibrary(c);
  } else if (state.tab === 'sources') {
    c.innerHTML = sourcesHtml();
  }
  updateCategoryFilter();
}

// 图库：标签筛选 + 瀑布流
function renderLibrary(c) {
  const allTags = [...new Set(state.library.flatMap((r) => r.tags || []))];
  if (!allTags.includes(state.libraryTag)) state.libraryTag = '全部';
  const list = state.library.filter(
    (r) => state.libraryTag === '全部' || (r.tags || []).includes(state.libraryTag)
  );
  const chips = ['全部', ...allTags]
    .map((t) => `<button class="chip ${t === state.libraryTag ? 'active' : ''}" data-action="lib-tag" data-tag="${esc(t)}">${esc(t)}</button>`)
    .join('');
  c.innerHTML =
    `<div class="lib-toolbar"><div class="chips">${chips}</div><span class="lib-count">${list.length} 张</span></div>` +
    (list.length
      ? `<div class="lib-grid">${list.map(libCardHtml).join('')}</div>`
      : '<div class="empty">图库为空<br>在灵感卡片上点「⬇ 存入图库」，图片会下载到本机</div>');
}

function tagFormHtml(id, tags) {
  return `<form class="tag-form" data-id="${esc(id)}">
    <input name="tags" value="${esc((tags || []).join(', '))}" placeholder="标签，逗号分隔">
    <button type="submit">保存标签</button>
  </form>`;
}

function cardHtml(it) {
  const fav = state.favorites[it.id];
  const img = it.image
    ? `<img class="card-img" src="${esc(it.image)}" loading="lazy" referrerpolicy="no-referrer">`
    : '<div class="card-img placeholder"></div>';
  return `<article class="card" data-id="${esc(it.id)}">
    <a class="img-wrap" data-action="open" data-link="${esc(it.link)}">${img}</a>
    <div class="card-body">
      <div class="meta"><span class="src">${esc(it.sourceName)}</span><span class="cat">${esc(it.category)}</span><time>${relTime(it.date)}</time></div>
      <h3><a data-action="open" data-link="${esc(it.link)}">${esc(it.title)}</a></h3>
      <p>${esc(it.snippet)}</p>
      <div class="actions">
        <button data-action="fav" class="${fav ? 'active' : ''}">${fav ? '★ 已收藏' : '☆ 收藏'}</button>
        <button data-action="save-lib">⬇ 存入图库</button>
      </div>
      ${fav ? tagFormHtml(it.id, fav.tags) : ''}
    </div>
  </article>`;
}

function favCardHtml(entry) {
  const it = entry.item;
  const img = it.image
    ? `<img class="card-img" src="${esc(it.image)}" loading="lazy" referrerpolicy="no-referrer">`
    : '<div class="card-img placeholder"></div>';
  const imgWrap = it.image
    ? `<a class="img-wrap" data-action="preview" data-img="${esc(it.image)}" title="点击看大图">${img}</a>`
    : `<div class="img-wrap">${img}</div>`;
  return `<article class="card" data-id="${esc(entry.id)}">
    ${imgWrap}
    <div class="card-body">
      <div class="meta"><span class="src">${esc(it.sourceName)}</span><span class="cat">${esc(it.category)}</span></div>
      <h3><a data-action="open" data-link="${esc(it.link)}">${esc(it.title)}</a></h3>
      <div class="actions">
        <button data-action="fav" class="active">★ 取消收藏</button>
        <button data-action="save-lib">⬇ 存入图库</button>
      </div>
      ${tagFormHtml(entry.id, entry.tags)}
    </div>
  </article>`;
}

function libCardHtml(r) {
  return `<article class="card" data-id="${esc(r.id)}">
    <div class="img-wrap" data-action="preview" data-img="dlib://${esc(r.file)}" title="点击看大图">
      <img class="card-img" src="dlib://${esc(r.file)}" loading="lazy">
    </div>
    <div class="card-body">
      <div class="meta"><span class="src">${esc(r.sourceName)}</span><time>${relTime(r.savedAt)} 入库</time></div>
      <h3><a data-action="open" data-link="${esc(r.link)}">${esc(r.title)}</a></h3>
      ${(r.tags && r.tags.length) ? `<div class="tags">${r.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
      <div class="actions">
        <button data-action="reveal">📂 定位文件</button>
        <button data-action="remove-lib">🗑 删除</button>
      </div>
    </div>
  </article>`;
}

function newsRowHtml(it) {
  return `<div class="news-row" data-id="${esc(it.id)}">
    <time>${relTime(it.date)}</time>
    <a class="news-title" data-action="open" data-link="${esc(it.link)}">${esc(it.title)}</a>
    <span class="src">${esc(it.sourceName)}</span>
    <button class="mini" data-action="fav" title="收藏">${state.favorites[it.id] ? '★' : '☆'}</button>
  </div>`;
}

function sourcesHtml() {
  return `<form id="add-source" class="source-form">
      <input name="name" placeholder="名称，如 Behance 精选" required>
      <input name="url" type="url" placeholder="RSS 地址，https://…" required>
      <input name="category" placeholder="分类，如 装置艺术">
      <button type="submit">＋ 添加订阅源</button>
    </form>
    <div class="source-list">${state.sources.map((s) => `
      <div class="source-row">
        <strong>${esc(s.name)}</strong>
        <span class="cat">${esc(s.category)}</span>
        <code>${esc(s.url)}</code>
        <button data-action="remove-source" data-id="${esc(s.id)}">删除</button>
      </div>`).join('')}
    </div>
    ${state.errors.length ? `<div class="errors"><h4>⚠ 本次抓取失败的源</h4>${state.errors.map((e) => `<p>${esc(e.source)}：${esc(e.message)}</p>`).join('')}</div>` : ''}`;
}

function updateCategoryFilter() {
  const sel = $('#category');
  const cats = ['全部', ...new Set(state.sources.map((s) => s.category || '未分类'))];
  if (!cats.includes(state.category)) state.category = '全部';
  sel.innerHTML = cats.map((c) => `<option ${c === state.category ? 'selected' : ''}>${esc(c)}</option>`).join('');
}

/* ---------- 交互 ---------- */
async function onContentClick(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  const host = el.closest('[data-id]');
  const id = el.dataset.id || (host && host.dataset.id);

  if (action === 'open') {
    if (el.dataset.link) window.inspire.openExternal(el.dataset.link);
    return;
  }
  if (action === 'preview') {
    openLightbox(el.dataset.img);
    return;
  }
  if (action === 'lib-tag') {
    state.libraryTag = el.dataset.tag;
    renderList();
    return;
  }

  try {
    if (action === 'fav') {
      const item = state.items.find((i) => i.id === id)
        || (state.favorites[id] && state.favorites[id].item);
      if (!item) return;
      const res = await window.inspire.toggleFavorite(item, (state.favorites[id] || {}).tags || []);
      state.favorites = await window.inspire.listFavorites();
      toast(res.favored ? '已加入收藏' : '已取消收藏');
      render();
    } else if (action === 'save-lib') {
      let item = state.items.find((i) => i.id === id)
        || (state.favorites[id] && state.favorites[id].item);
      if (!item) return toast('找不到该条目');
      if (state.favorites[id]) item = { ...item, tags: state.favorites[id].tags };
      await window.inspire.saveToLibrary(item);
      state.library = await window.inspire.listLibrary();
      toast('已存入本地图库');
      render();
    } else if (action === 'remove-lib') {
      await window.inspire.removeFromLibrary(id);
      state.library = await window.inspire.listLibrary();
      toast('已从图库删除');
      render();
    } else if (action === 'reveal') {
      await window.inspire.revealInFolder(id);
    } else if (action === 'remove-source') {
      await window.inspire.removeSource(id);
      state.sources = await window.inspire.listSources();
      toast('已删除订阅源');
      await refresh(true);
    } else if (action === 'export-moodboard') {
      const entries = Object.values(state.favorites);
      if (!entries.some((f) => f.item && f.item.image)) return toast('还没有带配图的收藏');
      toast('正在生成拼贴…');
      const saved = await window.inspire.exportMoodboard(entries);
      toast(saved ? 'Moodboard 已导出：' + saved : '已取消导出');
    }
  } catch (err) {
    toast('操作失败：' + (err.message || err));
  }
}

async function onContentSubmit(e) {
  e.preventDefault();
  if (e.target.id === 'add-source') {
    const f = e.target;
    try {
      await window.inspire.addSource({
        name: f.name.value.trim(),
        url: f.url.value.trim(),
        category: f.category.value.trim(),
      });
      f.reset();
      state.sources = await window.inspire.listSources();
      toast('已添加订阅源');
      await refresh(true);
    } catch (err) {
      toast('添加失败：' + (err.message || err));
    }
  } else if (e.target.classList.contains('tag-form')) {
    const id = e.target.dataset.id;
    const tags = e.target.tags.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
    await window.inspire.updateFavoriteTags(id, tags);
    state.favorites = await window.inspire.listFavorites();
    toast('标签已保存');
  }
}

boot();

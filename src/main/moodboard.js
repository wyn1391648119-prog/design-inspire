const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, dialog } = require('electron');

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// 拼贴页：深色背景 + 三列瀑布流，带标题、来源与标签
function buildHtml(entries) {
  const cards = entries
    .map((e) => {
      const it = e.item || {};
      const tags = (e.tags || []).map((t) => `<span class="tag">#${esc(t)}</span>`).join(' ');
      return `<div class="card">
        <img src="${esc(it.image)}" alt="">
        <div class="meta"><strong>${esc(it.title)}</strong><span>${esc(it.sourceName || '')}</span>${tags}</div>
      </div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { background:#0e1014; color:#e8eaf0; margin:0; padding:48px;
         font-family:-apple-system,"PingFang SC","Microsoft YaHei","Segoe UI",sans-serif; }
  h1 { font-size:34px; letter-spacing:-1px; margin:0 0 8px; }
  h1 span { color:#c8f05a; }
  .sub { color:#8b93a5; font-size:14px; margin-bottom:36px; }
  .cols { column-count:3; column-gap:20px; }
  .card { break-inside:avoid; margin-bottom:20px; background:#15181f; border-radius:14px; overflow:hidden; }
  .card img { width:100%; display:block; }
  .meta { padding:12px 14px; display:flex; flex-direction:column; gap:4px; }
  .meta strong { font-size:14px; line-height:1.45; }
  .meta span { font-size:12px; color:#8b93a5; }
  .tag { font-size:11px; color:#c8f05a; }
</style></head><body>
  <h1>Design<span>Inspire</span> Moodboard</h1>
  <div class="sub">${entries.length} 张收藏 · ${new Date().toLocaleDateString('zh-CN')} · 由 DesignInspire 导出</div>
  <div class="cols">${cards}</div>
</body></html>`;
}

// 隐藏的离屏窗口渲染拼贴页 → 全图截屏为 PNG → 保存到用户选择的位置
async function exportMoodboard(parentWin, entries) {
  entries = (entries || []).filter((e) => e && e.item && e.item.image);
  if (!entries.length) throw new Error('没有带配图的收藏可导出');

  const { filePath, canceled } = await dialog.showSaveDialog(parentWin, {
    title: '导出 Moodboard',
    defaultPath: path.join(app.getPath('pictures'), `moodboard-${new Date().toISOString().slice(0, 10)}.png`),
    filters: [{ name: 'PNG 图片', extensions: ['png'] }],
  });
  if (canceled || !filePath) return null;

  const tmp = path.join(app.getPath('temp'), `moodboard-${Date.now()}.html`);
  fs.writeFileSync(tmp, buildHtml(entries), 'utf8');

  const off = new BrowserWindow({
    show: false,
    width: 1240,
    height: 900,
    webPreferences: { offscreen: true },
  });
  try {
    await off.loadFile(tmp);
    await off.webContents.executeJavaScript(`new Promise((res) => {
      const imgs = Array.from(document.images);
      if (!imgs.length) return res();
      let left = imgs.length;
      const done = () => { if (--left <= 0) res(); };
      imgs.forEach((i) => {
        if (i.complete) done();
        else { i.onload = done; i.onerror = done; }
      });
      setTimeout(res, 20000); // 兜底：个别图片加载失败也继续
    })`);
    const height = await off.webContents.executeJavaScript('document.body.scrollHeight');
    off.setSize(1240, Math.min(Math.max(height, 600), 12000));
    await new Promise((r) => setTimeout(r, 400)); // 等待重排重绘
    const image = await off.webContents.capturePage();
    fs.writeFileSync(filePath, image.toPNG());
    return filePath;
  } finally {
    off.destroy();
    try { fs.unlinkSync(tmp); } catch { /* 临时文件清理失败可忽略 */ }
  }
}

module.exports = { exportMoodboard };

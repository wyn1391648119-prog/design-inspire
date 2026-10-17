const crypto = require('crypto');
const Parser = require('rss-parser');

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'Mozilla/5.0 DesignInspire/0.1 (+https://github.com)' },
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// 从 RSS 条目中尽力提取配图：enclosure → media:content/thumbnail → 正文首张 <img>
function extractImage(item) {
  if (item.enclosure && item.enclosure.url) {
    const t = String(item.enclosure.type || item.enclosure.url);
    if (/image|jpe?g|png|gif|webp|avif/i.test(t)) return item.enclosure.url;
  }
  const mc = item.mediaContent;
  if (mc) {
    const node = Array.isArray(mc) ? mc[0] : mc;
    if (node && node.$ && node.$.url && /image|jpe?g|png|webp/i.test(node.$.medium || node.$.type || node.$.url)) return node.$.url;
  }
  const mt = item.mediaThumbnail;
  if (mt) {
    const node = Array.isArray(mt) ? mt[0] : mt;
    if (node && node.$ && node.$.url) return node.$.url;
  }
  const html = item.contentEncoded || item.content || '';
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

class Feeds {
  constructor(store) {
    this.store = store;
    this.cache = { items: [], errors: [], at: 0 };
  }

  async fetchAll({ force = false } = {}) {
    const ttl = (this.store.get('settings').cacheMinutes || 10) * 60 * 1000;
    if (!force && this.cache.items.length && Date.now() - this.cache.at < ttl) return this.cache;

    const sources = this.store.get('sources') || [];
    const results = await Promise.allSettled(
      sources.map(async (s) => {
        const feed = await parser.parseURL(s.url);
        return (feed.items || []).slice(0, 20).map((it) => {
          const item = {
            sourceId: s.id,
            sourceName: s.name,
            category: s.category || '未分类',
            title: stripHtml(it.title) || '(无标题)',
            link: it.link || '',
            date: it.isoDate || it.pubDate || null,
            snippet: stripHtml(it.contentSnippet || it.content || '').slice(0, 160),
            image: extractImage(it),
          };
          item.id = this.store.idOf(item);
          return item;
        });
      })
    );

    const items = [];
    const errors = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') items.push(...r.value);
      else errors.push({ source: sources[i].name, message: String((r.reason && r.reason.message) || r.reason) });
    });
    items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    this.cache = { items, errors, at: Date.now() };
    return this.cache;
  }

  addSource({ name, url, category }) {
    try {
      new URL(url);
    } catch {
      throw new Error('RSS 地址格式不正确');
    }
    const sources = this.store.get('sources') || [];
    if (sources.some((x) => x.url === url)) throw new Error('该订阅源已存在');
    const src = {
      id: 'custom-' + crypto.createHash('md5').update(url).digest('hex').slice(0, 8),
      name: name.trim(),
      url: url.trim(),
      category: (category || '未分类').trim(),
    };
    sources.push(src);
    this.store.set('sources', sources);
    this.cache = { items: [], errors: [], at: 0 };
    return src;
  }

  removeSource(id) {
    this.store.set('sources', (this.store.get('sources') || []).filter((s) => s.id !== id));
    this.cache = { items: [], errors: [], at: 0 };
  }
}

module.exports = Feeds;

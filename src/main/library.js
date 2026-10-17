const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app, net, shell } = require('electron');

// 本地灵感图库：图片落盘到 userData/inspire-library，索引保存在 store
class Library {
  constructor(store) {
    this.store = store;
    this.dir = path.join(app.getPath('userData'), 'inspire-library');
    fs.mkdirSync(this.dir, { recursive: true });
  }

  async save(item) {
    if (!item || !item.image) throw new Error('该条目没有可保存的配图');
    let ext = '.jpg';
    try {
      ext = (path.extname(new URL(item.image).pathname) || '.jpg').split('?')[0].slice(0, 6) || '.jpg';
    } catch { /* keep default */ }
    if (!/^\.[a-z0-9]+$/i.test(ext)) ext = '.jpg';

    const fname = crypto.createHash('md5').update(item.image).digest('hex') + ext;
    const fpath = path.join(this.dir, fname);

    if (!fs.existsSync(fpath)) {
      const res = await net.fetch(item.image, {
        headers: { 'User-Agent': 'Mozilla/5.0 DesignInspire/0.1' },
      });
      if (!res.ok) throw new Error('图片下载失败（HTTP ' + res.status + '）');
      fs.writeFileSync(fpath, Buffer.from(await res.arrayBuffer()));
    }

    const list = this.store.get('library');
    const existing = list.find((r) => r.id === fname);
    if (existing) return existing;

    const record = {
      id: fname,
      file: fname,
      title: item.title || '未命名',
      link: item.link || '',
      sourceName: item.sourceName || '',
      tags: item.tags || [],
      savedAt: Date.now(),
    };
    list.unshift(record);
    this.store.set('library', list);
    return record;
  }

  remove(id) {
    try { fs.unlinkSync(path.join(this.dir, path.basename(id))); } catch { /* 文件可能已不存在 */ }
    this.store.set('library', this.store.get('library').filter((r) => r.id !== id));
  }

  reveal(id) {
    shell.showItemInFolder(path.join(this.dir, path.basename(id)));
  }
}

module.exports = Library;

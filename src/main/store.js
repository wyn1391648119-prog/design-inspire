const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');
const DEFAULT_SOURCES = require('./default-sources');

const DEFAULT_SETTINGS = { cacheMinutes: 10, trayRefreshMinutes: 30, lastSeenId: null };

// 轻量 JSON 持久化：收藏、图库索引、自定义订阅源、设置
class Store {
  constructor() {
    this.file = path.join(app.getPath('userData'), 'design-inspire.json');
    this.data = {
      favorites: {},
      library: [],
      sources: DEFAULT_SOURCES,
      settings: { ...DEFAULT_SETTINGS },
    };
    try {
      if (fs.existsSync(this.file)) {
        this.data = Object.assign(this.data, JSON.parse(fs.readFileSync(this.file, 'utf8')));
      }
    } catch (e) {
      console.error('[store] 读取本地数据失败，使用默认值：', e.message);
    }
    // 老版本数据文件可能缺少新增设置项，这里补默认值
    this.data.settings = Object.assign({ ...DEFAULT_SETTINGS }, this.data.settings || {});
  }

  save() {
    try {
      fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error('[store] 写入失败：', e.message);
    }
  }

  get(key) { return this.data[key]; }
  set(key, value) { this.data[key] = value; this.save(); }

  updateSettings(patch) {
    Object.assign(this.data.settings, patch);
    this.save();
  }

  idOf(item) {
    return crypto.createHash('md5').update(item.link || item.title || String(Date.now())).digest('hex');
  }

  toggleFavorite(item, tags = []) {
    const id = item.id || this.idOf(item);
    if (this.data.favorites[id]) {
      delete this.data.favorites[id];
      this.save();
      return { id, favored: false };
    }
    this.data.favorites[id] = { id, tags, savedAt: Date.now(), item: { ...item, id } };
    this.save();
    return { id, favored: true };
  }

  updateFavoriteTags(id, tags) {
    if (this.data.favorites[id]) {
      this.data.favorites[id].tags = tags;
      this.save();
    }
    return this.data.favorites[id];
  }
}

module.exports = Store;

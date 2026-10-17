const { contextBridge, ipcRenderer } = require('electron');

// 渲染进程唯一可用 API（contextIsolation 开启，页面无法直接访问 Node）
contextBridge.exposeInMainWorld('inspire', {
  fetchFeeds: (opts) => ipcRenderer.invoke('feeds:fetch', opts),

  listSources: () => ipcRenderer.invoke('sources:list'),
  addSource: (s) => ipcRenderer.invoke('sources:add', s),
  removeSource: (id) => ipcRenderer.invoke('sources:remove', id),

  listFavorites: () => ipcRenderer.invoke('fav:list'),
  toggleFavorite: (item, tags) => ipcRenderer.invoke('fav:toggle', item, tags),
  updateFavoriteTags: (id, tags) => ipcRenderer.invoke('fav:updateTags', id, tags),

  listLibrary: () => ipcRenderer.invoke('library:list'),
  saveToLibrary: (item) => ipcRenderer.invoke('library:save', item),
  removeFromLibrary: (id) => ipcRenderer.invoke('library:remove', id),
  revealInFolder: (id) => ipcRenderer.invoke('library:reveal', id),

  openExternal: (url) => ipcRenderer.invoke('open:external', url),
});

const path = require('path');
const { pathToFileURL } = require('url');
const { app, BrowserWindow, ipcMain, shell, protocol, net } = require('electron');
const Store = require('./store');
const Feeds = require('./feeds');
const Library = require('./library');

// 本地图库自定义协议 dlib://<文件名>，供渲染进程安全加载本地图片
protocol.registerSchemesAsPrivileged([
  { scheme: 'dlib', privileges: { standard: true, secure: true, stream: true, supportFetchAPI: true } },
]);

let win;
let store;
let feeds;
let library;

function createWindow() {
  win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#0e1014',
    title: 'DesignInspire',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });
  win.loadFile(path.join(__dirname, '../renderer/index.html'));
}

function registerIpc() {
  ipcMain.handle('feeds:fetch', (_e, opts) => feeds.fetchAll(opts));

  ipcMain.handle('sources:list', () => store.get('sources'));
  ipcMain.handle('sources:add', (_e, s) => feeds.addSource(s));
  ipcMain.handle('sources:remove', (_e, id) => feeds.removeSource(id));

  ipcMain.handle('fav:list', () => store.get('favorites'));
  ipcMain.handle('fav:toggle', (_e, item, tags) => store.toggleFavorite(item, tags));
  ipcMain.handle('fav:updateTags', (_e, id, tags) => store.updateFavoriteTags(id, tags));

  ipcMain.handle('library:list', () => store.get('library'));
  ipcMain.handle('library:save', (_e, item) => library.save(item));
  ipcMain.handle('library:remove', (_e, id) => library.remove(id));
  ipcMain.handle('library:reveal', (_e, id) => library.reveal(id));

  ipcMain.handle('open:external', (_e, url) => {
    if (/^https?:\/\//i.test(String(url))) shell.openExternal(url);
  });
}

app.whenReady().then(() => {
  store = new Store();
  feeds = new Feeds(store);
  library = new Library(store);

  protocol.handle('dlib', (req) => {
    const name = path.basename(decodeURIComponent(new URL(req.url).hostname));
    return net.fetch(pathToFileURL(path.join(library.dir, name)).toString());
  });

  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

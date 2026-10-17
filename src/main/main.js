const path = require('path');
const { pathToFileURL } = require('url');
const { app, BrowserWindow, ipcMain, shell, protocol, net, Notification } = require('electron');
const Store = require('./store');
const Feeds = require('./feeds');
const Library = require('./library');
const { createTray } = require('./tray');
const { exportMoodboard } = require('./moodboard');

// 本地图库自定义协议 dlib://<文件名>，供渲染进程安全加载本地图片
protocol.registerSchemesAsPrivileged([
  { scheme: 'dlib', privileges: { standard: true, secure: true, stream: true, supportFetchAPI: true } },
]);

let win;
let store;
let feeds;
let library;
let quitting = false;

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

  // 关闭窗口时隐藏到托盘常驻，而不是退出（托盘菜单里可真正退出）
  win.on('close', (e) => {
    if (!quitting) {
      e.preventDefault();
      win.hide();
    }
  });
  win.on('focus', () => {
    try { app.setBadgeCount(0); } catch { /* Windows 不支持角标 */ }
  });
}

function toggleWindow() {
  if (!win) return;
  if (win.isVisible() && win.isFocused()) win.hide();
  else { win.show(); win.focus(); }
}

// 后台定时刷新：有新内容时发系统通知 + Dock/任务栏角标，并通知渲染进程刷新
async function backgroundRefresh() {
  try {
    const res = await feeds.fetchAll({ force: true });
    const items = res.items || [];
    if (!items.length) return;

    const lastSeen = store.get('settings').lastSeenId;
    let fresh = 0;
    if (lastSeen) {
      const idx = items.findIndex((i) => i.id === lastSeen);
      fresh = idx === -1 ? Math.min(items.length, 20) : idx;
    }
    // 首次运行只记录基线，不打扰
    store.updateSettings({ lastSeenId: items[0].id });

    if (fresh > 0) {
      if (win && !win.isDestroyed()) win.webContents.send('feeds:updated');
      try { app.setBadgeCount(fresh); } catch { /* Windows 不支持角标 */ }
      const n = new Notification({
        title: 'DesignInspire',
        body: `有 ${fresh} 条新的设计灵感，点击查看`,
      });
      n.on('click', () => { win.show(); win.focus(); });
      n.show();
    }
  } catch (e) {
    console.error('[background-refresh]', e.message);
  }
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

  ipcMain.handle('moodboard:export', (_e, entries) => exportMoodboard(win, entries));

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

  createTray({
    onToggle: toggleWindow,
    onRefresh: () => backgroundRefresh(),
    onQuit: () => { quitting = true; app.quit(); },
  });

  // 启动后静默记录一次基线；之后按设置的间隔后台刷新
  setTimeout(backgroundRefresh, 5000);
  const minutes = store.get('settings').trayRefreshMinutes || 30;
  setInterval(backgroundRefresh, minutes * 60 * 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else if (win && !win.isVisible()) win.show();
  });
});

app.on('before-quit', () => { quitting = true; });

// 托盘常驻：所有窗口关闭后进程保留，由托盘菜单退出
app.on('window-all-closed', () => {});

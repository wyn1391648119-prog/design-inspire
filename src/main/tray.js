const { Tray, Menu, nativeImage } = require('electron');

// 内嵌 32x32 PNG 托盘图标（深底 + 柠檬绿四角星），避免额外二进制资源
const TRAY_ICON =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA3UlEQVR4nNWXwQ3DIAxFjXeIlFuu3aEzdNrO0B165YbEEMmJCBFIwHbs9t8CCv99Y6IAYCx3NjnNyyplFIOvelUHJY2vQFDTvLY+nk1qQGBtUBPisAWjen+frPcxp9HWNC8rqwIpPacK7C3gigxQpqZW4T8r0EpLqYJ5BRxA/zEcSfh6fGQAuB+aK5gmgIRxD8jvVoALI9YDoyC9xknmx5AE0Eo5mp4MICkyQJmWkp4FICUWQEpNTb8DtC4NdysG73Zji//CGLzD/EHbHKDoAS2I3OfQhHdDlOub3443RwtdvSfjBpkAAAAASUVORK5CYII=';

function createTray({ onToggle, onRefresh, onQuit }) {
  const tray = new Tray(nativeImage.createFromDataURL(TRAY_ICON));
  tray.setToolTip('DesignInspire — 设计灵感聚合');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: '显示 / 隐藏窗口', click: onToggle },
      { label: '立即刷新', click: onRefresh },
      { type: 'separator' },
      { label: '退出 DesignInspire', click: onQuit },
    ])
  );
  tray.on('click', onToggle);
  return tray;
}

module.exports = { createTray };

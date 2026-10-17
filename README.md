# DesignInspire

全网设计灵感聚合 + 设计资讯 RSS 阅读的跨平台桌面应用（Electron）。一个窗口，逛遍全球设计平台。

## 功能

- **灵感信息流**：按时间聚合各设计平台最新内容，卡片式浏览，自动提取配图，点击跳转原文
- **设计资讯**：紧凑列表模式，适合快速扫标题；支持关键词搜索 + 分类筛选
- **一键收藏 + 标签管理**：收藏任意条目，逗号分隔打标签，数据保存在本机
- **本地灵感图库**：把喜欢的配图下载到本机（`userData/inspire-library`），可一键在文件管理器中定位
- **订阅源管理**：内置 22 个精选源，支持自由增删自定义 RSS 源；抓取失败的源会单独列出，不影响整体浏览

## 内置订阅源（按需求分类，均已验证返回有效 RSS）

| 分类 | 来源 |
| --- | --- |
| 设计案例 | It's Nice That · designboom · Fubiz · Dezeen · We Heart |
| 视觉灵感 | IGNANT · Abduzeedo · Mindsparkle Mag |
| 品牌设计 | BP&O |
| 高奢时装 / 秀场 | Vogue · Harper's BAZAAR · Wallpaper* · WWD · Hypebeast · Fashionista · AnOther · ELLE DECOR |
| 装置艺术 | Colossal · STIRworld |
| 建筑空间 | ArchDaily · Yellowtrace |
| UI/UX | Smashing Magazine · UX Collective |

> Behance / Dribbble / Awwwards 已关闭公开 RSS，如需接入可在「订阅源管理」中添加第三方镜像源，或后续通过其官方 API 扩展。

## 快速开始

需要 Node.js 18+。

```bash
npm install
npm start
```

## 打包分发

```bash
npm run dist   # 输出 macOS / Windows / Linux 安装包（electron-builder）
```

## 目录结构

```
src/
├── main/                 # Electron 主进程
│   ├── main.js           # 窗口、IPC、dlib:// 本地图库协议
│   ├── preload.js        # contextBridge 安全桥（window.inspire）
│   ├── feeds.js          # RSS 聚合抓取 + 配图提取 + 缓存 + 不规范 XML 降级解析
│   ├── store.js          # JSON 持久化（收藏 / 图库索引 / 订阅源）
│   ├── library.js        # 图片下载落盘
│   └── default-sources.js# 内置订阅源清单
└── renderer/             # 渲染进程（无构建步骤的原生 JS）
    ├── index.html
    ├── styles.css        # 深色主题
    └── app.js            # 界面状态与交互
```

## 数据位置

所有收藏、标签、图库图片均保存在本机 Electron `userData` 目录：

- macOS: `~/Library/Application Support/design-inspire/`
- Windows: `%APPDATA%/design-inspire/`
- Linux: `~/.config/design-inspire/`

## Roadmap

- [ ] 托盘常驻 + 新内容角标提醒
- [ ] Behance / Awwwards 官方 API 接入
- [ ] 图库瀑布流 + 按标签过滤
- [ ] 收藏导出为 moodboard（图片拼贴）

## License

MIT

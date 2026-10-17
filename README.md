# DesignInspire

全网设计灵感聚合 + 设计资讯 RSS 阅读的跨平台桌面应用（Electron）。一个窗口，逛遍全球设计平台。

## 功能

- **灵感信息流**：按时间聚合各设计平台最新内容，卡片式浏览，自动提取配图，点击跳转原文
- **设计资讯**：紧凑列表模式，适合快速扫标题；支持关键词搜索 + 分类筛选
- **一键收藏 + 标签管理**：收藏任意条目，逗号分隔打标签，数据保存在本机
- **本地灵感图库**：瀑布流浏览 + 标签筛选，图片下载到本机，可一键在文件管理器中定位
- **大图预览**：收藏与图库中点击图片查看大图，ESC 或点击关闭
- **Moodboard 导出**：把收藏一键拼成深色瀑布流 PNG 拼贴图（含标题、来源、标签）
- **托盘常驻 + 新内容提醒**：关窗不退出，后台每 30 分钟静默刷新，有新内容时系统通知 + Dock 角标
- **订阅源管理**：内置 29 个精选源，支持自由增删自定义 RSS 源；抓取失败的源会单独列出，不影响整体浏览

## 内置订阅源（按需求分类，均已验证返回有效 RSS）

| 分类 | 来源 |
| --- | --- |
| 设计案例 | It's Nice That · designboom · Fubiz · Dezeen · We Heart |
| 视觉灵感 | IGNANT · Abduzeedo · Mindsparkle Mag |
| 插画艺术 | Hi-Fructose · Juxtapoz · Illustration Age |
| 包装设计 | Packaging of the World · The Dieline |
| 网页设计 | Awwwards Blog |
| 品牌设计 | BP&O |
| 高奢时装 / 秀场 | Vogue · Harper's BAZAAR · Wallpaper* · WWD · Hypebeast · Fashionista · AnOther · ELLE DECOR |
| 装置艺术 | Colossal · My Modern Met |
| 建筑空间 | ArchDaily · Yellowtrace |
| 中文设计 | 标志情报局 |
| UI/UX | Smashing Magazine · UX Collective |

## 关于 Behance / 站酷 / 优设等平台

这些平台没有公开 RSS，官方 API 也已关闭注册（Behance）或存在反爬限制（站酷/优设/花瓣）。可行方案是自建 [RSSHub](https://docs.rsshub.app/) 实例，把生成的 feed 地址粘贴到应用「订阅源管理」即可，例如：

- Behance 热门作品：`http://<你的RSSHub地址>/behance/popular`
- 站酷推荐：`http://<你的RSSHub地址>/zcool/recommend`

公共 RSSHub 实例（rsshub.app）有访问频率限制，稳定性不保证，建议自建或使用第三方公共镜像。

## 常见问题

**「订阅源管理」底部出现抓取失败的源？** 属正常现象。所有源均在海外，跨境网络波动、站点反爬策略变化都会造成偶发失败。应用会自动重试一次，托盘后台每 30 分钟也会再刷新；只有持续多天失败的源才需要处理（删除或提 issue 更换）。

## 快速开始

需要 Node.js 18+。

```bash
npm install
npm start
```

升级到最新版（不会丢失收藏与图库）：

```bash
git pull && npm start
```

## 打包分发

本地打包（输出当前平台安装包）：

```bash
npm run dist
```

云端三平台打包（推荐）：仓库附带 GitHub Actions 流水线模板（见下方），在仓库 Actions 页手动触发，或推送版本 tag 即可同时产出 macOS / Windows / Linux 安装包：

```bash
git tag v0.1.0 && git push --tags   # 自动构建并发布 Release
```

<details>
<summary>📄 如果仓库里还没有 .github/workflows/build.yml，点开展开复制此文件</summary>

```yaml
name: Build Installers

on:
  push:
    tags: ['v*']
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - name: Build installers
        run: npx electron-builder --publish never
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: DesignInspire-${{ matrix.os }}
          path: |
            dist/*.dmg
            dist/*.zip
            dist/*.exe
            dist/*.AppImage
      - name: Publish release (on tag)
        if: startsWith(github.ref, 'refs/tags/')
        uses: softprops/action-gh-release@v2
        with:
          files: |
            dist/*.dmg
            dist/*.zip
            dist/*.exe
            dist/*.AppImage
```

</details>

## 目录结构

```
src/
├── main/                 # Electron 主进程
│   ├── main.js           # 窗口、IPC、托盘常驻、后台刷新通知、dlib:// 协议
│   ├── tray.js           # 托盘图标与菜单
│   ├── moodboard.js      # 收藏拼贴离屏渲染导出 PNG
│   ├── preload.js        # contextBridge 安全桥（window.inspire）
│   ├── feeds.js          # RSS 聚合抓取 + 配图提取 + 缓存 + 自动重试 + 不规范 XML 降级解析
│   ├── store.js          # JSON 持久化（收藏 / 图库索引 / 订阅源 / 设置）
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

- [x] 托盘常驻 + 新内容角标提醒
- [x] 收藏导出为 moodboard（图片拼贴）
- [x] 扩充插画 / 包装设计源
- [x] 图库瀑布流 + 标签筛选 + 大图预览
- [x] Awwwards Blog / 中文设计源
- [ ] Behance / 站酷（需自建 RSSHub，见上文）
- [ ] 每周设计趋势摘要

## License

MIT

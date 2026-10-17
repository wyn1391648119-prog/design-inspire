// 内置订阅源：上线前均验证可访问（HTTP 200 + RSS/XML 格式）。
// 分类与需求对齐：设计案例 / 视觉灵感 / 高奢时装（秀场）/ 装置艺术 / 品牌设计 / 建筑空间 / UI·UX
// 用户可在「订阅源管理」页自由增删，自定义源会保存到本地数据文件。
module.exports = [
  // —— 设计案例 / 综合设计平台 ——
  { id: 'itsnicethat', name: "It's Nice That", url: 'https://www.itsnicethat.com/articles.rss', category: '设计案例' },
  { id: 'designboom', name: 'designboom', url: 'https://www.designboom.com/feed/', category: '设计案例' },
  { id: 'fubiz', name: 'Fubiz', url: 'https://www.fubiz.net/en/feed/', category: '设计案例' },
  { id: 'dezeen', name: 'Dezeen', url: 'https://www.dezeen.com/feed/', category: '设计案例' },
  { id: 'frameweb', name: 'FRAME', url: 'https://www.frameweb.com/feed/', category: '设计案例' },

  // —— 视觉灵感 ——
  { id: 'ignant', name: 'IGNANT', url: 'https://www.ignant.com/feed/', category: '视觉灵感' },
  { id: 'abduzeedo', name: 'Abduzeedo', url: 'https://abduzeedo.com/rss.xml', category: '视觉灵感' },
  { id: 'mindsparkle', name: 'Mindsparkle Mag', url: 'https://mindsparklemag.com/feed/', category: '视觉灵感' },
  { id: 'bpo', name: 'BP&O', url: 'https://bpando.org/feed/', category: '品牌设计' },

  // —— 高奢时装 / 秀场 ——
  { id: 'wallpaper', name: 'Wallpaper*', url: 'https://www.wallpaper.com/rss', category: '高奢时装' },
  { id: 'wwd', name: 'WWD', url: 'https://wwd.com/feed/', category: '高奢时装' },
  { id: 'hypebeast', name: 'Hypebeast', url: 'https://hypebeast.com/feed', category: '高奢时装' },
  { id: 'theimpression', name: 'The Impression', url: 'https://theimpression.com/feed/', category: '高奢时装' },
  { id: 'nowness', name: 'NOWNESS', url: 'https://www.nowness.com/feed', category: '高奢时装' },
  { id: 'elledecor', name: 'ELLE DECOR', url: 'https://www.elledecor.com/rss/all.xml/', category: '高奢时装' },

  // —— 装置艺术 / 建筑空间 ——
  { id: 'colossal', name: 'Colossal', url: 'https://www.thisiscolossal.com/feed/', category: '装置艺术' },
  { id: 'stirworld', name: 'STIRworld', url: 'https://stirworld.com/feed/', category: '装置艺术' },
  { id: 'archdaily', name: 'ArchDaily', url: 'https://www.archdaily.com/rss', category: '建筑空间' },
  { id: 'yellowtrace', name: 'Yellowtrace', url: 'https://www.yellowtrace.com.au/feed/', category: '建筑空间' },

  // —— UI / UX ——
  { id: 'smashing', name: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/feed/', category: 'UI/UX' },
  { id: 'uxcollective', name: 'UX Collective', url: 'https://uxdesign.cc/feed', category: 'UI/UX' },
];

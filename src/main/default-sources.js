// 内置订阅源：上线前均逐一验证可访问且返回有效 RSS/Atom 内容。
// 分类：设计案例 / 视觉灵感 / 插画艺术 / 包装设计 / 高奢时装（秀场）/ 装置艺术 / 品牌设计 / 建筑空间 / UI·UX
// 用户可在「订阅源管理」页自由增删，自定义源会保存到本地数据文件。
module.exports = [
  // —— 设计案例 / 综合设计平台 ——
  { id: 'itsnicethat', name: "It's Nice That", url: 'https://www.itsnicethat.com/articles.rss', category: '设计案例' },
  { id: 'designboom', name: 'designboom', url: 'https://www.designboom.com/feed/', category: '设计案例' },
  { id: 'fubiz', name: 'Fubiz', url: 'https://www.fubiz.net/en/feed/', category: '设计案例' },
  { id: 'dezeen', name: 'Dezeen', url: 'https://www.dezeen.com/feed/', category: '设计案例' },
  { id: 'weheart', name: 'We Heart', url: 'https://we-heart.com/feed/', category: '设计案例' },

  // —— 视觉灵感 ——
  { id: 'ignant', name: 'IGNANT', url: 'https://www.ignant.com/feed/', category: '视觉灵感' },
  { id: 'abduzeedo', name: 'Abduzeedo', url: 'https://abduzeedo.com/rss.xml', category: '视觉灵感' },
  { id: 'mindsparkle', name: 'Mindsparkle Mag', url: 'https://mindsparklemag.com/feed/', category: '视觉灵感' },
  { id: 'bpo', name: 'BP&O', url: 'https://bpando.org/feed/', category: '品牌设计' },

  // —— 插画艺术 ——
  { id: 'hifructose', name: 'Hi-Fructose', url: 'https://hifructose.com/feed/', category: '插画艺术' },
  { id: 'juxtapoz', name: 'Juxtapoz', url: 'https://www.juxtapoz.com/feed/', category: '插画艺术' },
  { id: 'illustrationage', name: 'Illustration Age', url: 'https://www.illustrationage.com/feed/', category: '插画艺术' },

  // —— 包装设计 ——
  { id: 'potw', name: 'Packaging of the World', url: 'https://packagingoftheworld.com/feed/', category: '包装设计' },
  { id: 'dieline', name: 'The Dieline', url: 'https://thedieline.com/feed/', category: '包装设计' },

  // —— 高奢时装 / 秀场 ——
  { id: 'wallpaper', name: 'Wallpaper*', url: 'https://www.wallpaper.com/rss', category: '高奢时装' },
  { id: 'vogue', name: 'Vogue', url: 'https://www.vogue.com/feed/rss', category: '高奢时装' },
  { id: 'harpersbazaar', name: "Harper's BAZAAR", url: 'https://www.harpersbazaar.com/rss/all.xml/', category: '高奢时装' },
  { id: 'wwd', name: 'WWD', url: 'https://wwd.com/feed/', category: '高奢时装' },
  { id: 'hypebeast', name: 'Hypebeast', url: 'https://hypebeast.com/feed', category: '高奢时装' },
  { id: 'fashionista', name: 'Fashionista', url: 'https://fashionista.com/.rss/excerpt/', category: '高奢时装' },
  { id: 'anothermag', name: 'AnOther Magazine', url: 'https://www.anothermag.com/feed', category: '高奢时装' },
  { id: 'elledecor', name: 'ELLE DECOR', url: 'https://www.elledecor.com/rss/all.xml/', category: '高奢时装' },

  // —— 装置艺术 / 建筑空间 ——
  { id: 'colossal', name: 'Colossal', url: 'https://www.thisiscolossal.com/feed/', category: '装置艺术' },
  { id: 'mymodernmet', name: 'My Modern Met', url: 'https://mymodernmet.com/feed/', category: '装置艺术' },
  { id: 'archdaily', name: 'ArchDaily', url: 'https://www.archdaily.com/rss', category: '建筑空间' },
  { id: 'yellowtrace', name: 'Yellowtrace', url: 'https://www.yellowtrace.com.au/feed/', category: '建筑空间' },

  // —— UI / UX ——
  { id: 'smashing', name: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/feed/', category: 'UI/UX' },
  { id: 'uxcollective', name: 'UX Collective', url: 'https://uxdesign.cc/feed', category: 'UI/UX' },
];

import type { Category, Product, SpecGroup } from '@/types'

export const STORE = {
  name: '可森',
  address: '黄陂南路 383 弄 12 号 1F',
  distance: '1.2km',
  hours: '08:00 – 21:30',
  phone: '021-6333-0817'
}

export const CATEGORIES: Category[] = [
  { id: 'matcha', name: '抹茶', en: 'Matcha', desc: '宇治抹茶现点现刷，每杯 4g' },
  { id: 'frappe', name: '星冰乐', en: 'Frappuccino', desc: '冰沙打底，奶油封顶' },
  { id: 'hot', name: '热咖啡', en: 'Hot Coffee', desc: '本周拼配：云南 × 埃塞俄比亚' },
  { id: 'cold', name: '冷萃', en: 'Cold Brew', desc: '低温慢萃 16 小时' },
  { id: 'season', name: '秋季限定', en: 'Seasonal', desc: '栗子、焙茶与麻薯，只到 11 月底' },
  { id: 'handbrew', name: '手冲', en: 'Pour Over', desc: '单一产地咖啡，点单后现冲' },
  { id: 'tea', name: '原叶茶', en: 'Loose Leaf', desc: '清香原叶，慢慢泡开' },
  { id: 'soda', name: '水果气泡', en: 'Fruit Soda', desc: '鲜果与气泡水的清爽组合' },
  { id: 'chocolate', name: '巧克力', en: 'Cocoa', desc: '温热可可与柔滑奶香' },
  { id: 'craft', name: '精酿', en: 'Craft Beer', desc: '从清爽酒花到烘烤麦芽' },
  { id: 'classic', name: '经典鸡尾酒', en: 'Classics', desc: '经典配方，风味干净利落' },
  { id: 'signature', name: '特调鸡尾酒', en: 'Signatures', desc: '可森吧台的咖啡与果香特调' },
  { id: 'wine', name: '杯卖葡萄酒', en: 'Wine', desc: '单杯供应，适合慢慢喝' },
  { id: 'whisky', name: '威士忌', en: 'Whisky', desc: '纯饮或配一颗大冰' },
  { id: 'gin', name: '金酒', en: 'Gin', desc: '杜松子与柑橘的清香' },
  { id: 'zero', name: '无酒精特调', en: 'Zero Proof', desc: '用茶、果汁和香草调成的无酒精饮品' }
]

export const SPEC_GROUPS: Record<string, SpecGroup> = {
  size: {
    key: 'size',
    name: '杯型',
    options: [
      { label: '中杯', sub: '360ml' },
      { label: '大杯', sub: '480ml', price: 3 },
      { label: '超大杯', sub: '600ml', price: 5 }
    ]
  },
  ice: {
    key: 'temp',
    name: '温度',
    options: [{ label: '正常冰' }, { label: '少冰' }, { label: '去冰' }]
  },
  hot: {
    key: 'temp',
    name: '温度',
    options: [{ label: '热' }, { label: '温' }]
  },
  sugar: {
    key: 'sugar',
    name: '甜度',
    options: [{ label: '标准甜' }, { label: '少甜' }, { label: '微甜' }, { label: '不另外加糖' }]
  },
  milk: {
    key: 'milk',
    name: '奶基',
    options: [{ label: '鲜牛奶' }, { label: '燕麦奶', price: 3 }, { label: '椰乳', price: 3 }]
  },
  extra: {
    key: 'extra',
    name: '加料',
    multi: true,
    options: [
      { label: '奶盖', price: 4 },
      { label: '浓缩一份', price: 4 },
      { label: '抹茶加浓', price: 3 }
    ]
  }
}

const CARAMEL: [string, string] = ['#EED6B5', '#C5976B']
const LATTE: [string, string] = ['#F1DEC4', '#C8A381']
const ROSE: [string, string] = ['#EED0C0', '#C79B83']
const STONE: [string, string] = ['#E9D6BF', '#BB9578']

export const PRODUCTS: Product[] = [
  // ---- 抹茶 ----
  {
    id: 'm1',
    cat: 'matcha',
    name: '云朵奶盖抹茶',
    en: 'Matcha Cloud Delight',
    desc: '宇治抹茶现刷，叠一层轻盈奶盖，最后撒上抹茶碎。先别搅拌，第一口最好喝。',
    price: 32,
    rating: 9.6,
    sold: 2380,
    ingredients: ['宇治抹茶', '鲜牛奶', '奶盖', '冰块'],
    specs: ['size', 'ice', 'sugar', 'milk', 'extra'],
    art: {
      cup: 'tall',
      liquid: ['#9CBF63', '#557F31'],
      milk: '#EEF2DF',
      milkRatio: 22,
      topping: 'cream',
      toppingColor: '#F6F4E8',
      dust: '#7FA548',
      ice: true,
      marble: true
    },
    tile: CARAMEL,
    badge: '招牌'
  },
  {
    id: 'm2',
    cat: 'matcha',
    name: '冰抹茶拿铁',
    en: 'Iced Matcha Latte',
    desc: '一勺蜂蜜压住抹茶的涩，牛奶托底，冰块要多。',
    price: 26,
    rating: 9.3,
    sold: 1912,
    ingredients: ['抹茶', '冰块', '蜂蜜', '牛奶'],
    specs: ['size', 'ice', 'sugar', 'milk'],
    art: { cup: 'rocks', liquid: ['#A9C77A', '#5E8A35'], milk: '#E3EBCB', milkRatio: 30, ice: true },
    tile: CARAMEL
  },
  {
    id: 'm3',
    cat: 'matcha',
    name: '厚抹茶椰云',
    en: 'Matcha Coconut Cloud',
    desc: '双倍抹茶配椰乳，口感更浓更顺，带一点椰子香。',
    price: 30,
    rating: 9.1,
    sold: 1104,
    ingredients: ['双倍抹茶', '椰乳', '冰块'],
    specs: ['size', 'ice', 'sugar', 'extra'],
    art: { cup: 'tall', liquid: ['#7FA64B', '#3F6A26'], milk: '#F4F2E6', milkRatio: 34, ice: true, straw: '#3B5A40' },
    tile: CARAMEL
  },
  {
    id: 'm4',
    cat: 'matcha',
    name: '抹茶冰博克',
    en: 'Matcha Ice Bock',
    desc: '冰博克浓缩乳打底，抹茶浮在上面，奶味很足。',
    price: 34,
    rating: 9.4,
    sold: 864,
    ingredients: ['抹茶', '冰博克', '冰块'],
    specs: ['size', 'ice', 'sugar'],
    art: { cup: 'rocks', liquid: ['#F1EDDC', '#E2DCC2'], milk: '#6F9B3C', milkRatio: 34, ice: true },
    tile: STONE
  },
  // ---- 星冰乐 ----
  {
    id: 'f1',
    cat: 'frappe',
    name: '焦糖漩涡星冰乐',
    en: 'Caramel Swirl Frappuccino',
    desc: '焦糖酱沿杯壁慢慢淋下，咖啡冰沙打底，奶油上再画一圈焦糖。',
    price: 33,
    rating: 9.4,
    sold: 2016,
    ingredients: ['浓缩咖啡', '焦糖酱', '牛奶', '奶油'],
    specs: ['size', 'ice', 'sugar', 'milk', 'extra'],
    art: {
      cup: 'tall',
      liquid: ['#C99B6C', '#86562F'],
      milk: '#F3E8D8',
      milkRatio: 18,
      topping: 'cream',
      toppingColor: '#F7EFE4',
      drizzle: '#A8682F',
      marble: true
    },
    tile: LATTE,
    badge: '人气'
  },
  {
    id: 'f2',
    cat: 'frappe',
    name: '抹茶可可碎星冰乐',
    en: 'Matcha Cocoa Chip',
    desc: '抹茶冰沙里拌进可可碎，奶油顶上再撒一把。',
    price: 34,
    rating: 9.2,
    sold: 978,
    ingredients: ['抹茶', '可可碎', '牛奶', '奶油'],
    specs: ['size', 'ice', 'sugar', 'extra'],
    art: {
      cup: 'tall',
      liquid: ['#AFC984', '#6C9441'],
      milk: '#E8EFD6',
      milkRatio: 10,
      topping: 'cream',
      toppingColor: '#F6F4EC',
      dust: '#5B3A29'
    },
    tile: CARAMEL
  },
  {
    id: 'f3',
    cat: 'frappe',
    name: '莓莓海盐芝士',
    en: 'Berry Sea-salt Cheese',
    desc: '草莓果泥打成冰沙，盖一层咸芝士奶盖。',
    price: 35,
    rating: 9.0,
    sold: 655,
    ingredients: ['草莓', '海盐芝士', '牛奶'],
    specs: ['size', 'ice', 'sugar'],
    art: {
      cup: 'tall',
      liquid: ['#EDB3BC', '#BE5A70'],
      milk: '#FBEDEF',
      milkRatio: 14,
      topping: 'cream',
      toppingColor: '#FBF6F1',
      dust: '#C9566E',
      marble: true
    },
    tile: ROSE
  },
  // ---- 热咖啡 ----
  {
    id: 'h1',
    cat: 'hot',
    name: '燕麦拿铁',
    en: 'Oat Latte',
    desc: '燕麦奶的谷物香和本周拼配很搭，拉花是咖啡师当天的心情。',
    price: 28,
    rating: 9.5,
    sold: 3120,
    ingredients: ['浓缩咖啡', '燕麦奶'],
    specs: ['size', 'hot', 'sugar', 'milk', 'extra'],
    art: { cup: 'mug', liquid: ['#B98A5E', '#6E4426'], milk: '#F4E9DA', mug: '#F3F1EA' },
    tile: STONE
  },
  {
    id: 'h2',
    cat: 'hot',
    name: '澳白',
    en: 'Flat White',
    desc: '双份浓缩，奶泡很薄，咖啡味在前面。',
    price: 30,
    rating: 9.3,
    sold: 1580,
    ingredients: ['双份浓缩', '鲜牛奶'],
    specs: ['size', 'hot', 'milk'],
    art: { cup: 'mug', liquid: ['#9C6C44', '#55331C'], milk: '#F1E2CD', mug: '#3B5A40' },
    tile: CARAMEL
  },
  {
    id: 'h3',
    cat: 'hot',
    name: '桂花美式',
    en: 'Osmanthus Americano',
    desc: '自制桂花糖浆，香气淡淡的，不会盖住咖啡。',
    price: 24,
    rating: 8.9,
    sold: 742,
    ingredients: ['浓缩咖啡', '桂花糖浆', '热水'],
    specs: ['size', 'hot', 'sugar'],
    art: { cup: 'mug', liquid: ['#6D4325', '#3A2212'], mug: '#E8D7B4' },
    tile: LATTE
  },
  {
    id: 'h4',
    cat: 'hot',
    name: '黑糖肉桂拿铁',
    en: 'Brown Sugar Cinnamon',
    desc: '黑糖和肉桂，适合降温的那天。',
    price: 31,
    rating: 9.1,
    sold: 903,
    ingredients: ['浓缩咖啡', '黑糖', '肉桂', '鲜牛奶'],
    specs: ['size', 'hot', 'sugar', 'milk'],
    art: { cup: 'mug', liquid: ['#A87449', '#5E381C'], milk: '#EFDFC8', mug: '#C9BBA5' },
    tile: LATTE
  },
  // ---- 冷萃 ----
  {
    id: 'c1',
    cat: 'cold',
    name: '橙C冷萃',
    en: 'Orange Cold Brew',
    desc: '鲜榨橙汁垫底，冷萃浮在上面，喝之前看一眼分层。',
    price: 27,
    rating: 9.2,
    sold: 1366,
    ingredients: ['冷萃咖啡', '鲜橙汁', '冰块'],
    specs: ['size', 'ice', 'sugar'],
    art: { cup: 'rocks', liquid: ['#5A3521', '#E99A43'], ice: true },
    tile: ['#E8D3B5', '#D1AE80']
  },
  {
    id: 'c2',
    cat: 'cold',
    name: '椰青冷萃',
    en: 'Coconut Cold Brew',
    desc: '椰青水代替清水，清甜不腻。',
    price: 29,
    rating: 9.0,
    sold: 820,
    ingredients: ['冷萃咖啡', '椰青水', '冰块'],
    specs: ['size', 'ice', 'sugar'],
    art: { cup: 'tall', liquid: ['#8B5E3C', '#4A2C18'], milk: '#F2EEE3', milkRatio: 26, ice: true, straw: '#E3E9D8' },
    tile: STONE
  },
  {
    id: 'c3',
    cat: 'cold',
    name: '气泡冷萃',
    en: 'Sparkling Cold Brew',
    desc: '加了苏打水，入口有点刺，尾韵是坚果味。',
    price: 28,
    rating: 8.8,
    sold: 512,
    ingredients: ['冷萃咖啡', '苏打水', '冰块'],
    specs: ['size', 'ice'],
    art: { cup: 'rocks', liquid: ['#7A4E2F', '#3E2414'], ice: true },
    tile: STONE
  },
  // ---- 秋季限定 ----
  {
    id: 's1',
    cat: 'season',
    name: '栗子抹茶拿铁',
    en: 'Chestnut Matcha Latte',
    desc: '迁西板栗做成栗子泥，和抹茶一起很有秋天的味道。',
    price: 35,
    rating: 9.7,
    sold: 1288,
    ingredients: ['栗子泥', '抹茶', '鲜牛奶', '奶油'],
    specs: ['size', 'ice', 'sugar', 'milk'],
    art: {
      cup: 'tall',
      liquid: ['#8FB05A', '#4F7630'],
      milk: '#E6D6BE',
      milkRatio: 26,
      topping: 'cream',
      toppingColor: '#F3E6D2',
      dust: '#8A5A36',
      marble: true
    },
    tile: LATTE,
    badge: '限定'
  },
  {
    id: 's2',
    cat: 'season',
    name: '焙茶麻薯拿铁',
    en: 'Hojicha Mochi Latte',
    desc: '焙茶的烘焙香配软糯麻薯，杯底有惊喜。',
    price: 33,
    rating: 9.3,
    sold: 702,
    ingredients: ['焙茶', '麻薯', '鲜牛奶'],
    specs: ['size', 'ice', 'sugar', 'milk'],
    art: {
      cup: 'tall',
      liquid: ['#C0946A', '#7C5232'],
      milk: '#F0E3D2',
      milkRatio: 20,
      topping: 'cream',
      toppingColor: '#F5ECE0',
      drizzle: '#8C5E3A',
      ice: true
    },
    tile: LATTE,
    badge: '新品'
  },
  // ---- 精酿 ----
  {
    id: 'craft-pale',
    cat: 'craft',
    name: '柑橘淡色艾尔',
    en: 'Citrus Pale Ale',
    desc: '330ml。柑橘与松针香气，收口带一点清爽的酒花苦味。',
    price: 42,
    rating: 9.2,
    sold: 126,
    ingredients: ['麦芽', '酒花', '酵母'],
    specs: [],
    art: { cup: 'pint', liquid: ['#EBA33C', '#AB5117'], milk: '#FFF0C8', milkRatio: 14 },
    tile: CARAMEL
  },
  {
    id: 'craft-stout',
    cat: 'craft',
    name: '燕麦世涛',
    en: 'Oatmeal Stout',
    desc: '330ml。烘烤麦芽带来可可与咖啡香，燕麦让酒体更圆润。',
    price: 46,
    rating: 9.4,
    sold: 102,
    ingredients: ['烘烤麦芽', '燕麦', '酒花'],
    specs: [],
    art: { cup: 'pint', liquid: ['#4C2920', '#281815'], milk: '#D1A47A', milkRatio: 14 },
    tile: LATTE
  },
  // ---- 经典鸡尾酒 ----
  {
    id: 'classic-negroni',
    cat: 'classic',
    name: '尼格罗尼',
    en: 'Negroni',
    desc: '金酒、苦味酒与甜味美思，收尾是一抹橙皮香。',
    price: 58,
    rating: 9.5,
    sold: 168,
    ingredients: ['金酒', '苦味酒', '甜味美思', '橙皮'],
    specs: [],
    art: { cup: 'rocks', liquid: ['#D8713D', '#943223'], ice: true },
    tile: ROSE
  },
  {
    id: 'classic-highball',
    cat: 'classic',
    name: '威士忌嗨棒',
    en: 'Whisky Highball',
    desc: '威士忌兑冰镇苏打水，气泡清爽，带一点柠檬香。',
    price: 52,
    rating: 9.1,
    sold: 118,
    ingredients: ['威士忌', '苏打水', '柠檬'],
    specs: [],
    art: { cup: 'pint', liquid: ['#F5DBA2', '#BD8241'], ice: true },
    tile: STONE
  },
  // ---- 特调鸡尾酒 ----
  {
    id: 'signature-coldbrew',
    cat: 'signature',
    name: '深夜冷萃',
    en: 'Midnight Cold Brew',
    desc: '可森冷萃加入深色朗姆，黑糖衬出烘焙香，尾段带一点海盐。',
    price: 62,
    rating: 9.6,
    sold: 144,
    ingredients: ['冷萃咖啡', '深色朗姆', '黑糖', '海盐'],
    specs: [],
    art: { cup: 'rocks', liquid: ['#935233', '#42241D'], ice: true },
    tile: LATTE,
    badge: '可森特调'
  },
  {
    id: 'signature-pomelo',
    cat: 'signature',
    name: '粉柚金菲士',
    en: 'Pink Grapefruit Fizz',
    desc: '粉柚、迷迭香和金酒做成的气泡特调，酸甜轻盈。',
    price: 60,
    rating: 9.3,
    sold: 89,
    ingredients: ['金酒', '粉柚', '迷迭香', '苏打水'],
    specs: [],
    art: { cup: 'pint', liquid: ['#F3B98F', '#D27466'], ice: true },
    tile: ROSE
  },
  {
    id: 'handbrew-guji',
    cat: 'handbrew',
    name: '古吉手冲',
    en: 'Guji Pour Over',
    desc: '日晒豆现冲，入口是莓果香，尾段像红茶。',
    price: 36,
    rating: 9.4,
    sold: 112,
    ingredients: ['埃塞俄比亚咖啡豆'],
    specs: [],
    art: { cup: 'mug', liquid: ['#8C5432', '#512C1F'] },
    tile: LATTE
  },
  {
    id: 'tea-jasmine',
    cat: 'tea',
    name: '茉莉绿茶',
    en: 'Jasmine Green Tea',
    desc: '茉莉花香清透，茶汤柔和。',
    price: 25,
    rating: 9.0,
    sold: 82,
    ingredients: ['茉莉花茶'],
    specs: [],
    art: { cup: 'mug', liquid: ['#D6B96E', '#A98C46'] },
    tile: STONE
  },
  {
    id: 'soda-plum',
    cat: 'soda',
    name: '青梅气泡',
    en: 'Green Plum Soda',
    desc: '青梅果浆兑苏打水，酸甜轻盈。',
    price: 28,
    rating: 9.2,
    sold: 93,
    ingredients: ['青梅', '苏打水'],
    specs: [],
    art: { cup: 'pint', liquid: ['#DBD693', '#B4A755'], ice: true },
    tile: STONE
  },
  {
    id: 'chocolate-seasalt',
    cat: 'chocolate',
    name: '海盐热可可',
    en: 'Sea Salt Hot Cocoa',
    desc: '浓可可和鲜奶煮热，海盐托出巧克力香。',
    price: 32,
    rating: 9.3,
    sold: 76,
    ingredients: ['可可', '鲜牛奶', '海盐'],
    specs: [],
    art: { cup: 'mug', liquid: ['#8A5B44', '#4B291F'], milk: '#E9CEB3' },
    tile: CARAMEL
  },
  {
    id: 'wine-red',
    cat: 'wine',
    name: '单杯红葡萄酒',
    en: 'Red Wine by the Glass',
    desc: '150ml。红果香清晰，单宁柔和。',
    price: 49,
    rating: 9.2,
    sold: 65,
    ingredients: ['红葡萄酒'],
    specs: [],
    art: { cup: 'rocks', liquid: ['#944754', '#5A2436'] },
    tile: ROSE
  },
  {
    id: 'whisky-malt',
    cat: 'whisky',
    name: '单一麦芽威士忌',
    en: 'Single Malt Whisky',
    desc: '30ml。蜂蜜和橡木香，余味温暖。',
    price: 58,
    rating: 9.3,
    sold: 57,
    ingredients: ['单一麦芽威士忌'],
    specs: [],
    art: { cup: 'rocks', liquid: ['#D99A4A', '#A35F24'], ice: true },
    tile: CARAMEL
  },
  {
    id: 'gin-tonic',
    cat: 'gin',
    name: '柠檬金汤力',
    en: 'Lemon Gin & Tonic',
    desc: '杜松香和柠檬皮香，汤力水带一点清苦。',
    price: 48,
    rating: 9.0,
    sold: 67,
    ingredients: ['金酒', '汤力水', '柠檬'],
    specs: [],
    art: { cup: 'pint', liquid: ['#EEE4BC', '#C5B16F'], ice: true },
    tile: STONE
  },
  {
    id: 'zero-peach',
    cat: 'zero',
    name: '白桃乌龙菲士',
    en: 'Peach Oolong Fizz',
    desc: '白桃、冷泡乌龙和苏打水，带一点乌龙回甘。',
    price: 34,
    rating: 9.3,
    sold: 91,
    ingredients: ['白桃', '乌龙茶', '苏打水'],
    specs: [],
    art: { cup: 'pint', liquid: ['#F2BD9D', '#CF8A62'], ice: true },
    tile: ROSE
  }
]

export function getProduct(id: string) {
  return PRODUCTS.find((p) => p.id === id)
}

export function specGroupsOf(p: Product): SpecGroup[] {
  return p.specs.map((k) => SPEC_GROUPS[k]).filter(Boolean)
}

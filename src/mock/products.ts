import type { Category, Product, SpecGroup } from '@/types'

export const STORE = {
  name: '苔生 新天地店',
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
  { id: 'season', name: '秋季限定', en: 'Seasonal', desc: '栗子、焙茶与麻薯，只到 11 月底' }
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

const GREEN: [string, string] = ['#B9C99F', '#98AC7D']
const LATTE: [string, string] = ['#D9CBB4', '#B9A283']
const ROSE: [string, string] = ['#E9C9C6', '#C99A97']
const STONE: [string, string] = ['#CFD3C4', '#A8AE9A']

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
    tile: GREEN,
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
    tile: GREEN
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
    tile: GREEN
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
    tile: GREEN
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
    tile: GREEN
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
  }
]

export function getProduct(id: string) {
  return PRODUCTS.find((p) => p.id === id)
}

export function specGroupsOf(p: Product): SpecGroup[] {
  return p.specs.map((k) => SPEC_GROUPS[k]).filter(Boolean)
}

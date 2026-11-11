export type TabKey = 'square' | 'menu' | 'mine'

/** 用 CSS 画出来的饮品插画参数（替代真实商品图） */
export interface DrinkArtSpec {
  cup: 'tall' | 'pint' | 'rocks' | 'mug'
  liquid: [string, string]
  /** 顶部奶层颜色 */
  milk?: string
  /** 奶层占比 0~60 (%) */
  milkRatio?: number
  topping?: 'cream' | 'none'
  toppingColor?: string
  /** 奶盖上的碎屑颜色 */
  dust?: string
  /** 淋酱颜色 */
  drizzle?: string
  ice?: boolean
  marble?: boolean
  /** 马克杯陶瓷颜色 */
  mug?: string
  straw?: string
}

export interface SpecOption {
  label: string
  sub?: string
  price?: number
}

export interface SpecGroup {
  key: string
  name: string
  multi?: boolean
  options: SpecOption[]
}

export interface Category {
  id: string
  name: string
  en: string
  desc: string
}

export interface Product {
  id: string
  cat: string
  name: string
  en: string
  desc: string
  price: number
  rating: number
  sold: number
  ingredients: string[]
  specs: string[]
  art: DrinkArtSpec
  tile: [string, string]
  badge?: string
}

export interface CartItem {
  key: string
  productId: string
  name: string
  en: string
  specText: string
  unitPrice: number
  qty: number
  art: DrinkArtSpec
  tile: [string, string]
}

export type CouponType = 'cash' | 'discount' | 'gift'

export interface Coupon {
  id: string
  title: string
  type: CouponType
  /** cash: 减免金额；discount: 折扣率(0.85)；gift: 兑换上限金额 */
  value: number
  threshold: number
  maxOff?: number
  issuer: string
  reason: string
  startAt: number
  endAt: number
  status: 'unused' | 'used'
  usedAt?: number
  isNew?: boolean
}

export interface Order {
  id: string
  no: string
  code: string
  items: CartItem[]
  subtotal: number
  discount: number
  deliveryFee: number
  total: number
  couponTitle?: string
  pay: 'balance' | 'wechat'
  mode: 'pickup' | 'delivery'
  remark: string
  createdAt: number
  store: string
  archived?: boolean
}

export interface RechargeRecord {
  id: string
  amount: number
  bonus: number
  at: number
}

export interface CoverSpec {
  bg: [string, string]
  ratio: number
  style: 'drink' | 'type' | 'circles'
  text?: string
  sub?: string
  art?: DrinkArtSpec
  light?: boolean
}

export interface Post {
  id: string
  author: string
  role: string
  avatar: [string, string]
  title: string
  content: string[]
  tag: string
  likes: number
  comments: number
  at: number
  cover: CoverSpec
  productId?: string
}

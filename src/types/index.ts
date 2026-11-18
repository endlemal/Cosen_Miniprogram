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

/** 商品角标：契约 v1.1.0 起为多选数组（招牌/人气/限定/新品/可森特调） */
export type ProductBadge = string

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
  /** 契约 badge 为 array<string>；旧 mock 字符串请先过 normalizeBadges */
  badge?: ProductBadge[]
  /**
   * 契约 v1.5.0 商品封面图：相对 API 根的路径，未上传为空串/缺省。
   * mock 数据没有该字段；组件展示前用 @/utils/media 的 mediaUrl() 归一化。
   */
  coverUrl?: string
  /** 契约 v1.5.0 商品相册（相对路径数组，第一张即封面）；mock 数据缺省 */
  gallery?: string[]
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
  /** 契约 v1.5.0 商品封面（相对路径，来自商品；未上传为空） */
  coverUrl?: string
}

export type CouponType = 'cash' | 'discount' | 'gift'

/** 契约 CouponUser.status 五态（unused 在前端映射成 available） */
export type CouponStatus = 'unused' | 'used' | 'expired' | 'transferred' | 'frozen'

export interface Coupon {
  /** mock 用本地 id；真实数据映射为 couponNo */
  id: string
  /** 契约券实例号（真实接口下单时作为 CreateOrderReq.couponId） */
  couponNo?: string
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
  status: CouponStatus
  usedAt?: number
  /** 转赠时间（status=transferred 时展示） */
  transferAt?: number
  isNew?: boolean
}

/** 支付方式：mixed（储值 + 微信组合）契约已有，本轮不做 UI，只留类型位 */
export type PayMode = 'balance' | 'wechat' | 'mixed'

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
  pay: PayMode
  /** 契约 fulfillType 已只保留 pickup；delivery 仅存于 mock 历史订单 */
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

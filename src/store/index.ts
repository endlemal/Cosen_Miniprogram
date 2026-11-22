/**
 * 轻量全局状态：reactive + 本地缓存，不额外引入 Pinia。
 * 所有数据都是 Mock，"重置演示数据" 会恢复初始状态。
 */
import { reactive, computed, watch } from 'vue'
import type { OrderStatus } from '@/api/types'
import type { CartItem, Coupon, Order, Product, RechargeRecord, SpecGroup, TabKey } from '@/types'
import { STORE, PRODUCTS } from '@/mock/products'
import { RECHARGE_TIERS, REDEEM_CODES, seedCoupons, seedOrders, seedRecharges } from '@/mock/seed'
import { pad } from '@/utils/format'

const KEY = 'mossy-state-v1'
const D = 24 * 3600 * 1000

interface Persisted {
  cart: CartItem[]
  rechargeQuantities: Record<number, number>
  balance: number
  rechargeTotal: number
  bonusTotal: number
  points: number
  coupons: Coupon[]
  orders: Order[]
  recharges: RechargeRecord[]
  likes: Record<string, boolean>
  mode: 'pickup' | 'delivery'
  tableNo: string
  seq: number
}

function initial(): Persisted {
  return {
    cart: [],
    rechargeQuantities: {},
    balance: 236,
    rechargeTotal: 500,
    bonusTotal: 100,
    points: 1280,
    coupons: seedCoupons(),
    orders: seedOrders(),
    recharges: seedRecharges(),
    likes: {},
    mode: 'pickup',
    tableNo: '',
    seq: 26
  }
}

export const state = reactive({
  ...initial(),
  ui: {
    tab: 'square' as TabKey,
    squareEnabled: true,
    /** 从其他页面跳回点单页时要打开的商品 */
    pendingProductId: '',
    /** 加购时让购物车按钮轻跳一下 */
    cartPulse: 0
  }
})

let hydrated = false
export function hydrate() {
  if (hydrated) return
  hydrated = true
  try {
    const raw = uni.getStorageSync(KEY)
    if (raw) Object.assign(state, typeof raw === 'string' ? JSON.parse(raw) : raw)
    // 桌号仅在本次到店期间有效，兼容清除旧版持久化的桌号。
    state.tableNo = ''
  } catch (e) {
    /* 缓存损坏就用初始数据 */
  }
  watch(
    () => {
      const { ui, tableNo, ...rest } = state
      return JSON.stringify(rest)
    },
    (json) => {
      try {
        uni.setStorageSync(KEY, json)
      } catch (e) {
        /* noop */
      }
    }
  )
}

export function resetDemo() {
  Object.assign(state, initial())
  state.ui.tab = 'mine'
}

/* ---------------- 导航 ---------------- */

export function setSquareEnabled(enabled: boolean) {
  state.ui.squareEnabled = enabled
  if (!enabled && state.ui.tab === 'square') switchTab('menu')
}

export function switchTab(tab: TabKey) {
  state.ui.tab = tab === 'square' && !state.ui.squareEnabled ? 'menu' : tab
}

export function bindTableNo(tableNo: string) {
  const clean = String(tableNo || '').trim().toUpperCase()
  state.tableNo = /^[A-Z0-9_-]{1,24}$/.test(clean) ? clean : ''
}

export function extractTableNo(query?: Record<string, any> | null): string {
  if (!query || typeof query !== 'object') return ''
  const normalize = (raw: unknown): string => {
    const clean = String(raw || '').trim().toUpperCase()
    return /^[A-Z0-9_-]{1,24}$/.test(clean) ? clean : ''
  }
  const direct = normalize(query.tableNo || query.table)
  if (direct) return direct
  if (query.scene) {
    let scene = String(query.scene)
    try {
      scene = decodeURIComponent(scene)
    } catch {
      /* keep raw */
    }
    const prefixMatch = scene.match(/^(?:t_|table_)([A-Za-z0-9_-]{1,24})$/i)
    if (prefixMatch) return normalize(prefixMatch[1])
    const kvMatch = scene.match(/(?:^|[&;])(?:t|table|tableNo)=([A-Za-z0-9_-]{1,24})/i)
    if (kvMatch) return normalize(kvMatch[1])
  }
  if (query.q) {
    let url = String(query.q)
    try {
      url = decodeURIComponent(url)
    } catch {
      /* keep raw */
    }
    const paramMatch = url.match(/[?&](?:tableNo|table|t)=([A-Za-z0-9_-]{1,24})/i)
    if (paramMatch) return normalize(paramMatch[1])
    const pathMatch = url.match(/\/table\/([A-Za-z0-9_-]{1,24})(?:[/?#]|$)/i)
    if (pathMatch) return normalize(pathMatch[1])
  }
  return ''
}

/** 从子页面回到首页某个 tab（可选：打开某个商品） */
export function backToTab(tab: TabKey, productId = '') {
  switchTab(tab)
  state.ui.pendingProductId = productId
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack({ delta: pages.length - 1 })
  } else {
    uni.reLaunch({ url: '/pages/index/index' })
  }
}

/* ---------------- 购物车 ---------------- */

export type Selection = Record<string, number | number[]>

export function describeSelection(groups: SpecGroup[], sel: Selection) {
  let extra = 0
  const labels: string[] = []
  groups.forEach((g) => {
    const v = sel[g.key]
    const idx = Array.isArray(v) ? v : [v ?? 0]
    idx.forEach((i) => {
      const o = g.options[i]
      if (!o) return
      extra += o.price || 0
      labels.push(o.label)
    })
  })
  return { extra, text: labels.join(' / ') }
}

/**
 * 加入购物车。
 * v1.6.0：售罄（soldOut）直接从数据层拦截，防止卡片快捷加购 / 规格面板漏判。
 * @returns false = 未加入（售罄）
 */
export function addToCart(p: Product, groups: SpecGroup[], sel: Selection, qty = 1): boolean {
  if (p.soldOut) {
    uni.showToast({ title: '该商品已售罄', icon: 'none', duration: 1600 })
    return false
  }
  const { extra, text } = describeSelection(groups, sel)
  const key = `${p.id}|${text}`
  const hit = state.cart.find((c) => c.key === key)
  if (hit) hit.qty += qty
  else
    state.cart.push({
      key,
      productId: p.id,
      name: p.name,
      en: p.en,
      specText: text,
      unitPrice: p.price + extra,
      qty,
      art: p.art,
      tile: p.tile,
      coverUrl: p.coverUrl || (p.gallery && p.gallery[0]) || ''
    })
  state.ui.cartPulse++
  return true
}

export function changeQty(key: string, delta: number) {
  const i = state.cart.findIndex((c) => c.key === key)
  if (i < 0) return
  const next = state.cart[i].qty + delta
  if (next <= 0) state.cart.splice(i, 1)
  else state.cart[i].qty = next
}

export function clearCart() {
  state.cart.splice(0, state.cart.length)
  state.rechargeQuantities = {}
}

export function changeRechargeQty(amount: number, delta: number) {
  const qty = (state.rechargeQuantities[amount] || 0) + delta
  if (qty > 0) state.rechargeQuantities[amount] = qty
  else delete state.rechargeQuantities[amount]
  if (delta > 0) state.ui.cartPulse++
}

export function reorder(order: Order) {
  order.items.forEach((it) => {
    const hit = state.cart.find((c) => c.key === it.key)
    if (hit) hit.qty += it.qty
    else state.cart.push({ ...it })
  })
  state.ui.cartPulse++
}

export const rechargeCart = computed(() => RECHARGE_TIERS
  .map((tier) => ({ ...tier, qty: state.rechargeQuantities[tier.amount] || 0 }))
  .filter((tier) => tier.qty > 0))
export const rechargeCartTotal = computed(() => rechargeCart.value.reduce((s, t) => s + t.amount * t.qty, 0))
export const cartCount = computed(() =>
  state.cart.reduce((s, c) => s + c.qty, 0) + rechargeCart.value.reduce((s, t) => s + t.qty, 0)
)
export const cartTotal = computed(() => state.cart.reduce((s, c) => s + c.qty * c.unitPrice, 0))

export function qtyOfProduct(id: string) {
  return state.cart.filter((c) => c.productId === id).reduce((s, c) => s + c.qty, 0)
}

/* ---------------- 礼品券 ---------------- */

export type CouponState = 'available' | 'used' | 'expired' | 'transferred' | 'frozen'

/** 契约 CouponUser.status 五态 → 券页 Tab 状态（unused 且有有效期 = available） */
export function couponState(c: Coupon, now = Date.now()): CouponState {
  if (c.status === 'used') return 'used'
  if (c.status === 'transferred') return 'transferred'
  if (c.status === 'frozen') return 'frozen'
  if (c.status === 'expired' || c.endAt < now) return 'expired'
  return 'available'
}

export function couponFace(c: Coupon) {
  if (c.type === 'cash') return { value: String(c.value), unit: '元', prefix: '¥' }
  if (c.type === 'discount') return { value: String(Math.round(c.value * 100) / 10), unit: '折', prefix: '' }
  return { value: '1', unit: c.scope ? '件' : '杯', prefix: '' }
}

export function couponRule(c: Coupon) {
  if (c.scope && c.type === 'gift') return '范围内任选一件'
  if (c.type === 'cash') return c.threshold > 0 ? `满 ${c.threshold} 元可用` : '无门槛'
  if (c.type === 'discount') return `${c.scope ? '适用商品' : '全单'}${Math.round(c.value * 100) / 10}折${c.maxOff ? `，最多减 ${c.maxOff} 元` : ''}`
  return `任意一杯 ${c.value} 元以内饮品免单`
}

/** 计算一张券在当前订单上的优惠 */
export function evalCoupon(c: Coupon, items: CartItem[], subtotal: number): { ok: boolean; off: number; reason?: string } {
  const st = couponState(c)
  if (st === 'used') return { ok: false, off: 0, reason: '已使用' }
  if (st === 'expired') return { ok: false, off: 0, reason: '已过期' }
  if (st === 'transferred') return { ok: false, off: 0, reason: '已转赠' }
  if (st === 'frozen') return { ok: false, off: 0, reason: '已冻结' }
  if (!items.length) return { ok: false, off: 0, reason: '购物车是空的' }
  if (c.startAt > Date.now()) return { ok: false, off: 0, reason: '尚未生效' }
  if (c.scope) {
    const {kind, targets} = c.scope
    const codes = new Set(targets.map(target => target.code))
    items = items.filter(item => {
      const product = PRODUCTS.find(p => p.id === item.productId)
      return kind === 'product' ? codes.has(item.productId) : !!product && codes.has(product.cat)
    })
    if (!items.length) return { ok: false, off: 0, reason: '购物车中没有适用商品' }
    // The order API prices eligible lines from the current catalog.
    const prices = items.map(item => Math.round((PRODUCTS.find(p => p.id === item.productId)?.price ?? item.unitPrice) * 100))
    subtotal = items.reduce((sum, item, index) => sum + prices[index]! * item.qty, 0) / 100
    if (c.type === 'gift') return { ok: true, off: Math.max(...prices) / 100 }
  }
  if (subtotal < c.threshold) return { ok: false, off: 0, reason: `还差 ${Math.ceil(c.threshold - subtotal)} 元可用` }
  let off = 0
  if (c.type === 'cash') off = Math.min(c.value, subtotal)
  else if (c.type === 'discount') off = Math.min(Math.round(Math.round(subtotal * 100) * (100 - Math.round(c.value * 100)) / 100) / 100, c.maxOff ?? Infinity)
  else {
    if (!items.some(item => item.unitPrice <= c.value)) return { ok: false, off: 0, reason: '没有符合面额的商品' }
    off = Math.min(Math.max(...items.map((i) => i.unitPrice)), c.value)
  }
  return { ok: true, off: Math.round(off * 100) / 100 }
}

export function bestCoupon(items: CartItem[], subtotal: number) {
  let best: { id: string; off: number } | null = null
  state.coupons.forEach((c) => {
    const r = evalCoupon(c, items, subtotal)
    if (r.ok && (!best || r.off > best.off)) best = { id: c.id, off: r.off }
  })
  return best as { id: string; off: number } | null
}

export const newCouponCount = computed(
  () => state.coupons.filter((c) => c.isNew && couponState(c) === 'available').length
)
export const availableCouponCount = computed(
  () => state.coupons.filter((c) => couponState(c) === 'available').length
)

export function markCouponsSeen() {
  state.coupons.forEach((c) => (c.isNew = false))
}

export function redeemCode(raw: string): { ok: boolean; msg: string } {
  const code = raw.trim().toUpperCase()
  if (!code) return { ok: false, msg: '请输入兑换码' }
  const tpl = REDEEM_CODES[code]
  if (!tpl) return { ok: false, msg: '兑换码不存在，请核对后重试' }
  const id = `cp-${code}`
  if (state.coupons.some((c) => c.id === id)) return { ok: false, msg: '这个兑换码已经领过了' }
  const { days, ...rest } = tpl
  const now = Date.now()
  state.coupons.unshift({ ...rest, id, startAt: now, endAt: now + days * D, status: 'unused' })
  return { ok: true, msg: `已领取「${tpl.title}」` }
}

/* ---------------- 储值 ---------------- */

export function recharge(amount: number, bonus: number) {
  state.balance = Math.round((state.balance + amount + bonus) * 100) / 100
  state.rechargeTotal += amount
  state.bonusTotal += bonus
  state.recharges.unshift({ id: `r${Date.now()}`, amount, bonus, at: Date.now() })
}

export const memberLevel = computed(() => {
  const t = state.rechargeTotal
  if (t >= 2000) return { name: '深焙会员', next: 0, nextName: '' }
  if (t >= 500) return { name: '醇香会员', next: 2000 - t, nextName: '深焙' }
  return { name: '可森会员', next: 500 - t, nextName: '醇香' }
})

/* ---------------- 订单 ---------------- */

export interface PlaceOrderInput {
  items: CartItem[]
  subtotal: number
  discount: number
  deliveryFee: number
  couponId?: string
  pay: 'balance' | 'wechat'
  mode: 'pickup' | 'delivery'
  remark: string
}

export function placeOrder(input: PlaceOrderInput): Order {
  const total = Math.max(0, Math.round((input.subtotal - input.discount + input.deliveryFee) * 100) / 100)
  if (input.pay === 'balance') state.balance = Math.round((state.balance - total) * 100) / 100
  const coupon = state.coupons.find((c) => c.id === input.couponId)
  if (coupon) {
    coupon.status = 'used'
    coupon.usedAt = Date.now()
    coupon.isNew = false
  }
  state.seq += 1
  const now = new Date()
  const no =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())} ` +
    `${pad(now.getHours())}${pad(now.getMinutes())} ${pad(Math.floor(Math.random() * 9000) + 1000, 4)}`
  const order: Order = {
    id: `o${Date.now()}`,
    no,
    code: `${input.mode === 'pickup' ? 'A' : 'B'}${pad(state.seq, 3)}`,
    items: input.items.map((i) => ({ ...i })),
    subtotal: input.subtotal,
    discount: input.discount,
    deliveryFee: input.deliveryFee,
    total,
    couponTitle: coupon?.title,
    pay: input.pay,
    mode: input.mode,
    remark: input.remark,
    createdAt: Date.now(),
    store: STORE.name
  }
  state.orders.unshift(order)
  state.points += Math.floor(total)
  state.cart.splice(0, state.cart.length)
  return order
}

/**
 * Mock 订单状态（契约 4 态）：mock 下单即支付完成，未归档 = 已支付，归档 = 已完成。
 * v1.6.0：制作中 / 待取餐已下线，不再有进度推进。
 */
export function mockOrderStatus(o: Order): OrderStatus {
  return o.archived ? 'completed' : 'paid'
}

/**
 * 注销 / 退出登录：清本地缓存与内存里的演示数据（token 由 api/token 清理）。
 * 清完直接 reLaunch 登录页，上下文里不再残留上一账号的余额、券与订单。
 */
export function clearLocalCache() {
  try {
    uni.removeStorageSync(KEY)
  } catch (e) {
    /* storage 不可用时忽略 */
  }
  Object.assign(state, initial())
  switchTab('square')
  state.ui.pendingProductId = ''
}

import type { Coupon, Order, RechargeRecord } from '@/types'
import { PRODUCTS, STORE } from './products'

const D = 24 * 3600 * 1000

export const USER = {
  name: 'Vivian',
  phone: '138****0817',
  memberNo: '6201 0817 3325',
  since: '2024.05'
}

/** 储值档位：充 500 送 100，充 1000 送 300 */
export const RECHARGE_TIERS = [
  { amount: 500, bonus: 100, name: 'Sage 储值', note: '相当于 8.3 折' },
  { amount: 1000, bonus: 300, name: 'Forest 储值', note: '相当于 7.7 折', hot: true }
]

/** 商家发放的礼品券（Mock） */
export function seedCoupons(now = Date.now()): Coupon[] {
  return [
    {
      id: 'cp1',
      title: '雨天暖心券',
      type: 'cash',
      value: 8,
      threshold: 30,
      issuer: '店长 Mia',
      reason: '下雨天给会员的一点心意',
      startAt: now - 1 * D,
      endAt: now + 10 * D,
      status: 'unused',
      isNew: true
    },
    {
      id: 'cp2',
      title: '新品尝鲜券',
      type: 'discount',
      value: 0.85,
      threshold: 0,
      maxOff: 10,
      issuer: '苔生 新天地店',
      reason: '秋季限定上新',
      startAt: now - 2 * D,
      endAt: now + 6 * D,
      status: 'unused',
      isNew: true
    },
    {
      id: 'cp3',
      title: '生日月饮品券',
      type: 'gift',
      value: 38,
      threshold: 0,
      issuer: '苔生会员中心',
      reason: '11 月生日礼遇',
      startAt: now - 6 * D,
      endAt: now + 23 * D,
      status: 'unused'
    },
    {
      id: 'cp4',
      title: '早安券',
      type: 'cash',
      value: 5,
      threshold: 0,
      issuer: '咖啡师 阿森',
      reason: '工作日早 8 点到 10 点',
      startAt: now - 12 * D,
      endAt: now + 3 * D,
      status: 'used',
      usedAt: now - 4 * D
    },
    {
      id: 'cp5',
      title: '周年庆券',
      type: 'cash',
      value: 15,
      threshold: 60,
      issuer: '苔生 新天地店',
      reason: '开店三周年',
      startAt: now - 30 * D,
      endAt: now - 3 * D,
      status: 'unused'
    }
  ]
}

/** 商家兑换码（Mock）：在礼品券页输入即可领取 */
export const REDEEM_CODES: Record<string, Omit<Coupon, 'id' | 'startAt' | 'endAt' | 'status'> & { days: number }> = {
  MOSS2026: {
    title: '苔生兑换礼',
    type: 'cash',
    value: 6,
    threshold: 25,
    issuer: '苔生 新天地店',
    reason: '门店兑换码',
    days: 14,
    isNew: true
  },
  MATCHA88: {
    title: '抹茶日 8.8 折',
    type: 'discount',
    value: 0.88,
    threshold: 0,
    maxOff: 12,
    issuer: '店长 Mia',
    reason: '抹茶日限定',
    days: 7,
    isNew: true
  }
}

function snap(id: string, specText: string, qty: number, extra = 0) {
  const p = PRODUCTS.find((x) => x.id === id)!
  return {
    key: `${id}|${specText}`,
    productId: id,
    name: p.name,
    en: p.en,
    specText,
    unitPrice: p.price + extra,
    qty,
    art: p.art,
    tile: p.tile
  }
}

export function seedOrders(now = Date.now()): Order[] {
  const a = [snap('m1', '大杯 / 少冰 / 少甜 / 鲜牛奶', 1, 3), snap('h1', '中杯 / 热 / 标准甜 / 燕麦奶', 1, 3)]
  const b = [snap('f1', '中杯 / 正常冰 / 标准甜 / 鲜牛奶', 2)]
  return [
    {
      id: 'o-seed-2',
      no: '20261105 0912 3371',
      code: 'A018',
      items: a,
      subtotal: 66,
      discount: 8,
      deliveryFee: 0,
      total: 58,
      couponTitle: '会员满减券',
      pay: 'balance',
      mode: 'pickup',
      remark: '',
      createdAt: now - 2 * D - 3 * 3600 * 1000,
      store: STORE.name,
      archived: true
    },
    {
      id: 'o-seed-1',
      no: '20261031 1530 2208',
      code: 'B042',
      items: b,
      subtotal: 66,
      discount: 0,
      deliveryFee: 4,
      total: 70,
      pay: 'wechat',
      mode: 'delivery',
      remark: '放前台',
      createdAt: now - 7 * D,
      store: STORE.name,
      archived: true
    }
  ]
}

export function seedRecharges(now = Date.now()): RechargeRecord[] {
  return [{ id: 'r-seed', amount: 500, bonus: 100, at: now - 40 * D }]
}

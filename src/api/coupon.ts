/**
 * 优惠券接口（契约 v1.4.0 第二组 2 个）：
 *   GET /app/coupons              我的券背包（可选 status 过滤，本期不分页，上限 100）
 *   GET /app/coupons/{couponNo}   券详情（非本人/不存在统一 40403，防枚举）
 *
 * 真实数据 → 页面模型（src/types 的 Coupon）：
 *   - 金额分 → 元；折扣率原样保留
 *   - status 原样映射契约五态；页面 Tab 由 store 的 couponState 统一派生
 *   - couponNo 同时写入 Coupon.couponNo，下单时作为 CreateOrderReq.couponId
 */
import { request } from './request'
import { centToYuan } from './money'
import type { Coupon } from '@/types'
import type { CouponUserDto, CouponUserStatus } from './types'

/** 券背包；status 缺省返回全部（最多 100 张） */
export function listMyCoupons(status?: CouponUserStatus): Promise<CouponUserDto[]> {
  return request<CouponUserDto[]>('/app/coupons', { query: { status } })
}

/** 券详情；40403 由页面当「空状态」处理（request 层对券路径不弹错） */
export function getCoupon(couponNo: string): Promise<CouponUserDto> {
  return request<CouponUserDto>(`/app/coupons/${encodeURIComponent(couponNo)}`)
}

/* ---------------- DTO → 页面模型 ---------------- */

function toTs(iso?: string | null): number {
  if (!iso) return 0
  const value = Date.parse(iso)
  return Number.isFinite(value) ? value : 0
}

const NEW_COUPON_WINDOW = 3 * 86400000

export function toCoupon(dto: CouponUserDto): Coupon {
  return {
    id: dto.couponNo,
    couponNo: dto.couponNo,
    title: dto.title,
    type: dto.type,
    // discount 券用折扣率；cash/gift 用面额（分 → 元）
    value: dto.type === 'discount' ? dto.discountRate ?? 1 : centToYuan(dto.valueCent ?? 0),
    threshold: centToYuan(dto.thresholdCent ?? 0),
    maxOff: dto.maxOffCent != null ? centToYuan(dto.maxOffCent) : undefined,
    issuer: dto.issuer || '可森',
    reason: dto.reason || '',
    startAt: toTs(dto.startAt),
    endAt: toTs(dto.endAt),
    status: dto.status,
    usedAt: dto.usedAt ? toTs(dto.usedAt) : undefined,
    transferAt: dto.transferAt ? toTs(dto.transferAt) : undefined,
    // 「新到」角标仅 mock 演示使用；真实数据用创建时间 3 天内做启发式
    isNew: dto.createTime ? Date.now() - toTs(dto.createTime) < NEW_COUPON_WINDOW : false
  }
}

export function toCoupons(dtos: CouponUserDto[]): Coupon[] {
  return dtos.map(toCoupon)
}

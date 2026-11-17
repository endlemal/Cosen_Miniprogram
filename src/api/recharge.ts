/**
 * 充值接口（契约 v1.4.0 第三组 3 个）：
 *   GET  /app/recharge/tiers        档位列表（公开，无需 token）
 *   POST /app/recharges             创建充值单（Header Idempotency-Key 必填）
 *   GET  /app/recharges/{rechargeNo} 充值状态查询（只能查本人；不存在/非本人 40407）
 *
 * 关键约定（docs/recharge-api-draft.md）：
 *   - 档位金额由服务端下发，前端只渲染不硬编码；available=false 置灰但保留展示；
 *   - 创建充值单幂等：同 key 同 payload 返回 HTTP 200 + 原充值单（不使用 40925）；
 *     同 key 不同 payload 返回 40007；
 *   - status 四态 pending / paid / closed / failed；failed 带 failCode/failMsg；
 *   - pending 时前端按 1s/2s/3s 退避轮询查询接口，最多 60s。
 *
 * 幂等键命名空间：充值 key 统一以 `cosen-recharge:` 开头，与下单 key 分开生成/存放，
 * 避免两类单据共用同一个 key（后端幂等表也可能按业务区分）。
 */
import { genIdempotencyKey, request } from './request'
import { centToYuan } from './money'
import type { CreateRechargeReq, RechargeOrderDto, RechargeTierDto } from './types'

/** 充值幂等键前缀：与下单 key 使用不同命名空间 */
export const RECHARGE_IDEMPOTENCY_PREFIX = 'cosen-recharge:'

/** 生成充值专用幂等键（UUID 前加前缀，长度仍 <= 64） */
export function newRechargeIdempotencyKey(): string {
  return `${RECHARGE_IDEMPOTENCY_PREFIX}${genIdempotencyKey()}`
}

/** 档位列表：公开接口，显式 auth:false，不带会员 token */
export function listRechargeTiers(): Promise<RechargeTierDto[]> {
  return request<RechargeTierDto[]>('/app/recharge/tiers', { auth: false })
}

/**
 * 创建充值单；Idempotency-Key 必填（Header）。
 * 同一次提交重试请复用同一个 key（由调用方保存）。
 */
export function createRecharge(params: CreateRechargeReq, idempotencyKey?: string): Promise<RechargeOrderDto> {
  const key = idempotencyKey || newRechargeIdempotencyKey()
  return request<RechargeOrderDto>('/app/recharges', {
    method: 'POST',
    data: {
      tierCode: params.tierCode,
      payMode: params.payMode ?? 'wechat'
    },
    headers: { 'Idempotency-Key': key }
  })
}

/** 充值状态查询（40407 = 不存在/非本人，防充值单号枚举） */
export function getRecharge(rechargeNo: string): Promise<RechargeOrderDto> {
  return request<RechargeOrderDto>(`/app/recharges/${encodeURIComponent(rechargeNo)}`)
}

/* ---------------- DTO → 页面模型 ---------------- */

/** 充值页档位展示模型（金额已转元） */
export interface RechargeTierView {
  tierCode: string
  name: string
  amount: number
  bonus: number
  total: number
  note: string
  hot: boolean
  available: boolean
}

export function toRechargeTier(dto: RechargeTierDto): RechargeTierView {
  return {
    tierCode: dto.tierCode,
    name: dto.name,
    amount: centToYuan(dto.amountCent),
    bonus: centToYuan(dto.bonusCent),
    total: centToYuan(dto.totalCent),
    note: dto.note ?? '',
    hot: dto.hot === true,
    available: dto.available === true
  }
}

export function toRechargeTiers(dtos: RechargeTierDto[]): RechargeTierView[] {
  return dtos.map(toRechargeTier)
}

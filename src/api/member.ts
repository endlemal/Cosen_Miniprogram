/**
 * 会员接口（契约 v1.3.0 第一组 2 个）：
 *   GET /app/member/profile        会员资料 + 可用余额
 *   GET /app/member/balance/flows  储值流水（分页）
 */
import { request, requestPage } from './request'
import type { MemberBalanceFlow, MemberProfile, PageData } from './types'

export interface BalanceFlowQuery {
  /** 从 1 开始，默认 1 */
  pageNum?: number
  /** 最大 100，默认 10 */
  pageSize?: number
}

/** 会员资料（脱敏，不含 openid/明文手机号） */
export function getMemberProfile(): Promise<MemberProfile> {
  return request<MemberProfile>('/app/member/profile')
}

/** 储值流水，倒序；金额单位分，正负由 direction/amountCent 表达 */
export function listBalanceFlows(query: BalanceFlowQuery = {}): Promise<PageData<MemberBalanceFlow>> {
  return requestPage<MemberBalanceFlow>('/app/member/balance/flows', {
    query: {
      pageNum: query.pageNum ?? 1,
      pageSize: query.pageSize ?? 10
    }
  })
}

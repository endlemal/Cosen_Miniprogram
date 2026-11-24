/**
 * 会员接口（契约 v1.3.0 第一组 2 个）：
 *   GET /app/member/profile        会员资料 + 可用余额
 *   GET /app/member/balance/flows  储值流水（分页）
 */
import { request, requestPage, uploadFile } from './request'
import type { MemberBalanceFlow, MemberProfile, PageData, UpdateProfileReq } from './types'

export interface BalanceFlowQuery {
  /** 从 1 开始，默认 1 */
  pageNum?: number
  /** 最大 100，默认 10 */
  pageSize?: number
}

const LOCAL_TEMP_AVATAR = /^(?:wxfile:|file:|blob:|https?:\/\/(?:tmp|usr)\/)/i

/** 判断是否为微信/本地临时头像路径（必须先上传持久化，不能直接存库） */
export function isLocalTempAvatar(url?: string | null): boolean {
  const raw = typeof url === 'string' ? url.trim() : ''
  return !!raw && LOCAL_TEMP_AVATAR.test(raw)
}

/** 会员资料（脱敏，不含 openid/明文手机号） */
export function getMemberProfile(): Promise<MemberProfile> {
  return request<MemberProfile>('/app/member/profile')
}

/** 修改当前会员昵称、头像 */
export function updateMemberProfile(payload: UpdateProfileReq): Promise<MemberProfile> {
  return request<MemberProfile>('/app/member/profile', {
    method: 'PUT',
    data: payload
  })
}

/** 上传并持久化会员头像（multipart/form-data，字段名 file） */
export function uploadMemberAvatar(filePath: string): Promise<MemberProfile> {
  return uploadFile<MemberProfile>('/app/member/avatar', filePath, 'file')
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

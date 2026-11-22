/**
 * 账号注销（契约 v1.6.0 §2.8）：
 *   POST /app/account/close   reason（可选，≤200）
 *
 * 行为：会员软删、服务端清 token；之后登录 → 401 + 40108「账号已注销」。
 * 小程序端二次确认后调用，成功后清本地 token / 缓存并跳登录页。
 */
import { request } from './request'
import type { CloseAccountReq } from './types'

/** 注销账号（成功后服务端 token 失效，调用方负责清本地登录态） */
export function closeAccount(payload: CloseAccountReq = {}): Promise<void> {
  return request<void>('/app/account/close', {
    method: 'POST',
    data: payload
  })
}

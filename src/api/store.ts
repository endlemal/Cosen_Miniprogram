/**
 * 门店信息（契约 v1.6.0 §2.1）：
 *   GET /app/store   单门店信息（公开接口，未登录也能取）
 *
 * 展示营业时间 / 地址 / 电话 / 休息日 / 公告 / 客服；50302 服务暂不可用由请求层提示。
 */
import { request } from './request'
import type { StoreInfo } from './types'

/** 门店信息（公开接口，不注入 token） */
export function getStoreInfo(silent = false): Promise<StoreInfo> {
  return request<StoreInfo>('/app/store', { auth: false, silent })
}

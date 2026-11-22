/**
 * 订单评价（契约 v1.6.0 §2.5 / §2.6）：
 *   POST /app/orders/{orderNo}/review   评价已完成订单（rating 1–5 必填、content ≤500）
 *   GET  /app/orders/{orderNo}/review   查询本人该订单评价（无则 404 + 40409）
 *
 * 约束：仅 completed 可评价、每单一次；40927（不可评价）/ 40928（已评价）由请求层提示。
 */
import { request } from './request'
import type { CreateOrderReviewReq, OrderReview } from './types'

/** 提交评价 */
export function submitOrderReview(orderNo: string, payload: CreateOrderReviewReq): Promise<OrderReview> {
  return request<OrderReview>(`/app/orders/${encodeURIComponent(orderNo)}/review`, {
    method: 'POST',
    data: payload
  })
}

/** 查询评价；404（40409 评价不存在）按「尚未评价」处理，不弹错 */
export async function getOrderReview(orderNo: string): Promise<OrderReview | null> {
  try {
    return await request<OrderReview>(`/app/orders/${encodeURIComponent(orderNo)}/review`, { silent: true })
  } catch {
    return null
  }
}

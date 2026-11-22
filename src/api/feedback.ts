/**
 * 意见反馈（契约 v1.6.0 §2.7）：
 *   POST /app/feedback   type（product/service/other）、content（≤1000 必填）、
 *                        contact（可选）、images（≤3 可选）
 *
 * 成功返回 200 + { id }，写入后台 cosen_feedback。
 */
import { request } from './request'
import type { FeedbackReq } from './types'

export interface FeedbackResult {
  id?: string
}

/** 提交反馈 */
export function submitFeedback(payload: FeedbackReq): Promise<FeedbackResult> {
  return request<FeedbackResult>('/app/feedback', {
    method: 'POST',
    data: payload
  })
}

/**
 * Mock 评价存储（v1.6.0，useMock=true 时使用）。
 *
 * 真实模式走 src/api/review.ts 的 POST/GET /app/orders/{orderNo}/review；
 * mock 模式没有后端，用 uni storage 按订单号存一份，
 * 保证「提交评价 → 返回订单详情」能看到已评价内容。
 */
import type { OrderReview } from '@/api/types'

const KEY_PREFIX = 'cosen:mock-review:'

function keyOf(orderNo: string): string {
  return `${KEY_PREFIX}${orderNo}`
}

export function getMockReview(orderNo: string): OrderReview | null {
  if (!orderNo) return null
  try {
    const raw = uni.getStorageSync(keyOf(orderNo))
    if (!raw) return null
    return (typeof raw === 'string' ? JSON.parse(raw) : raw) as OrderReview
  } catch (e) {
    return null
  }
}

export function saveMockReview(review: OrderReview): void {
  if (!review.orderNo) return
  try {
    uni.setStorageSync(keyOf(review.orderNo), JSON.stringify(review))
  } catch (e) {
    /* storage 不可用时忽略：mock 下评价只是演示 */
  }
}

/**
 * 订单支付链路（契约 v1.6.0 §2.2）。
 *
 * 时序：
 *   1. POST /app/orders/{orderNo}/pay（balance 直接扣款；wechat 返回 wechatPayParams）；
 *   2. 返回 wechatPayParams 时调 wx.requestPayment 拉起微信 JSAPI 支付；
 *   3. 支付成功由服务端「支付回调」置 paid，客户端用 GET /app/orders/{orderNo}
 *      轮询（1s × 最多 30 次）确认；
 *   4. 用户取消 / 支付失败 / 超时都返回明确结果，页面只负责 toast。
 */
import { getOrder, payOrder } from './order'
import type { OrderDetailDto, OrderPayMode, PayOrderResult, WechatPayParams } from './types'

/** wx.requestPayment 的入参（与 WechatPayParams 字段一致，额外带回调） */
export interface WxRequestPaymentOptions {
  appId: string
  timeStamp: string
  nonceStr: string
  package: string
  signType: string
  paySign: string
  success?: () => void
  fail?: (err: { errMsg?: string }) => void
}

declare global {
  /**
   * 微信小程序全局对象（仅 mp-weixin 运行时存在）。
   * 这里只声明支付用到的最小集合，避免为 `wx` 引入整套 miniprogram typings。
   */
  const wx:
    | {
        requestPayment: (options: WxRequestPaymentOptions) => void
      }
    | undefined
}

/** 微信支付失败（cancelled=true 表示用户主动取消，页面文案不同） */
export class WechatPayError extends Error {
  readonly cancelled: boolean

  constructor(message: string, cancelled = false) {
    super(message)
    this.name = 'WechatPayError'
    this.cancelled = cancelled
  }
}

/**
 * 拉起微信支付。
 * 微信侧 success 只代表用户完成支付动作，服务端订单状态仍以回调 + 轮询为准。
 */
export function requestWechatPayment(params: WechatPayParams): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof wx === 'undefined' || !wx.requestPayment) {
      reject(new WechatPayError('当前环境不支持微信支付，请在微信小程序内使用'))
      return
    }
    wx.requestPayment({
      appId: params.appId,
      timeStamp: params.timeStamp,
      nonceStr: params.nonceStr,
      package: params.package,
      signType: params.signType,
      paySign: params.paySign,
      success: () => resolve(),
      fail: (err) => {
        const message = err?.errMsg || ''
        reject(message.includes('cancel')
          ? new WechatPayError('已取消支付', true)
          : new WechatPayError('支付失败，请重试'))
      }
    })
  })
}

/** 订单是否已完成支付（paid / completed 都视为已付） */
export function isOrderPaid(order: OrderDetailDto | null | undefined): boolean {
  if (!order) return false
  return order.payStatus === 'paid' || order.orderStatus === 'paid' || order.orderStatus === 'completed'
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 轮询间隔与次数（契约：1s × 最多 30 次） */
export const ORDER_POLL_INTERVAL_MS = 1000
export const ORDER_POLL_MAX_ATTEMPTS = 30

/**
 * 轮询订单直到支付完成。
 * 返回最新订单（已 paid / 已取消）或 null（轮询耗尽 / 请求失败）。
 */
export async function waitOrderPaid(
  orderNo: string,
  intervalMs = ORDER_POLL_INTERVAL_MS,
  maxAttempts = ORDER_POLL_MAX_ATTEMPTS
): Promise<OrderDetailDto | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await sleep(intervalMs)
    let latest: OrderDetailDto
    try {
      latest = await getOrder(orderNo)
    } catch (e) {
      // 401xx / 40404 等请求层已提示；继续轮询没有意义
      return null
    }
    if (isOrderPaid(latest) || latest.orderStatus === 'cancelled') return latest
  }
  return null
}

/** 支付结果（页面按 status 给文案，不在这里 toast） */
export type OrderPayOutcome =
  | { status: 'paid'; order: OrderDetailDto }
  | { status: 'cancelled' }
  | { status: 'closed'; order: OrderDetailDto }
  | { status: 'failed'; message: string }
  | { status: 'timeout' }
  | { status: 'unsupported'; message: string }

/**
 * 完整支付流程：pay →（wechat）拉起支付 → 轮询确认。
 * 网络 / 业务错误（40903 余额不足、40916 状态变化、50305 微信支付不可用等）直接抛给页面，
 * 由请求层统一 toast；这里只处理「支付动作本身」的取消 / 失败 / 超时。
 */
export async function payOrderFlow(orderNo: string, payMode: OrderPayMode): Promise<OrderPayOutcome> {
  const result: PayOrderResult = await payOrder(orderNo, { payMode })
  const params = result.wechatPayParams

  // 余额支付（或 mixed 的余额部分）由服务端同步扣款，无 JSAPI 参数
  if (!params) {
    if (isOrderPaid(result)) return { status: 'paid', order: result }
    if (result.orderStatus === 'cancelled') return { status: 'closed', order: result }
    return { status: 'timeout' }
  }

  try {
    await requestWechatPayment(params)
  } catch (e) {
    if (e instanceof WechatPayError) {
      if (e.cancelled) return { status: 'cancelled' }
      return { status: 'failed', message: e.message }
    }
    return { status: 'failed', message: '支付失败，请重试' }
  }

  const latest = await waitOrderPaid(orderNo)
  if (latest && isOrderPaid(latest)) return { status: 'paid', order: latest }
  if (latest && latest.orderStatus === 'cancelled') return { status: 'closed', order: latest }
  return { status: 'timeout' }
}

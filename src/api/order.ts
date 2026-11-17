/**
 * 订单 / 支付接口（契约 v1.4.0 第二组 5 个）：
 *   POST /app/orders                   创建订单（自取）
 *   GET  /app/orders                   我的订单列表（分页）
 *   GET  /app/orders/{orderNo}         订单详情（带 items）
 *   POST /app/orders/{orderNo}/pay     支付（balance / wechat / mixed）
 *   POST /app/orders/{orderNo}/cancel  取消订单
 *
 * 关键约定（docs/error-codes.md §5.3）：
 *   - 下单幂等键 Header `Idempotency-Key` 与 body.idempotencyKey 二选一必填；
 *     同 key 同 payload 重放返回 HTTP 200 + code 40925（request 层已按成功放行）；
 *     同 key 不同 payload 返回 40007。
 *   - 取消：created/unpaid 可取消；paid/making/ready → 40916；completed → 40918；
 *     cancelled 重复取消按幂等成功返回原订单。
 *   - mixed：balancePayCent 与 wechatPayCent 均须 > 0 且和等于 payableCent；
 *     本轮不做 mixed UI，只保留参数位与 TODO。
 */
import { genIdempotencyKey, request, requestPage } from './request'
import { centToYuan } from './money'
import { toArtSpec } from './catalog'
import type { DrinkArtSpec, PayMode } from '@/types'
import type {
  CreateOrderItemReq,
  CreateOrderReq,
  OrderDetailDto,
  OrderDto,
  OrderItemDto,
  OrderListQuery,
  OrderPayStatus,
  OrderStatus,
  PageData,
  PayOrderReq
} from './types'

/* ---------------- 接口 ---------------- */

/**
 * 创建订单。
 * 同一次提交的重试必须由调用方复用同一个 idempotencyKey（不传则这里自动生成一次）。
 */
export interface CreateOrderInput extends Omit<CreateOrderReq, 'idempotencyKey'> {
  idempotencyKey?: string
}

export function createOrder(input: CreateOrderInput): Promise<OrderDetailDto> {
  const idempotencyKey = input.idempotencyKey || genIdempotencyKey()
  return request<OrderDetailDto>('/app/orders', {
    method: 'POST',
    data: { ...input, idempotencyKey },
    headers: { 'Idempotency-Key': idempotencyKey }
  })
}

/** 我的订单列表（倒序，分页） */
export function listMyOrders(query: OrderListQuery = {}): Promise<PageData<OrderDto>> {
  return requestPage<OrderDto>('/app/orders', {
    query: {
      pageNum: query.pageNum ?? 1,
      pageSize: query.pageSize ?? 10,
      orderStatus: query.orderStatus
    }
  })
}

/** 订单详情（items 由服务端一并返回，不额外查询） */
export function getOrder(orderNo: string): Promise<OrderDetailDto> {
  return request<OrderDetailDto>(`/app/orders/${encodeURIComponent(orderNo)}`)
}

/**
 * 支付。
 * balance / wechat 只需 payMode；mixed 需同时带 balancePayCent、wechatPayCent
 * （本轮无 UI，等组合支付排期后再放开）。
 */
export function payOrder(orderNo: string, payload: PayOrderReq): Promise<OrderDetailDto> {
  return request<OrderDetailDto>(`/app/orders/${encodeURIComponent(orderNo)}/pay`, {
    method: 'POST',
    data: payload
  })
}

/** 取消订单；重复取消是幂等成功（返回原订单） */
export function cancelOrder(orderNo: string): Promise<OrderDetailDto> {
  return request<OrderDetailDto>(`/app/orders/${encodeURIComponent(orderNo)}/cancel`, {
    method: 'POST'
  })
}

/* ---------------- 状态文案 ---------------- */

export const ORDER_STATUS_TEXT: Record<OrderStatus, string> = {
  created: '待支付',
  paid: '已支付',
  making: '制作中',
  ready: '待取餐',
  completed: '已完成',
  cancelled: '已取消'
}

export function orderStatusText(status: OrderStatus): string {
  return ORDER_STATUS_TEXT[status] || status
}

export const PAY_MODE_TEXT: Record<PayMode, string> = {
  balance: '余额支付',
  wechat: '微信支付',
  mixed: '组合支付'
}

export function payModeText(mode: PayMode): string {
  return PAY_MODE_TEXT[mode] || mode
}

/* ---------------- DTO → 页面模型 ---------------- */

/** 订单明细展示模型（页面够用即可，金额已转元） */
export interface OrderItemView {
  key: string
  productCode: string
  name: string
  en: string
  specText: string
  unitPrice: number
  qty: number
  art: DrinkArtSpec
  tile: [string, string]
}

/** 订单详情展示模型（字段名沿用 mock Order，减少页面分支） */
export interface OrderView {
  id: string
  no: string
  code: string
  /** 契约 fulfillType 仅 pickup；delivery 仅用于展示 mock 历史订单 */
  mode: 'pickup' | 'delivery'
  items: OrderItemView[]
  subtotal: number
  discount: number
  deliveryFee: number
  total: number
  couponTitle?: string
  pay: PayMode
  remark: string
  createdAt: number
  store: string
  payStatus: OrderPayStatus
  orderStatus: OrderStatus
  /** 使用的用户券 ID（非 couponNo） */
  couponId?: string | null
  balancePay: number
  wechatPay: number
}

/** 订单列表项展示模型 */
export interface OrderListItem {
  id: string
  no: string
  code: string
  itemCount: number
  subtotal: number
  discount: number
  total: number
  payMode: PayMode
  payStatus: OrderPayStatus
  orderStatus: OrderStatus
  createdAt: number
  remark: string
}

function toTs(iso?: string | null): number {
  if (!iso) return 0
  const value = Date.parse(iso)
  return Number.isFinite(value) ? value : 0
}

function toItemView(dto: OrderItemDto): OrderItemView {
  const art = toArtSpec(dto.artJson)
  return {
    key: `${dto.productCode}|${dto.specText || ''}|${dto.id || ''}`,
    productCode: dto.productCode,
    name: dto.productName,
    en: dto.productNameEn ?? '',
    specText: dto.specText ?? '',
    unitPrice: centToYuan(dto.unitPriceCent),
    qty: dto.qty,
    art,
    tile: [art.liquid[0], art.liquid[1]]
  }
}

/** 订单详情 DTO → 页面模型（订单只有自取） */
export function toOrderView(dto: OrderDetailDto, storeName: string): OrderView {
  return {
    id: dto.id,
    no: dto.orderNo,
    code: dto.pickupCode ?? '',
    mode: dto.fulfillType,
    items: dto.items.map(toItemView),
    subtotal: centToYuan(dto.subtotalCent ?? 0),
    discount: centToYuan(dto.couponOffCent ?? 0),
    deliveryFee: 0,
    total: centToYuan(dto.payableCent ?? 0),
    pay: dto.payMode,
    remark: dto.remark ?? '',
    createdAt: toTs(dto.createTime),
    store: storeName,
    payStatus: dto.payStatus,
    orderStatus: dto.orderStatus,
    couponId: dto.couponId,
    balancePay: centToYuan(dto.balancePayCent ?? 0),
    wechatPay: centToYuan(dto.wechatPayCent ?? 0)
  }
}

/** 订单列表 DTO → 页面列表项 */
export function toOrderListItem(dto: OrderDto): OrderListItem {
  return {
    id: dto.id,
    no: dto.orderNo,
    code: dto.pickupCode ?? '',
    itemCount: dto.itemCount ?? 0,
    subtotal: centToYuan(dto.subtotalCent ?? 0),
    discount: centToYuan(dto.couponOffCent ?? 0),
    total: centToYuan(dto.payableCent ?? 0),
    payMode: dto.payMode,
    payStatus: dto.payStatus,
    orderStatus: dto.orderStatus,
    createdAt: toTs(dto.createTime),
    remark: dto.remark ?? ''
  }
}

/** 购物车 → 下单明细（当前只映射 productCode/qty；规格快照由服务端按默认价重算） */
export function toCreateOrderItems(items: Array<{ productId: string; qty: number; spec?: Record<string, string> }>): CreateOrderItemReq[] {
  return items.map((item) => ({
    productCode: item.productId,
    qty: item.qty,
    ...(item.spec ? { spec: item.spec } : {})
  }))
}

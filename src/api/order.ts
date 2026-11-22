/**
 * 订单 / 支付接口（契约 v1.6.0 第二组 5 个）：
 *   POST /app/orders                   创建订单（自取）
 *   GET  /app/orders                   我的订单列表（分页）
 *   GET  /app/orders/{orderNo}         订单详情（带 items）
 *   POST /app/orders/{orderNo}/pay     支付（balance / wechat / mixed；wechat 返回 JSAPI 参数）
 *   POST /app/orders/{orderNo}/cancel  取消订单
 *
 * 关键约定（docs/error-codes.md §5.3）：
 *   - 下单幂等键 Header `Idempotency-Key` 与 body.idempotencyKey 二选一必填；
 *     同 key 同 payload 重放返回 HTTP 200 + code 40925（request 层已按成功放行）；
 *     同 key 不同 payload 返回 40007。
 *   - 状态 4 态（v1.6.0 去 making/ready）：created → paid → completed／cancelled。
 *     取消：created 可取消；paid → 40916；completed → 40918；cancelled 幂等；
 *     created 超过 payDeadline 由服务端定时任务置 cancelled。
 *   - mixed：balancePayCent 与 wechatPayCent 均须 > 0 且和等于 payableCent；
 *     本轮不做 mixed UI，只保留参数位与 TODO。
 */
import { genIdempotencyKey, request, requestPage } from './request'
import { hasToken } from './token'
import { centToYuan } from './money'
import { toArtSpec } from './catalog'
import type { DrinkArtSpec, PayMode } from '@/types'
import type {
  CreateOrderItemReq,
  CreateOrderReq,
  MemberSubscribeResp,
  MemberSubscribeScene,
  OrderDetailDto,
  OrderDto,
  OrderItemDto,
  OrderListQuery,
  OrderPayStatus,
  OrderStatus,
  PageData,
  PayOrderReq,
  PayOrderResult
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
 * v1.6.0：wechat 时响应带 wechatPayParams，需客户端拉起 wx.requestPayment，
 * 并用 GET /app/orders/{orderNo} 轮询支付结果（见 ./payment.ts 的 payOrderFlow）。
 */
export function payOrder(orderNo: string, payload: PayOrderReq): Promise<PayOrderResult> {
  return request<PayOrderResult>(`/app/orders/${encodeURIComponent(orderNo)}/pay`, {
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

/** 提交订单退款申请；审核权在商家后台 */
export function applyOrderRefund(orderNo: string, reason: string): Promise<OrderDetailDto> {
  return request<OrderDetailDto>(`/app/orders/${encodeURIComponent(orderNo)}/refund`, {
    method: 'POST',
    data: { reason }
  })
}

export const SUBSCRIBE_TEMPLATE_STORAGE_KEY = 'cosen:subscribe-tpl-ids'
export const SUBSCRIBE_TEMPLATE_MAP_STORAGE_KEY = 'cosen:subscribe-tpl-map'

export interface SubscribePromptResult {
  attemptedIds: string[]
  acceptedIds: string[]
  results: Record<string, 'accept' | 'reject' | 'ban' | 'filter'>
}

let cachedAlwaysAcceptedIds: string[] = []
let lastSilentRefillAt = 0

/** 缓存门店下发的订阅消息模板配置（扁平列表 + 分场景映射） */
export function cacheSubscribeTemplates(store: {
  subscribeTemplateIds?: string[]
  subscribeTemplates?: { orderReceipt?: string; orderReady?: string; orderPaid?: string; orderRefund?: string }
}) {
  try {
    if (Array.isArray(store.subscribeTemplateIds)) {
      uni.setStorageSync(
        SUBSCRIBE_TEMPLATE_STORAGE_KEY,
        store.subscribeTemplateIds.filter((id) => typeof id === 'string' && id.trim())
      )
    }
    if (store.subscribeTemplates && typeof store.subscribeTemplates === 'object') {
      uni.setStorageSync(SUBSCRIBE_TEMPLATE_MAP_STORAGE_KEY, store.subscribeTemplates)
    }
  } catch {
    /* ignore storage errors */
  }
  void checkAlwaysAcceptedTemplates()
}

/** 按业务场景读取已配置的微信订阅消息模板 ID（最多 3 个） */
export function getSubscribeTemplateIds(
  scene: 'order_pay' | 'order_refund' | 'order_detail' = 'order_detail'
): string[] {
  const ordered: string[] = []
  const push = (id?: unknown) => {
    if (typeof id === 'string') {
      const clean = id.trim()
      if (clean && !ordered.includes(clean)) ordered.push(clean)
    }
  }
  try {
    const map = uni.getStorageSync(SUBSCRIBE_TEMPLATE_MAP_STORAGE_KEY) as
      | { orderReceipt?: string; orderReady?: string; orderPaid?: string; orderRefund?: string }
      | undefined
    if (map && typeof map === 'object') {
      if (scene === 'order_pay') {
        push(map.orderReceipt)
        push(map.orderReady)
        push(map.orderPaid)
      } else if (scene === 'order_refund') {
        push(map.orderRefund)
      } else {
        push(map.orderReceipt)
        push(map.orderReady)
        push(map.orderPaid)
        push(map.orderRefund)
      }
    }
    if (!ordered.length) {
      const saved = uni.getStorageSync(SUBSCRIBE_TEMPLATE_STORAGE_KEY)
      if (Array.isArray(saved)) saved.forEach(push)
    }
  } catch {
    /* ignore storage errors */
  }
  return ordered.slice(0, 3)
}

/**
 * 必须在用户点击手势（@tap）内同步调用，拉起微信一次性订阅弹窗并返回真实授权结果。
 * 未配置模板或非小程序环境时直接返回空结果，不阻塞下单/支付流程。
 */
export async function promptOrderSubscribe(
  sceneOrIds: 'order_pay' | 'order_refund' | 'order_detail' | string[] = 'order_detail'
): Promise<SubscribePromptResult> {
  const tmplIds = Array.isArray(sceneOrIds)
    ? sceneOrIds.map((id) => id.trim()).filter(Boolean).slice(0, 3)
    : getSubscribeTemplateIds(sceneOrIds)
  const empty: SubscribePromptResult = { attemptedIds: [], acceptedIds: [], results: {} }
  if (!tmplIds.length) return empty

  const reqSubscribe = (uni as any)?.requestSubscribeMessage
  if (typeof reqSubscribe !== 'function') return empty

  return await new Promise<SubscribePromptResult>((resolve) => {
    reqSubscribe({
      tmplIds,
      success: (res: Record<string, unknown>) => {
        const results: Record<string, 'accept' | 'reject' | 'ban' | 'filter'> = {}
        const acceptedIds: string[] = []
        for (const id of tmplIds) {
          const decision = res?.[id]
          if (decision === 'accept' || decision === 'reject' || decision === 'ban' || decision === 'filter') {
            results[id] = decision
            if (decision === 'accept') acceptedIds.push(id)
          }
        }
        void checkAlwaysAcceptedTemplates()
        resolve({ attemptedIds: tmplIds, acceptedIds, results })
      },
      fail: () => resolve({ attemptedIds: tmplIds, acceptedIds: [], results: {} })
    })
  })
}

/**
 * 查询微信客户端中用户已勾选「总是保持以上选择」的订阅模板 ID。
 * 仅对这些模板才允许在高频点击时静默补次数（0 弹窗，绝不打扰未勾选用户）。
 */
export async function checkAlwaysAcceptedTemplates(templateIds?: string[]): Promise<string[]> {
  const candidates = (templateIds?.length ? templateIds : getSubscribeTemplateIds('order_pay'))
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 3)
  if (!candidates.length) {
    cachedAlwaysAcceptedIds = []
    return []
  }
  const getSetting = (uni as any)?.getSetting
  if (typeof getSetting !== 'function') {
    cachedAlwaysAcceptedIds = []
    return []
  }
  return await new Promise<string[]>((resolve) => {
    getSetting({
      withSubscriptions: true,
      success: (res: any) => {
        const setting = res?.subscriptionsSetting
        if (!setting || setting.mainSwitch === false || !setting.itemSettings) {
          cachedAlwaysAcceptedIds = []
          resolve([])
          return
        }
        const matched = candidates.filter((id) => setting.itemSettings?.[id] === 'accept')
        cachedAlwaysAcceptedIds = matched
        resolve(matched)
      },
      fail: () => resolve(cachedAlwaysAcceptedIds)
    })
  })
}

/** 将会员级订阅授权结果上报后端累计额度（POST /app/member/subscribe） */
export async function reportMemberSubscribe(
  promptResult: SubscribePromptResult,
  scene: MemberSubscribeScene = 'member_center'
): Promise<MemberSubscribeResp | null> {
  if (!hasToken() || !Object.keys(promptResult.results).length) return null
  try {
    return await request<MemberSubscribeResp>('/app/member/subscribe', {
      method: 'POST',
      data: {
        templateIds: promptResult.acceptedIds,
        results: promptResult.results,
        scene
      }
    })
  } catch {
    return null
  }
}

/**
 * 必须在点击事件内同步调用：在「我的 → 消费小票通知」主动拉起订阅授权并上报累计次数。
 */
export async function requestMemberSubscribe(
  scene: MemberSubscribeScene = 'member_center'
): Promise<{
  configured: boolean
  ok: boolean
  alwaysAccepted: boolean
  remainingCount: number
}> {
  const tmplIds = getSubscribeTemplateIds('order_pay')
  if (!tmplIds.length) {
    return { configured: false, ok: false, alwaysAccepted: false, remainingCount: 0 }
  }
  const promptResult = await promptOrderSubscribe(tmplIds)
  const resp = await reportMemberSubscribe(promptResult, scene)
  const alwaysIds = await checkAlwaysAcceptedTemplates(tmplIds)
  return {
    configured: true,
    ok: promptResult.acceptedIds.length > 0,
    alwaysAccepted: alwaysIds.length > 0,
    remainingCount: Number(resp?.remainingCount ?? 0)
  }
}

/**
 * 零弹窗静默攒次数（必须在用户点击手势内同步调用）：
 * 仅当 uni.getSetting 确认用户已勾选「总是保持以上选择」时才调用 requestSubscribeMessage，
 * 每次静默为微信侧与后端累计 +1 通知额度（3 秒节流），未勾选用户绝不弹窗打扰。
 */
export function silentRefillSubscribe(scene: MemberSubscribeScene = 'silent_refill'): void {
  if (!hasToken() || !cachedAlwaysAcceptedIds.length) return
  const now = Date.now()
  if (now - lastSilentRefillAt < 3000) return
  const reqSubscribe = (uni as any)?.requestSubscribeMessage
  if (typeof reqSubscribe !== 'function') return
  const tmplIds = cachedAlwaysAcceptedIds.slice(0, 3)
  lastSilentRefillAt = now
  try {
    reqSubscribe({
      tmplIds,
      success: (res: Record<string, unknown>) => {
        const results: Record<string, 'accept' | 'reject' | 'ban' | 'filter'> = {}
        const acceptedIds: string[] = []
        let revoked = false
        for (const id of tmplIds) {
          const decision = res?.[id]
          if (decision === 'accept' || decision === 'reject' || decision === 'ban' || decision === 'filter') {
            results[id] = decision
            if (decision === 'accept') acceptedIds.push(id)
            else revoked = true
          }
        }
        if (revoked) void checkAlwaysAcceptedTemplates()
        if (acceptedIds.length) {
          void reportMemberSubscribe({ attemptedIds: tmplIds, acceptedIds, results }, scene)
        }
      },
      fail: () => {
        /* 静默补次数失败不提示 */
      }
    })
  } catch {
    /* ignore */
  }
}

/** 将用户真实授权结果上报后端落库（未拉起或无结果时跳过请求） */
export async function reportOrderSubscribe(
  orderNo: string,
  promptResult: SubscribePromptResult,
  scene: 'order_pay' | 'order_refund' | 'order_detail' = 'order_detail'
): Promise<boolean> {
  if (!orderNo || !Object.keys(promptResult.results).length) return false
  try {
    const resp = await request<{ subscribed: boolean }>(`/app/orders/${encodeURIComponent(orderNo)}/subscribe`, {
      method: 'POST',
      data: {
        templateIds: promptResult.acceptedIds,
        results: promptResult.results,
        scene
      }
    })
    return !!resp?.subscribed
  } catch {
    return false
  }
}

/** 订阅订单消息通知并向后端上报订阅状态（需在点击事件内调用） */
export async function requestOrderSubscribe(
  orderNo: string,
  templateIds?: string[],
  scene: 'order_pay' | 'order_refund' | 'order_detail' = 'order_detail'
): Promise<boolean> {
  const promptResult = await promptOrderSubscribe(templateIds?.length ? templateIds : scene)
  return await reportOrderSubscribe(orderNo, promptResult, scene)
}

/* ---------------- 状态文案 ---------------- */

/** 极简 3 态文案（已支付 / 退款 / 待支付与已取消） */
export const ORDER_STATUS_TEXT: Record<OrderStatus, string> = {
  created: '待支付',
  paid: '已支付',
  completed: '已支付',
  refund_pending: '退款申请中',
  refunding: '退款处理中',
  refund_error: '退款需核实',
  refunded: '已退款',
  cancelled: '已取消'
}

export function orderStatusText(status: OrderStatus): string {
  return ORDER_STATUS_TEXT[status] || status
}

/** 极简状态下的提示说明 */
export const ORDER_STATUS_HINT: Record<OrderStatus, string> = {
  created: '请尽快完成支付，超时会自动取消',
  paid: '已支付，到店报取餐号或等桌位送达',
  completed: '已支付，欢迎随时对本次体验评分',
  refund_pending: '退款申请已提交，等待门店审核处理',
  refunding: '门店已同意，正在等待微信确认退款结果',
  refund_error: '退款需要门店核实，请联系门店',
  refunded: '款项已按原路径退回，请注意查收',
  cancelled: '订单已取消，欢迎再来'
}

export function orderStatusHint(status: OrderStatus): string {
  return ORDER_STATUS_HINT[status] || ''
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
  tableNo: string
  payStatus: OrderPayStatus
  orderStatus: OrderStatus
  refundReason: string
  refundRequestedAt: number
  refundedAt: number
  /** 支付截止时间戳（毫秒）；0 = 无（已支付/无倒计时） */
  payDeadline: number
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
  tableNo: string
  itemCount: number
  subtotal: number
  discount: number
  total: number
  payMode: PayMode
  payStatus: OrderPayStatus
  orderStatus: OrderStatus
  createdAt: number
  remark: string
  refundReason: string
  /** 支付截止时间戳（毫秒）；0 = 无（列表项可选返回） */
  payDeadline: number
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
    tableNo: dto.tableNo ?? '',
    mode: dto.fulfillType,
    items: dto.items.map(toItemView),
    subtotal: centToYuan(dto.subtotalCent ?? 0),
    discount: centToYuan(dto.couponOffCent ?? 0),
    deliveryFee: 0,
    total: centToYuan(dto.payableCent ?? 0),
    pay: dto.payMode,
    remark: dto.remark ?? '',
    refundReason: dto.refundReason ?? '',
    refundRequestedAt: toTs(dto.refundRequestedAt),
    refundedAt: toTs(dto.refundedAt),
    createdAt: toTs(dto.createTime),
    store: storeName,
    payStatus: dto.payStatus,
    orderStatus: dto.orderStatus,
    payDeadline: toTs(dto.payDeadline),
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
    tableNo: dto.tableNo ?? '',
    itemCount: dto.itemCount ?? 0,
    subtotal: centToYuan(dto.subtotalCent ?? 0),
    discount: centToYuan(dto.couponOffCent ?? 0),
    total: centToYuan(dto.payableCent ?? 0),
    payMode: dto.payMode,
    payStatus: dto.payStatus,
    orderStatus: dto.orderStatus,
    createdAt: toTs(dto.createTime),
    remark: dto.remark ?? '',
    refundReason: dto.refundReason ?? '',
    payDeadline: toTs(dto.payDeadline)
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

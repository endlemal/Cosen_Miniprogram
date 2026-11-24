<template>
  <view class="page">
    <NavBar :title="detailMode ? '订单详情' : '我的订单'" />

    <!-- 列表模式：/pages/order/index 无参数进入 -->
    <view v-if="!detailMode" class="wrap">
      <view v-if="listLoading" class="empty">
        <text class="empty-t">正在加载订单…</text>
      </view>
      <view v-else-if="!orderList.length" class="empty">
        <text class="empty-t">还没有订单，去点一杯吧</text>
      </view>
      <view v-else class="order-list">
        <view v-for="o in orderList" :key="o.no" class="order-card" hover-class="tap-on" @tap="openOrder(o)">
          <view class="oc-top">
            <text class="oc-code">{{ o.code || o.no }}</text>
            <text class="oc-status" :class="{ live: o.orderStatus !== 'completed' && o.orderStatus !== 'cancelled' && o.orderStatus !== 'refunded' }">
              {{ statusText(o.orderStatus) }}
            </text>
          </view>
          <text class="oc-items">{{ o.tableNo ? '桌号 ' + o.tableNo + ' · ' : '' }}{{ o.itemCount ? '共 ' + o.itemCount + ' 件商品' : '自取订单' }}</text>
          <view class="oc-foot">
            <text class="oc-time">{{ ymd(o.createdAt) }} {{ hm(o.createdAt) }}</text>
            <text class="oc-total">¥{{ money(o.total) }}</text>
          </view>
        </view>
      </view>
      <view class="tail" />
    </view>

    <!-- 详情模式：/pages/order/index?no=订单号（mock: ?id=本地 id） -->
    <view v-else-if="order" class="wrap">
      <!-- 取餐号卡：极简 3 态文案 + 桌号展示 -->
      <view class="code-card" :class="{ muted: displayStatus === 'cancelled' || displayStatus === 'refunded' }">
        <view class="orb o1" />
        <view class="orb o2" />
        <text class="cc-l">{{ order.mode === 'pickup' ? '取餐号' : '外送单号' }}</text>
        <text class="cc-code">{{ order.code || '—' }}</text>
        <view class="cc-status-row">
          <text class="cc-stage" :class="{ live: displayStatus === 'paid' || displayStatus === 'refund_pending' }">{{ statusLabel }}</text>
          <view v-if="countdownText" class="cc-count">
            <Icon name="clock" :size="24" color="#FFD9A0" :stroke="2.4" />
            <text class="cc-count-t">{{ countdownText }}</text>
          </view>
        </view>
        <text class="cc-hint">{{ statusHint }}</text>
      </view>

      <view class="box where">
        <view class="w-head">
          <Icon :name="order.mode === 'pickup' ? 'store' : 'scooter'" :size="32" color="#663A24" />
          <text class="w-t">{{ order.mode === 'pickup' ? order.store : '外卖配送' }}</text>
        </view>
        <text class="w-s">{{ order.mode === 'pickup' ? STORE.address : '外送信息已下线，仅展示历史订单' }}</text>
        <text v-if="order.tableNo" class="w-table">关联桌号：{{ order.tableNo }} 号桌</text>
      </view>

      <view v-if="['refund_pending', 'refunding', 'refund_error', 'refunded'].includes(displayStatus)" class="box refund-box">
        <view class="rf-head">
          <text class="rf-title">{{ statusLabel }}</text>
          <text class="rf-tag" :class="{ done: displayStatus === 'refunded' }">{{ statusLabel }}</text>
        </view>
        <text class="rf-reason">原因：{{ order.refundReason || '用户申请退款' }}</text>
        <text v-if="order.refundedAt || order.refundRequestedAt" class="rf-time">
          {{ displayStatus === 'refunded' ? '退款时间：' : '申请时间：' }}{{ ymd(order.refundedAt || order.refundRequestedAt) }} {{ hm(order.refundedAt || order.refundRequestedAt) }}
        </text>
      </view>

      <view class="box">
        <view v-for="it in order.items" :key="it.key" class="item">
          <view class="thumb">
            <image v-if="itemCover(it.productCode)" class="item-cover" :src="itemCover(it.productCode)" mode="aspectFill" />
            <ProductImagePlaceholder v-else :product-key="it.productCode" />
          </view>
          <view class="it-info">
            <text class="it-name">{{ it.name }}</text>
            <text class="it-spec">{{ it.specText }}</text>
          </view>
          <view class="it-right">
            <text class="it-price">¥{{ money(it.unitPrice * it.qty) }}</text>
            <text class="it-qty">×{{ it.qty }}</text>
          </view>
        </view>
        <view class="line" />
        <view class="kv">
          <text class="k">商品金额</text>
          <text class="v">¥{{ money(order.subtotal) }}</text>
        </view>
        <view v-if="order.discount > 0" class="kv">
          <text class="k">礼品券{{ order.couponTitle ? '（' + order.couponTitle + '）' : '' }}</text>
          <text class="v off">−¥{{ money(order.discount) }}</text>
        </view>
        <view v-if="order.deliveryFee > 0" class="kv">
          <text class="k">配送费</text>
          <text class="v">¥{{ money(order.deliveryFee) }}</text>
        </view>
        <view class="kv total">
          <text class="k">{{ payModeText(order.pay) }}</text>
          <text class="v big">¥{{ money(order.total) }}</text>
        </view>
        <view v-if="order.pay === 'mixed'" class="kv">
          <text class="k">储值 + 微信</text>
          <text class="v">¥{{ money(order.balancePay) }} + ¥{{ money(order.wechatPay) }}</text>
        </view>
      </view>

      <view class="box">
        <view class="kv">
          <text class="k">订单号</text>
          <text class="v mono">{{ order.no }}</text>
        </view>
        <view class="kv">
          <text class="k">下单时间</text>
          <text class="v">{{ ymd(order.createdAt) }} {{ hm(order.createdAt) }}</text>
        </view>
        <view v-if="order.remark" class="kv">
          <text class="k">备注</text>
          <text class="v">{{ order.remark }}</text>
        </view>
      </view>

      <!-- 评价：已支付即可展示评价入口；已评价只读展示 -->
      <view v-if="displayStatus === 'paid' || displayStatus === 'completed'" class="box review">
        <view class="rv-head">
          <text class="rv-t">订单评价</text>
          <text v-if="!review && !reviewLoading" class="rv-go" hover-class="tap-on" @tap="goReview">去评价 ›</text>
        </view>
        <view v-if="review" class="rv-body">
          <view class="rv-stars">
            <Icon
              v-for="i in 5"
              :key="i"
              name="star"
              :size="30"
              :color="i <= (review.rating || 0) ? '#E7A43A' : '#D9CBB8'"
            />
            <text class="rv-score">{{ (review.rating || 0).toFixed(1) }}</text>
          </view>
          <text v-if="review.content" class="rv-content">{{ review.content }}</text>
          <text class="rv-time">{{ reviewAt }}</text>
        </view>
        <text v-else class="rv-empty">{{ reviewLoading ? '正在加载评价…' : '说说这次的体验，帮助门店做得更好' }}</text>
      </view>

      <view class="actions">
        <view class="btn ghost" hover-class="tap-on" @tap="call">
          <Icon name="phone" :size="30" color="#663A24" />
          <text class="btn-t ink">联系门店</text>
        </view>
        <view v-if="useMock" class="btn" hover-class="tap-on" @tap="again">
          <text class="btn-t">再来一单</text>
        </view>
        <template v-else>
          <view v-if="canCancel" class="btn ghost" :class="{ busy }" hover-class="tap-on" @tap="cancelNow">
            <text class="btn-t ink">取消订单</text>
          </view>
          <view v-if="canPay" class="btn" :class="{ busy }" hover-class="tap-on" @tap="payNow">
            <text class="btn-t">{{ busy ? '处理中…' : expired ? '已超时' : '去支付' }}</text>
          </view>
          <template v-else>
            <view
              v-if="canSubscribe"
              class="btn ghost"
              :class="{ busy }"
              hover-class="tap-on"
              @tap="subscribeNow"
            >
              <text class="btn-t ink">{{ subscribedOnce ? '已开启提醒' : '开启进度提醒' }}</text>
            </view>
            <view v-if="canRefund" class="btn ghost" :class="{ busy }" hover-class="tap-on" @tap="openRefund">
              <text class="btn-t ink">申请退款</text>
            </view>
            <view v-if="displayStatus === 'paid' || displayStatus === 'completed'" class="btn" hover-class="tap-on" @tap="goReview">
              <text class="btn-t">{{ review ? '查看评价' : '去评价' }}</text>
            </view>
          </template>
        </template>
      </view>
      <view class="tail" />
    </view>

    <view v-else class="empty">
      <text class="empty-t">{{ detailLoading ? '正在加载订单…' : '订单不存在或已删除' }}</text>
    </view>

    <Sheet v-model:show="refundOpen" title="申请退款" bg="#FFF9F0" max-height="76vh">
      <view class="rf-sheet">
        <text class="rf-tip">提交退款申请后将由门店审核处理，同意后款项按原路径退回。</text>
        <view class="rf-chips">
          <text
            v-for="preset in REFUND_PRESETS"
            :key="preset"
            class="rf-chip"
            :class="{ on: refundReason === preset }"
            @tap="refundReason = preset"
          >
            {{ preset }}
          </text>
        </view>
        <textarea
          v-model="refundReason"
          class="rf-input"
          maxlength="120"
          placeholder="请填写退款原因（选填，最多 120 字）"
        />
        <view class="rf-submit" :class="{ busy }" hover-class="tap-on" @tap="submitRefund">
          <text class="rf-submit-t">{{ busy ? '提交中…' : '确认申请退款' }}</text>
        </view>
      </view>
    </Sheet>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import Icon from '@/components/Icon.vue'
import Sheet from '@/components/Sheet.vue'
import { getProduct } from '@/mock/products'
import { mediaCover } from '@/utils/media'
import ProductImagePlaceholder from '@/components/ProductImagePlaceholder.vue'
import { STORE } from '@/mock/products'
import { useMock } from '@/config/env'
import { isSignedOut, setToken } from '@/api/token'
import {
  applyOrderRefund,
  cancelOrder,
  getOrder,
  getOrderReview,
  getSubscribeTemplateIds,
  listMyOrders,
  orderStatusHint,
  orderStatusText,
  payModeText,
  payOrderFlow,
  promptOrderSubscribe,
  reportOrderSubscribe,
  requestOrderSubscribe,
  toOrderListItem,
  toOrderView,
  type OrderDetailDto,
  type OrderListItem,
  type OrderReview,
  type OrderStatus,
  type OrderView
} from '@/api'
import { getMockReview } from '@/mock/reviews'
import type { Order } from '@/types'
import { state, mockOrderStatus, reorder, backToTab } from '@/store'
import { hm, money, pad, ymd } from '@/utils/format'

const detailNo = ref('')
const mockId = ref('')
const realOrder = ref<OrderDetailDto | null>(null)
const realList = ref<OrderListItem[]>([])
const listLoading = ref(false)
const detailLoading = ref(false)
const busy = ref(false)
const subscribedOnce = ref(false)
const autoPayOnEntry = ref(false)
const autoPayTriggered = ref(false)
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

const detailMode = computed(() => !!(detailNo.value || mockId.value))
const mockOrder = computed<Order | undefined>(() => state.orders.find((o) => o.id === mockId.value))

/** mock 历史订单 → 统一详情模型（mock 默认分支，行为与之前一致） */
function mockToView(o: Order): OrderView {
  return {
    id: o.id,
    no: o.no,
    code: o.code,
    mode: o.mode,
    items: o.items.map((item) => ({
      key: item.key,
      productCode: item.productId,
      name: item.name,
      en: item.en,
      specText: item.specText,
      unitPrice: item.unitPrice,
      qty: item.qty,
      art: item.art,
      tile: item.tile
    })),
    subtotal: o.subtotal,
    discount: o.discount,
    deliveryFee: o.deliveryFee,
    total: o.total,
    couponTitle: o.couponTitle,
    pay: o.pay,
    remark: o.remark,
    createdAt: o.createdAt,
    store: o.store,
    tableNo: '',
    payStatus: 'paid',
    orderStatus: mockOrderStatus(o),
    refundReason: '',
    refundRequestedAt: 0,
    refundedAt: 0,
    payDeadline: 0,
    couponId: undefined,
    balancePay: 0,
    wechatPay: 0
  }
}

const order = computed<OrderView | null>(() => {
  if (useMock) return mockOrder.value ? mockToView(mockOrder.value) : null
  return realOrder.value ? toOrderView(realOrder.value, STORE.name) : null
})

/* ---- v1.6.0：4 态状态文案 + payDeadline 倒计时 ---- */
const deadline = computed(() => order.value?.payDeadline ?? 0)
const remainMs = computed(() => (deadline.value ? deadline.value - now.value : 0))
const expired = computed(() => deadline.value > 0 && remainMs.value <= 0)
/** 过期后未支付订单按 cancelled 展示（服务端定时任务会置 cancelled，这里兜底 UI） */
const displayStatus = computed<OrderStatus>(() => {
  const status = order.value?.orderStatus ?? 'created'
  return expired.value && status === 'created' ? 'cancelled' : status
})
const statusLabel = computed(() => orderStatusText(displayStatus.value))
const statusHint = computed(() =>
  expired.value && order.value?.orderStatus === 'created'
    ? '已超过支付时限，订单自动取消'
    : orderStatusHint(displayStatus.value)
)
const countdownText = computed(() => {
  if (displayStatus.value !== 'created' || !deadline.value) return ''
  const sec = Math.max(0, Math.ceil(remainMs.value / 1000))
  if (sec <= 0) return ''
  return `支付剩余 ${Math.floor(sec / 60)}:${pad(sec % 60)}`
})
watch(expired, (value) => {
  if (value && !useMock && detailNo.value) void loadDetail(detailNo.value)
})

const canPay = computed(
  () =>
    !useMock &&
    !!order.value &&
    order.value.payStatus === 'unpaid' &&
    displayStatus.value === 'created' &&
    !expired.value
)
const canCancel = computed(
  () => !useMock && !!order.value && displayStatus.value === 'created' && !expired.value
)
const canRefund = computed(
  () => !useMock && !!order.value && (displayStatus.value === 'paid' || displayStatus.value === 'completed')
)
const REFUND_PRESETS = ['点错了 / 规格有误', '等待时间较长', '门店建议退款', '其他原因']
const refundOpen = ref(false)
const refundReason = ref('')

/* ---- 评价（已支付即可评价） ---- */
const review = ref<OrderReview | null>(null)
const reviewLoading = ref(false)
const reviewKey = computed(() => order.value?.no || detailNo.value)
const reviewAt = computed(() => {
  const iso = review.value?.createdAt
  if (!iso) return ''
  const ts = Date.parse(iso)
  return Number.isFinite(ts) ? `${ymd(ts)} ${hm(ts)}` : ''
})

async function loadReview() {
  const key = reviewKey.value
  if (!key || !['paid', 'completed'].includes(displayStatus.value)) {
    review.value = null
    return
  }
  reviewLoading.value = true
  try {
    review.value = useMock ? getMockReview(key) : await getOrderReview(key)
  } finally {
    reviewLoading.value = false
  }
}

function goReview() {
  const no = reviewKey.value
  if (!no) return
  uni.navigateTo({ url: `/pages/review/index?no=${encodeURIComponent(no)}` })
}

/** 列表：mock 用本地订单，真实用 GET /app/orders */
const orderList = computed<OrderListItem[]>(() => {
  if (!useMock) return realList.value
  return state.orders.map((o) => ({
    id: o.id,
    no: o.no,
    code: o.code,
    tableNo: '',
    itemCount: o.items.reduce((sum, item) => sum + item.qty, 0),
    subtotal: o.subtotal,
    discount: o.discount,
    total: o.total,
    payMode: o.pay,
    payStatus: 'paid',
    orderStatus: mockOrderStatus(o),
    createdAt: o.createdAt,
    remark: o.remark,
    refundReason: '',
    payDeadline: 0
  }))
})

onLoad((q) => {
  const no = (q?.no as string) || ''
  const id = (q?.id as string) || ''
  autoPayOnEntry.value = q?.autopay === '1' || q?.autopay === 'true'
  if (autoPayOnEntry.value && isSignedOut()) {
    // 扫码代客订单付款时，即使此前点过退出登录也自动解除拦截，由 request 层通过 uni.login 静默建立游客微信会话直接拉起收银台
    setToken('')
  }
  timer = setInterval(() => (now.value = Date.now()), 1000)
  if (no) {
    detailNo.value = no
    void loadDetail(no)
  } else if (id && useMock) {
    mockId.value = id
  } else {
    void loadList()
  }
  // 结算页带过来的结果标记：mock 固定支付成功；真实区分支付/取消/失败/超时关闭
  const fresh = q?.fresh ? String(q.fresh) : ''
  if (fresh) {
    const FRESH_TEXT: Record<string, { title: string; icon: 'success' | 'none'; duration?: number }> = {
      paid: { title: '支付成功', icon: 'success' },
      cancelled: { title: '已取消支付，可在订单详情继续付款', icon: 'none', duration: 2400 },
      closed: { title: '订单已超时取消', icon: 'none', duration: 2200 },
      failed: { title: '支付未完成，可在订单详情重试', icon: 'none', duration: 2400 },
      created: { title: '订单已创建', icon: 'none' }
    }
    const tip = useMock
      ? { title: '支付成功', icon: 'success' as const }
      : FRESH_TEXT[fresh] || FRESH_TEXT.created
    uni.showToast({ title: tip.title, icon: tip.icon, duration: tip.duration ?? 1800 })
  }
})
onShow(() => {
  if (detailMode.value) void loadReview()
})
onUnload(() => timer && clearInterval(timer))

async function loadDetail(no: string) {
  if (useMock) return
  detailLoading.value = true
  try {
    realOrder.value = await getOrder(no)
  } catch {
    // 40404 等由请求层按映射表提示；页面展示空态
    realOrder.value = null
  } finally {
    detailLoading.value = false
  }
  if (autoPayOnEntry.value && !autoPayTriggered.value && canPay.value && order.value?.pay === 'wechat') {
    autoPayTriggered.value = true
    void executePay(false)
  }
  await loadReview()
}

async function loadList() {
  if (useMock) return
  listLoading.value = true
  try {
    const page = await listMyOrders({ pageNum: 1, pageSize: 20 })
    realList.value = page.rows.map(toOrderListItem)
  } catch {
    realList.value = []
  } finally {
    listLoading.value = false
  }
}

function statusText(status: Parameters<typeof orderStatusText>[0]) {
  return orderStatusText(status)
}

function openOrder(item: OrderListItem) {
  const url = useMock ? `/pages/order/index?id=${item.id}` : `/pages/order/index?no=${item.no}`
  uni.navigateTo({ url })
}

function call() {
  uni.makePhoneCall({ phoneNumber: STORE.phone.replace(/-/g, ''), fail: () => {} })
}

function again() {
  if (!mockOrder.value) return
  reorder(mockOrder.value)
  uni.showToast({ title: '已加入购物车', icon: 'none' })
  setTimeout(() => backToTab('menu'), 500)
}

function cancelNow() {
  if (busy.value || !detailNo.value) return
  uni.showModal({
    title: '取消订单？',
    content: '取消后订单不可恢复，券与库存会退回',
    confirmText: '取消订单',
    confirmColor: '#663A24',
    success: async (res) => {
      if (!res.confirm || !detailNo.value) return
      busy.value = true
      try {
        realOrder.value = await cancelOrder(detailNo.value)
        uni.showToast({ title: '订单已取消', icon: 'none' })
      } catch {
        // 40916（已支付不可取消）/ 40918（已完成）/ 40404 由请求层按映射表提示
      } finally {
        busy.value = false
      }
    }
  })
}

/**
 * 支付：balance 同步扣款；wechat 拉 wx.requestPayment 后轮询订单至 paid（1s × 30）。
 * 取消 / 失败 / 超时都给明确提示，订单保持待支付可重试。
 */
async function payNow() {
  await executePay(true)
}

async function executePay(fromUserGesture: boolean) {
  if (busy.value || !detailNo.value || !order.value) return
  if (expired.value) {
    uni.showToast({ title: '订单已超时取消', icon: 'none' })
    return
  }
  const mode = order.value.pay
  if (mode === 'mixed') {
    // TODO(mixed): 组合支付 UI 与 balancePayCent/wechatPayCent 拆分校验留到下一轮
    uni.showToast({ title: '组合支付暂未开放', icon: 'none' })
    return
  }
  busy.value = true
  if (fromUserGesture) {
    // 仅在用户点击手势内同步触发订阅弹窗，自动拉起收银台时跳过以免阻塞 wx.requestPayment
    const subResult = await promptOrderSubscribe('order_pay')
    if (Object.keys(subResult.results).length) {
      const ok = await reportOrderSubscribe(detailNo.value, subResult, 'order_pay')
      if (ok) subscribedOnce.value = true
    }
  }
  uni.showLoading({ title: mode === 'wechat' ? '正在拉起支付' : '余额支付中', mask: true })
  try {
    const outcome = await payOrderFlow(detailNo.value, mode)
    uni.hideLoading()
    busy.value = false
    if (outcome.status === 'paid') {
      realOrder.value = outcome.order
      uni.showToast({ title: '支付成功', icon: 'success' })
      await loadReview()
      return
    }
    if (outcome.status === 'closed') {
      realOrder.value = outcome.order
      uni.showToast({ title: '订单已超时取消', icon: 'none' })
      return
    }
    if (outcome.status === 'cancelled') {
      uni.showToast({ title: '已取消支付', icon: 'none' })
      return
    }
    if (outcome.status === 'failed' || outcome.status === 'unsupported') {
      uni.showToast({ title: outcome.message, icon: 'none', duration: 2200 })
      return
    }
    // timeout：微信侧已支付但回调未到，提示稍后刷新并重新拉一次详情
    uni.showToast({ title: '支付结果确认中，请稍后刷新', icon: 'none', duration: 2400 })
    void loadDetail(detailNo.value)
  } catch {
    // 40903 余额不足 / 40916 状态变化 / 40922 / 50305 等由请求层按映射表提示
    uni.hideLoading()
    busy.value = false
  }
}

const canSubscribe = computed(
  () =>
    !useMock &&
    !!detailNo.value &&
    getSubscribeTemplateIds('order_detail').length > 0 &&
    ['paid', 'making', 'ready', 'refund_pending', 'refunding'].includes(displayStatus.value)
)

async function subscribeNow() {
  if (!detailNo.value || busy.value) return
  busy.value = true
  try {
    const ok = await requestOrderSubscribe(detailNo.value, undefined, 'order_detail')
    if (ok) {
      subscribedOnce.value = true
      uni.showToast({ title: '已开启订单进度提醒', icon: 'success' })
    } else {
      uni.showToast({ title: '未开启消息提醒', icon: 'none' })
    }
  } finally {
    busy.value = false
  }
}

function openRefund() {
  if (!canRefund.value || busy.value) return
  refundReason.value = ''
  refundOpen.value = true
}

async function submitRefund() {
  if (!detailNo.value || busy.value) return
  busy.value = true
  // 点击提交退款时同步请求退款结果订阅消息授权
  const subResult = await promptOrderSubscribe('order_refund')
  try {
    const reason = refundReason.value.trim() || '用户申请退款'
    realOrder.value = await applyOrderRefund(detailNo.value, reason)
    if (Object.keys(subResult.results).length) {
      const ok = await reportOrderSubscribe(detailNo.value, subResult, 'order_refund')
      if (ok) subscribedOnce.value = true
    }
    refundOpen.value = false
    uni.showToast({ title: '退款申请已提交，等待审核', icon: 'none', duration: 2200 })
  } catch {
    // 异常由请求层统一提示
  } finally {
    busy.value = false
  }
}
function itemCover(code: string) {
  const product = getProduct(code)
  return mediaCover(product?.coverUrl, product?.gallery)
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: $canvas;
}
.wrap {
  padding: 12rpx 28rpx 0;
}
.code-card {
  position: relative;
  padding: 44rpx 44rpx 40rpx;
  border-radius: 56rpx;
  background: $espresso;
  overflow: hidden;
  box-shadow: $shadow-coffee;
  display: flex;
  flex-direction: column;
}
.orb {
  position: absolute;
  border-radius: 50%;
}
.o1 {
  width: 280rpx;
  height: 280rpx;
  right: -90rpx;
  top: -100rpx;
  background: $mocha;
}
.o2 {
  width: 150rpx;
  height: 150rpx;
  right: 70rpx;
  top: 40rpx;
  background: rgba($caramel, 0.5);
}
.cc-l {
  position: relative;
  font-size: 24rpx;
  color: $cream;
}
.cc-code {
  position: relative;
  font-size: 140rpx;
  line-height: 1.05;
  font-weight: 800;
  color: $paper;
  letter-spacing: 4rpx;
  @include num;
}
.cc-stage {
  position: relative;
  font-size: 36rpx;
  font-weight: 800;
  color: $paper;
  &.live {
    color: $caramel;
  }
}
.code-card.muted .cc-code {
  color: rgba($paper, 0.55);
  text-decoration: line-through;
}
.cc-hint {
  position: relative;
  font-size: 24rpx;
  color: rgba($paper, 0.75);
}
/* 状态标签行：v1.6.0 只有 4 态，不再有制作进度步骤条 */
.cc-status-row {
  position: relative;
  display: flex;
  align-items: center;
  margin-top: 8rpx;
}
.cc-count {
  margin-left: 16rpx;
  padding: 4rpx 14rpx;
  border-radius: 12rpx;
  background: rgba(255, 249, 240, 0.16);
  display: flex;
  align-items: center;
}
.cc-count-t {
  margin-left: 6rpx;
  font-size: 22rpx;
  font-weight: 600;
  color: #ffd9a0;
  font-family: $font-latin;
}
.box {
  margin-top: 22rpx;
  padding: 28rpx 30rpx;
  border-radius: 40rpx;
  background: $paper;
  box-shadow: $shadow-soft;
}
.where {
  display: flex;
  flex-direction: column;
}
.w-head {
  display: flex;
  align-items: center;
}
.w-t {
  margin-left: 12rpx;
  font-size: 30rpx;
  font-weight: 700;
}
.w-s {
  margin: 6rpx 0 0 46rpx;
  font-size: 24rpx;
  color: $ink-2;
}
.item {
  display: flex;
  align-items: center;
  padding: 12rpx 0;
}
.item-cover { width: 100%; height: 100%; display: block; }
.thumb {
  width: 96rpx;
  height: 96rpx;
  border-radius: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
.it-info {
  flex: 1;
  min-width: 0;
  padding: 0 20rpx;
  display: flex;
  flex-direction: column;
}
.it-name {
  font-size: 28rpx;
  font-weight: 700;
}
.it-spec {
  font-size: 21rpx;
  color: $ink-3;
  @include ellipsis(1);
}
.it-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.it-price {
  font-size: 28rpx;
  font-weight: 700;
  @include num;
}
.it-qty {
  font-size: 22rpx;
  color: $ink-3;
}
.line {
  height: 1rpx;
  background: $line;
  margin: 16rpx 0 10rpx;
}
.kv {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 10rpx 0;
}
.k {
  font-size: 25rpx;
  color: $ink-2;
}
.v {
  font-size: 26rpx;
  @include num;
  &.off {
    color: $danger;
    font-weight: 700;
  }
  &.big {
    font-size: 40rpx;
    font-weight: 800;
  }
  &.mono {
    letter-spacing: 1rpx;
  }
}
.kv.total {
  margin-top: 6rpx;
}
/* ---------- 评价 ---------- */
.review {
  display: flex;
  flex-direction: column;
}
.rv-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.rv-t {
  font-size: 28rpx;
  font-weight: 700;
}
.rv-go {
  font-size: 24rpx;
  font-weight: 600;
  color: $toffee;
}
.rv-body {
  margin-top: 14rpx;
  display: flex;
  flex-direction: column;
}
.rv-stars {
  display: flex;
  align-items: center;
}
.rv-score {
  margin-left: 10rpx;
  font-size: 26rpx;
  font-weight: 800;
  color: #c68a2b;
  @include num;
}
.rv-content {
  margin-top: 10rpx;
  font-size: 25rpx;
  line-height: 1.6;
  color: $ink-2;
}
.rv-time {
  margin-top: 8rpx;
  font-size: 21rpx;
  color: $ink-3;
}
.rv-empty {
  margin-top: 10rpx;
  font-size: 23rpx;
  color: $ink-3;
}
.actions {
  margin-top: 36rpx;
  display: flex;
}
.btn {
  flex: 1;
  height: 96rpx;
  border-radius: 32rpx;
  background: $espresso;
  display: flex;
  align-items: center;
  justify-content: center;
  &.ghost {
    margin-right: 20rpx;
    background: $latte;
  }
}
.btn-t {
  margin-left: 8rpx;
  font-size: 29rpx;
  font-weight: 700;
  color: $paper;
  &.ink {
    color: $espresso;
  }
}
.tail {
  height: calc(env(safe-area-inset-bottom) + 60rpx);
}

/* ---------- 订单列表 ---------- */
.order-list {
  margin-top: 12rpx;
}
.order-card {
  margin-bottom: 18rpx;
  padding: 26rpx 30rpx;
  border-radius: 38rpx;
  background: $paper;
  box-shadow: $shadow-soft;
  display: flex;
  flex-direction: column;
}
.oc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.oc-code {
  font-size: 32rpx;
  font-weight: 800;
  @include num;
}
.oc-status {
  padding: 4rpx 14rpx;
  border-radius: 12rpx;
  font-size: 20rpx;
  color: $ink-3;
  background: $canvas;
  &.live {
    color: $paper;
    background: $toffee;
  }
}
.oc-items {
  margin-top: 8rpx;
  font-size: 23rpx;
  color: $ink-2;
  @include ellipsis(1);
}
.oc-foot {
  margin-top: 14rpx;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.oc-time {
  font-size: 21rpx;
  color: $ink-3;
}
.oc-total {
  font-size: 32rpx;
  font-weight: 800;
  @include num;
}
.empty {
  padding-top: 160rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-t {
  font-size: 25rpx;
  color: $ink-3;
}
.btn.busy {
  opacity: 0.7;
}
.w-table {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: $espresso;
}
.refund-box {
  background: #FFF4E8;
  border: 1rpx solid #F0D2AE;
}
.rf-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10rpx;
}
.rf-title {
  font-size: 28rpx;
  font-weight: 700;
  color: $espresso;
}
.rf-tag {
  font-size: 22rpx;
  font-weight: 600;
  color: $toffee;
}
.rf-tag.done {
  color: #36734F;
}
.rf-reason,
.rf-time {
  display: block;
  font-size: 24rpx;
  color: $ink-2;
  margin-top: 6rpx;
}
.rf-sheet {
  padding: 20rpx 36rpx calc(env(safe-area-inset-bottom) + 32rpx);
}
.rf-tip {
  display: block;
  font-size: 24rpx;
  color: $ink-2;
  margin-bottom: 20rpx;
}
.rf-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-bottom: 20rpx;
}
.rf-chip {
  padding: 12rpx 22rpx;
  border-radius: 999rpx;
  background: #EFE4D2;
  color: $espresso;
  font-size: 24rpx;
}
.rf-chip.on {
  background: $espresso;
  color: $paper;
}
.rf-input {
  width: 100%;
  min-height: 160rpx;
  padding: 20rpx;
  border-radius: 24rpx;
  background: #fff;
  font-size: 26rpx;
  color: $ink;
  box-sizing: border-box;
}
.rf-submit {
  margin-top: 24rpx;
  height: 92rpx;
  border-radius: 30rpx;
  background: $espresso;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rf-submit.busy {
  opacity: 0.7;
}
.rf-submit-t {
  font-size: 28rpx;
  font-weight: 700;
  color: $paper;
}
</style>

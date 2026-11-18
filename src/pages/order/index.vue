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
            <text class="oc-status" :class="{ live: o.orderStatus !== 'completed' && o.orderStatus !== 'cancelled' }">
              {{ statusText(o.orderStatus) }}
            </text>
          </view>
          <text class="oc-items">{{ o.itemCount ? '共 ' + o.itemCount + ' 件商品' : '自取订单' }}</text>
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
      <!-- 取餐号卡 -->
      <view class="code-card">
        <view class="orb o1" />
        <view class="orb o2" />
        <text class="cc-l">{{ order.mode === 'pickup' ? '取餐号' : '外送单号' }}</text>
        <text class="cc-code">{{ order.code || '—' }}</text>
        <text class="cc-stage">{{ stage.label }}</text>
        <text class="cc-hint">{{ stage.hint }}</text>
        <view class="steps">
          <view v-for="(item, i) in stage.steps" :key="item" class="step" :class="{ done: i <= stage.step }">
            <view class="dot">
              <Icon v-if="i < stage.step" name="check" :size="20" color="#462719" :stroke="3.2" />
              <view v-else-if="i === stage.step" class="dot-in" />
            </view>
            <text class="step-t">{{ item }}</text>
            <view v-if="i < stage.steps.length - 1" class="bar" :class="{ done: i < stage.step }" />
          </view>
        </view>
      </view>

      <view class="box where">
        <view class="w-head">
          <Icon :name="order.mode === 'pickup' ? 'store' : 'scooter'" :size="32" color="#663A24" />
          <text class="w-t">{{ order.mode === 'pickup' ? order.store : '外卖配送' }}</text>
        </view>
        <text class="w-s">{{ order.mode === 'pickup' ? STORE.address : '外送信息已下线，仅展示历史订单' }}</text>
      </view>

      <view class="box">
        <view v-for="it in order.items" :key="it.key" class="item">
          <view class="thumb">
            <ProductImagePlaceholder compact />
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
            <text class="btn-t">{{ busy ? '处理中…' : '去支付' }}</text>
          </view>
        </template>
      </view>
      <view class="tail" />
    </view>

    <view v-else class="empty">
      <text class="empty-t">{{ detailLoading ? '正在加载订单…' : '订单不存在或已删除' }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import Icon from '@/components/Icon.vue'
import ProductImagePlaceholder from '@/components/ProductImagePlaceholder.vue'
import { STORE } from '@/mock/products'
import { useMock } from '@/config/env'
import {
  cancelOrder,
  getOrder,
  listMyOrders,
  orderStatusText,
  payModeText,
  payOrder,
  toOrderListItem,
  toOrderView,
  type OrderDetailDto,
  type OrderListItem,
  type OrderView
} from '@/api'
import type { Order } from '@/types'
import { state, orderStage, reorder, backToTab } from '@/store'
import { hm, money, ymd } from '@/utils/format'

const detailNo = ref('')
const mockId = ref('')
const realOrder = ref<OrderDetailDto | null>(null)
const realList = ref<OrderListItem[]>([])
const listLoading = ref(false)
const detailLoading = ref(false)
const busy = ref(false)
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
    payStatus: 'paid',
    orderStatus: o.archived ? 'completed' : 'making',
    couponId: undefined,
    balancePay: 0,
    wechatPay: 0
  }
}

const order = computed<OrderView | null>(() => {
  if (useMock) return mockOrder.value ? mockToView(mockOrder.value) : null
  return realOrder.value ? toOrderView(realOrder.value, STORE.name) : null
})

/** 真实状态机 → 取餐进度 */
function realStage(o: OrderView) {
  const steps = ['已下单', '制作中', '请取餐', '已完成']
  if (o.orderStatus === 'cancelled') {
    return { step: 0, steps: ['已取消'], label: '已取消', hint: '订单已取消，欢迎再来' }
  }
  if (o.orderStatus === 'completed') {
    return { step: 3, steps, label: '已完成', hint: '感谢光临，期待下次见' }
  }
  if (o.orderStatus === 'ready') {
    return { step: 2, steps, label: '请取餐', hint: '到吧台报取餐号即可' }
  }
  if (o.orderStatus === 'making') {
    return { step: 1, steps, label: '制作中', hint: '咖啡师正在制作，请稍候' }
  }
  if (o.orderStatus === 'paid') {
    return { step: 1, steps, label: '已支付', hint: '门店已收到订单' }
  }
  return { step: 0, steps, label: '待支付', hint: '请尽快完成支付' }
}

const stage = computed(() => {
  if (useMock) {
    return mockOrder.value
      ? orderStage(mockOrder.value, now.value)
      : { step: 0, steps: [] as string[], label: '', hint: '' }
  }
  return order.value
    ? realStage(order.value)
    : { step: 0, steps: [] as string[], label: '', hint: '' }
})

const canPay = computed(
  () => !useMock && !!order.value && order.value.payStatus === 'unpaid' && order.value.orderStatus === 'created'
)
const canCancel = computed(() => !useMock && !!order.value && order.value.orderStatus === 'created')

/** 列表：mock 用本地订单，真实用 GET /app/orders */
const orderList = computed<OrderListItem[]>(() => {
  if (!useMock) return realList.value
  return state.orders.map((o) => ({
    id: o.id,
    no: o.no,
    code: o.code,
    itemCount: o.items.reduce((sum, item) => sum + item.qty, 0),
    subtotal: o.subtotal,
    discount: o.discount,
    total: o.total,
    payMode: o.pay,
    payStatus: 'paid',
    orderStatus: o.archived ? 'completed' : 'making',
    createdAt: o.createdAt,
    remark: o.remark
  }))
})

onLoad((q) => {
  const no = (q?.no as string) || ''
  const id = (q?.id as string) || ''
  timer = setInterval(() => (now.value = Date.now()), 1000)
  if (no) {
    detailNo.value = no
    loadDetail(no)
  } else if (id && useMock) {
    mockId.value = id
  } else {
    loadList()
  }
  // mock 下单即支付；真实 createOrder 只是创建待支付订单
  if (q?.fresh) {
    uni.showToast({ title: useMock ? '支付成功' : '订单已创建', icon: useMock ? 'success' : 'none' })
  }
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
        // 40916（状态不允许）/ 40918（已完成或已取消）/ 40404 由请求层按 README 映射表提示
      } finally {
        busy.value = false
      }
    }
  })
}

async function payNow() {
  if (busy.value || !detailNo.value || !order.value) return
  const mode = order.value.pay
  if (mode === 'mixed') {
    // TODO(mixed): 组合支付 UI 与 balancePayCent/wechatPayCent 拆分校验留到下一轮
    uni.showToast({ title: '组合支付暂未开放', icon: 'none' })
    return
  }
  busy.value = true
  uni.showLoading({ title: mode === 'wechat' ? '正在拉起支付' : '余额支付中', mask: true })
  try {
    realOrder.value = await payOrder(detailNo.value, { payMode: mode })
    uni.hideLoading()
    busy.value = false
    uni.showToast({ title: '支付成功', icon: 'success' })
  } catch {
    // 40903/40916/40917/40917/40922 等由请求层按映射表提示
    uni.hideLoading()
    busy.value = false
  }
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
  margin-top: 8rpx;
  font-size: 36rpx;
  font-weight: 800;
  color: $paper;
}
.cc-hint {
  position: relative;
  font-size: 24rpx;
  color: rgba($paper, 0.75);
}
.steps {
  position: relative;
  margin-top: 40rpx;
  display: flex;
}
.step {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.dot {
  position: relative;
  z-index: 2;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: rgba($paper, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
}
.step.done .dot {
  background: $caramel;
}
.dot-in {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: $roast;
}
.step-t {
  margin-top: 12rpx;
  font-size: 22rpx;
  color: rgba($paper, 0.55);
}
.step.done .step-t {
  color: $paper;
  font-weight: 600;
}
.bar {
  position: absolute;
  left: 48rpx;
  right: 8rpx;
  top: 18rpx;
  height: 4rpx;
  border-radius: 4rpx;
  background: rgba($paper, 0.16);
  &.done {
    background: $caramel;
  }
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
</style>

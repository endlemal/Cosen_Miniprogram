<template>
  <view class="page">
    <NavBar title="确认订单" />

    <view v-if="!items.length" class="empty">
      <text class="empty-t">购物车是空的</text>
      <view class="empty-btn" hover-class="tap-on" @tap="backToTab('menu')">
        <text class="empty-btn-t">去点单</text>
      </view>
    </view>

    <view v-else class="wrap">
      <!-- 取餐方式：契约 v1.3.0 的 Order.fulfillType 仅 pickup，外送（delivery）已下线。
           原「外卖配送」按钮与 4 元配送费代码位见 src/api/README.md「契约偏差」。
           TODO(delivery): 外送域回归时在此恢复双按钮，并等契约新增 fulfillType 枚举值。 -->
      <view class="mode">
        <view class="mode-i on">
          <Icon name="store" :size="34" color="#FFF9F0" />
          <text class="mode-t">到店自取</text>
        </view>
      </view>

      <!-- 自取门店信息；外送地址块（原 delivery 分支）已随契约 fulfillType 收敛移除 -->
      <view class="box where">
        <text class="w-t">{{ STORE.name }}</text>
        <text class="w-s">{{ STORE.address }} · 到店自取</text>
        <view v-if="state.tableNo" class="w-table">
          <Icon name="pin" :size="26" color="#663A24" />
          <text class="w-table-t">扫码桌位：{{ state.tableNo }} 号桌（下单自动关联桌号）</text>
        </view>
        <view class="w-eta">
          <Icon name="clock" :size="26" color="#87512E" />
          <text class="w-eta-t">现在下单，约 8 分钟后可取</text>
        </view>
      </view>

      <!-- 商品 -->
      <view class="box">
        <view v-for="it in items" :key="it.key" class="item">
          <view class="thumb">
            <image v-if="mediaUrl(it.coverUrl)" class="thumb-img" :src="mediaUrl(it.coverUrl)" mode="aspectFill" />
            <ProductImagePlaceholder v-else :product-key="it.productId" />
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
      </view>

      <!-- 优惠与费用 -->
      <view class="box">
        <!-- 游客也展示礼品券入口，但只有登录会员能真正选券；游客点击提示登录 -->
        <view class="row" :class="{ locked: !canUseMember }" hover-class="tap-on" @tap="onCouponTap">
          <view class="row-l">
            <Icon name="ticket" :size="32" color="#663A24" />
            <text class="row-t">礼品券</text>
          </view>
          <view class="row-r">
            <text v-if="chosen" class="off">−¥{{ money(discount) }}</text>
            <text v-else-if="!canUseMember" class="row-v lock-v">登录后可查看</text>
            <text v-else class="row-v">{{ usableCount ? usableCount + ' 张可用' : '暂无可用' }}</text>
            <Icon name="right" :size="28" color="#856951" />
          </view>
        </view>
        <text v-if="chosen" class="row-note">已选「{{ chosen.title }}」，{{ chosen.issuer }}发放</text>
        <!-- 配送费（原外送 4 元）已下线：fee 恒为 0，不再渲染条目 -->
        <view class="row">
          <view class="row-l">
            <Icon name="chat" :size="32" color="#663A24" />
            <text class="row-t">备注</text>
          </view>
          <input v-model="remark" class="remark" placeholder="口味、包装等要求" placeholder-class="ph" maxlength="40" />
        </view>
      </view>

      <!-- 支付方式：游客也展示「会员余额」入口，点击提示登录；默认仍走微信支付 -->
      <view class="box">
        <text class="box-t">支付方式</text>
        <view
          class="pay"
          :class="{ on: canUseMember && pay === 'balance', off: canUseMember && !balanceEnough, locked: !canUseMember }"
          @tap="pickBalance"
        >
          <view class="pay-ic forest">
            <Icon name="wallet" :size="34" color="#FFF9F0" />
          </view>
          <view class="pay-info">
            <text class="pay-t">会员余额</text>
            <text class="pay-s" :class="{ warn: canUseMember && !balanceEnough }">
              {{ !canUseMember ? '登录后可查看余额并使用余额支付' : !balanceSynced ? '余额加载中…' : balanceEnough ? '可用 ¥' + money2(state.balance) : '余额 ¥' + money2(state.balance) + '，不够支付本单' }}
            </text>
          </view>
          <template v-if="canUseMember">
            <view v-if="!balanceEnough" class="pay-topup" hover-class="tap-on" @tap.stop="toRecharge">
              <text class="pay-topup-t">去充值</text>
            </view>
            <view v-else class="radio" :class="{ on: pay === 'balance' }">
              <Icon v-if="pay === 'balance'" name="check" :size="24" color="#FFF9F0" :stroke="3" />
            </view>
          </template>
          <view v-else class="pay-login" hover-class="tap-on">
            <text class="pay-login-t">去登录</text>
          </view>
        </view>
        <view class="pay" :class="{ on: pay === 'wechat' }" @tap="pay = 'wechat'">
          <view class="pay-ic wx">
            <Icon name="chat" :size="34" color="#FFF9F0" />
          </view>
          <view class="pay-info">
            <text class="pay-t">微信支付</text>
            <text class="pay-s">{{ useMock ? '演示环境，不会真实扣款' : '微信安全支付，实时到账' }}</text>
          </view>
          <view class="radio" :class="{ on: pay === 'wechat' }">
            <Icon v-if="pay === 'wechat'" name="check" :size="24" color="#FFF9F0" :stroke="3" />
          </view>
        </view>
      </view>
      <view class="tail" />
    </view>

    <!-- 支付条 -->
    <view v-if="items.length" class="paybar">
      <view class="pb-l">
        <view class="pb-total">
          <text class="pb-l1">合计</text>
          <text class="pb-c">¥</text>
          <text class="pb-n">{{ money(total) }}</text>
        </view>
        <text v-if="discount > 0" class="pb-save">已优惠 {{ money(discount) }} 元</text>
      </view>
      <view class="pb-btn" :class="{ busy }" hover-class="tap-on" @tap="submit">
        <text class="pb-btn-t">{{ busy ? '支付中…' : pay === 'balance' ? '余额支付' : '微信支付' }}</text>
      </view>
    </view>

    <!-- 选券 -->
    <Sheet v-model:show="couponOpen" title="选择礼品券" bg="#F8F0E3" max-height="80vh">
      <scroll-view scroll-y class="c-list">
        <view class="none" :class="{ on: !couponId }" hover-class="tap-on" @tap="pickCoupon('')">
          <text class="none-t">不使用礼品券</text>
          <view class="radio" :class="{ on: !couponId }">
            <Icon v-if="!couponId" name="check" :size="24" color="#FFF9F0" :stroke="3" />
          </view>
        </view>
        <CouponCard
          v-for="c in couponRows"
          :key="c.coupon.id"
          :coupon="c.coupon"
          :mode="c.ok ? 'available' : 'unusable'"
          :reason="c.ok ? '本单可减 ' + money(c.off) + ' 元' : c.reason"
          selectable
          :selected="couponId === c.coupon.id"
          @select="pickCoupon(c.coupon.id)"
        />
        <view class="c-tail" />
      </scroll-view>
    </Sheet>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import Icon from '@/components/Icon.vue'
import Sheet from '@/components/Sheet.vue'
import ProductImagePlaceholder from '@/components/ProductImagePlaceholder.vue'
import CouponCard from '@/components/CouponCard.vue'
import { STORE } from '@/mock/products'
import { LOGIN_PAGE, useMock } from '@/config/env'
import {
  ApiError,
  createOrder,
  genIdempotencyKey,
  hasToken,
  isSignedOut,
  listMyCoupons,
  payOrderFlow,
  promptOrderSubscribe,
  reportOrderSubscribe,
  setToken,
  toCoupons,
  type CreateOrderReq,
  type SubscribePromptResult
} from '@/api'
import { state, cartTotal, evalCoupon, couponState, placeOrder, backToTab } from '@/store'
import { memberProfile, balanceSynced, syncMemberProfile } from '@/store/member'
import type { Coupon } from '@/types'
import { money, money2 } from '@/utils/format'
import { mediaUrl } from '@/utils/media'

const items = computed(() => state.cart)
const subtotal = computed(() => cartTotal.value)
// 契约 v1.3.0：fulfillType 仅 pickup，结算页固定到店自取；
// 外送（delivery）与 4 元配送费已下线，代码位见模板与 README「契约偏差」。
state.mode = 'pickup'
const fee = computed(() => 0)

/* ---- 礼品券：mock 读本地；真实模式读 GET /app/coupons，默认自动选优惠最大的一张 ---- */
// 礼品券与「会员余额」入口对所有人展示：游客看得到选项，点击时提示登录（先看后登）。
// 是否真正可用仍由 canUseMember 决定；不能只看 memberProfile —— 401 过期或退出登录后
// 旧资料可能还留在内存里，会让游客误以为能用会员资产，所以同时要求有效会话 + 资料已同步 + 手机号已绑定。
const canUseMember = computed(
  () => useMock || (hasToken() && !isSignedOut() && balanceSynced.value && !!memberProfile.value?.phoneBound)
)
const couponId = ref('')
const couponOpen = ref(false)
const realCoupons = ref<Coupon[]>([])
const couponSource = computed<Coupon[]>(() => (useMock ? state.coupons : realCoupons.value))
const couponRows = computed(() =>
  couponSource.value
    .filter((c) => couponState(c) === 'available')
    .map((c) => ({ coupon: c, ...evalCoupon(c, items.value, subtotal.value) }))
    .sort((a, b) => Number(b.ok) - Number(a.ok) || b.off - a.off)
)
const usableCount = computed(() => couponRows.value.filter((r) => r.ok).length)
const chosen = computed(() => couponSource.value.find((c) => c.id === couponId.value))
const discount = computed(() => {
  if (!chosen.value) return 0
  const r = evalCoupon(chosen.value, items.value, subtotal.value)
  return r.ok ? r.off : 0
})

function pickBestCoupon() {
  if (chosen.value && evalCoupon(chosen.value, items.value, subtotal.value).ok) return
  const best = couponRows.value.find((row) => row.ok)
  couponId.value = best ? best.coupon.id : ''
}

// mock 分支保持「进页面即自动选最大优惠券」的原行为
if (useMock) pickBestCoupon()

onMounted(async () => {
  if (useMock) return
  try {
    if (!(await syncMemberProfile())?.phoneBound) return
    realCoupons.value = toCoupons(await listMyCoupons())
  } catch {
    // 40101/40104/40106 请求层已清 token 跳登录；其余错误请求层已 toast
    realCoupons.value = []
  }
  pickBestCoupon()
})

// 购物车变化导致券不再满足条件时，自动取消
watch(subtotal, () => {
  if (chosen.value && !evalCoupon(chosen.value, items.value, subtotal.value).ok) couponId.value = ''
})

// 会话中途失效（401 / 退出 / 静默会话被重置）时清掉会员券，避免游客仍带着券优惠
watch(canUseMember, (ok) => {
  if (ok) return
  couponId.value = ''
  realCoupons.value = []
  if (pay.value === 'balance') pay.value = 'wechat'
})

const total = computed(() => Math.max(0, Math.round((subtotal.value - discount.value + fee.value) * 100) / 100))

/* ---- 支付 ---- */
// TODO(api): 真实模式下余额展示/可付判断应来自 getMemberProfile；
// 本轮只接订单创建，结算页余额仍沿用 mock state，服务端最终校验（40903）。
// TODO(mixed): 契约 payMode 含 mixed（balancePayCent + wechatPayCent = payableCent），
// 本轮不做组合支付 UI；接订单接口时需处理 40920（拆分不平）/ 40921（支付方式不支持）。
// 真实模式：余额来自 GET /app/member/profile（syncMemberProfile 写回 state.balance），
// 同步完成前不判断「够不够」，避免用 mock 的演示余额误导用户。
const balanceEnough = computed(() => canUseMember.value && balanceSynced.value && state.balance >= total.value)
const pay = ref<'balance' | 'wechat'>(canUseMember.value && balanceSynced.value && state.balance >= cartTotal.value ? 'balance' : 'wechat')
watch(balanceEnough, (ok) => {
  if (!ok && pay.value === 'balance') pay.value = 'wechat'
})
let payTouched = false
onMounted(async () => {
  if (useMock) return
  await syncMemberProfile()
  if (!payTouched && balanceEnough.value) pay.value = 'balance'
})
onShow(() => {
  // 从充值页返回时刷新余额
  if (!useMock) void syncMemberProfile()
})
const remark = ref('')
const busy = ref(false)

function pickBalance() {
  if (!canUseMember.value) return requireLogin('会员余额')
  payTouched = true
  if (balanceEnough.value) pay.value = 'balance'
  else uni.showToast({ title: '余额不足，可先充值或改用微信支付', icon: 'none' })
}
/**
 * 游客点击会员入口：入口可见，但需要登录后才能查看/使用，弹窗引导去登录页。
 * 登录页成功后回首页（购物车持久化），用户可再次进入结算继续下单。
 */
function requireLogin(feature: '会员余额' | '礼品券') {
  uni.showModal({
    title: '登录后可用',
    content:
      feature === '礼品券'
        ? '使用微信手机号登录后可查看并选择礼品券，是否现在去登录？'
        : '使用微信手机号登录后可查看会员余额并使用余额支付，是否现在去登录？',
    confirmText: '去登录',
    cancelText: '稍后',
    confirmColor: '#663A24',
    success: (res) => {
      if (res.confirm) uni.navigateTo({ url: LOGIN_PAGE })
    }
  })
}
function onCouponTap() {
  if (!canUseMember.value) return requireLogin('礼品券')
  couponOpen.value = true
}
function pickCoupon(id: string) {
  couponId.value = id
  setTimeout(() => (couponOpen.value = false), 160)
}
function toRecharge() {
  uni.navigateTo({ url: '/pages/recharge/index' })
}

/* ---- 下单：同一次提交的重试复用同一个 Idempotency-Key ---- */
let pendingIdempotencyKey = ''
let pendingPayloadSignature = ''

function idempotencyKeyFor(signature: string): string {
  if (!pendingIdempotencyKey || pendingPayloadSignature !== signature) {
    pendingIdempotencyKey = genIdempotencyKey()
    pendingPayloadSignature = signature
  }
  return pendingIdempotencyKey
}

function realOrderPayload(): CreateOrderReq {
  return {
    items: items.value.map((item) => ({ productCode: item.productId, qty: item.qty })),
    // 契约 CreateOrderReq.couponId 是券实例号 couponNo（不是本地 id）
    couponId: chosen.value?.couponNo || undefined,
    payMode: pay.value,
    tableNo: state.tableNo || undefined,
    remark: remark.value.trim()
  }
}

async function submitReal(subscribeResult?: SubscribePromptResult) {
  const payload = realOrderPayload()
  const signature = JSON.stringify(payload)
  const detail = await createOrder({ ...payload, idempotencyKey: idempotencyKeyFor(signature) })
  // 40925（幂等重放）已由请求层按成功放行，落到与成功相同的分支
  state.cart.splice(0, state.cart.length)
  pendingIdempotencyKey = ''
  pendingPayloadSignature = ''
  if (subscribeResult && Object.keys(subscribeResult.results).length) {
    // 在支付前先落库订阅授权，确保支付回调到达时即可触发 order_paid 通知
    await reportOrderSubscribe(detail.orderNo, subscribeResult, 'order_pay')
  }
  // v1.6.0：订单创建成功后立即按结算页选的支付方式走 POST /app/orders/{orderNo}/pay；
  // wechat 会拉起 wx.requestPayment 并轮询订单至 paid，失败/取消保留待支付订单
  let fresh = 'created'
  try {
    uni.hideLoading()
    uni.showLoading({ title: pay.value === 'wechat' ? '正在拉起支付' : '余额支付中', mask: true })
    const outcome = await payOrderFlow(detail.orderNo, pay.value)
    if (outcome.status === 'paid') {
      fresh = 'paid'
    }
    else if (outcome.status === 'cancelled') fresh = 'cancelled'
    else if (outcome.status === 'closed') fresh = 'closed'
    else fresh = 'failed'
  } catch {
    // 40903 余额不足 / 40916 状态变化 / 40922 / 50305 等由请求层按映射表提示
    fresh = 'failed'
  } finally {
    uni.hideLoading()
    busy.value = false
    // 余额支付 / 组合支付 / 取消退款都会改余额，支付流程结束后刷新
    void syncMemberProfile()
  }
  uni.redirectTo({ url: `/pages/order/index?no=${detail.orderNo}&fresh=${fresh}` })
}

function submitMock() {
  setTimeout(() => {
    const order = placeOrder({
      items: items.value.map((i) => ({ ...i })),
      subtotal: subtotal.value,
      discount: discount.value,
      deliveryFee: fee.value,
      couponId: chosen.value ? couponId.value : undefined,
      pay: pay.value,
      mode: state.mode,
      remark: remark.value.trim()
    })
    uni.hideLoading()
    busy.value = false
    uni.redirectTo({ url: `/pages/order/index?id=${order.id}&fresh=1` })
  }, pay.value === 'wechat' ? 1200 : 700)
}

function submit() {
  if (busy.value || !items.value.length) return
  if (pay.value === 'balance' && !balanceEnough.value) return pickBalance()
  busy.value = true
  if (useMock) {
    uni.showLoading({ title: pay.value === 'wechat' ? '正在调起支付' : '余额支付中', mask: true })
    submitMock()
    return
  }
  // 游客直接下单：点过「退出登录」后本地还留着 signedOut 标记，会把下单/支付请求
  // 直接重定向到登录页。用户已明确点了支付，这里解除该标记，让请求层用 uni.login
  // 静默建立微信会话（游客或本人会员）后继续下单；不登录就不能有会员会话。
  if (isSignedOut()) setToken('')
  // 必须在用户点击手势内同步触发 wx.requestSubscribeMessage，避免异步后丢失手势上下文
  promptOrderSubscribe('order_pay')
    .then((subResult) => {
      uni.showLoading({ title: '正在提交订单', mask: true })
      return submitReal(subResult)
    })
    .catch((e) => {
      uni.hideLoading()
      busy.value = false
      // 40007 = 同 key 不同 payload，丢弃旧 key，下次提交重新生成；
      // 其它错误保留 key，同 payload 重试仍走幂等。
      if (e instanceof ApiError && e.code === 40007) {
        pendingIdempotencyKey = ''
        pendingPayloadSignature = ''
      }
    })
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
.empty {
  padding-top: 240rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.empty-t {
  font-size: 28rpx;
  color: $ink-3;
}
.empty-btn {
  margin-top: 30rpx;
  height: 84rpx;
  padding: 0 60rpx;
  border-radius: 30rpx;
  background: $espresso;
  display: flex;
  align-items: center;
}
.empty-btn-t {
  color: $paper;
  font-weight: 700;
}
.mode {
  display: flex;
  padding: 8rpx;
  border-radius: 34rpx;
  background: $latte;
}
.mode-i {
  flex: 1;
  height: 92rpx;
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
  &.on {
    background: $espresso;
  }
}
.mode-t {
  margin-left: 10rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: $ink-2;
}
.mode-i.on .mode-t {
  color: $paper;
}
.box {
  margin-top: 22rpx;
  padding: 28rpx 30rpx;
  border-radius: 40rpx;
  background: $paper;
  box-shadow: $shadow-soft;
}
.box-t {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  margin-bottom: 10rpx;
}
.where {
  display: flex;
  flex-direction: column;
}
.w-t {
  font-size: 32rpx;
  font-weight: 700;
}
.w-s {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: $ink-2;
}
.w-eta {
  margin-top: 18rpx;
  display: flex;
  align-items: center;
  align-self: flex-start;
  padding: 10rpx 18rpx;
  border-radius: 18rpx;
  background: $latte;
}
.w-eta-t {
  margin-left: 8rpx;
  font-size: 23rpx;
  color: $toffee;
  font-weight: 600;
}
.w-table {
  margin-top: 14rpx;
  display: flex;
  align-items: center;
  align-self: flex-start;
  padding: 10rpx 18rpx;
  border-radius: 18rpx;
  background: #F4E9D8;
}
.w-table-t {
  margin-left: 8rpx;
  font-size: 23rpx;
  color: $espresso;
  font-weight: 600;
}
.item {
  display: flex;
  align-items: center;
  padding: 14rpx 0;
}
.thumb {
  position: relative;
  width: 100rpx;
  height: 100rpx;
  border-radius: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
.thumb-img {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
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
  @include num;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 84rpx;
}
.row-l {
  display: flex;
  align-items: center;
}
.row-t {
  margin-left: 14rpx;
  font-size: 27rpx;
  font-weight: 600;
}
.row-r {
  display: flex;
  align-items: center;
}
.row-v {
  font-size: 25rpx;
  color: $ink-3;
  margin-right: 4rpx;
  &.ink {
    color: $ink;
    font-weight: 700;
    @include num;
  }
}
/* 游客可看但不可用的提示文字 */
.lock-v {
  color: $toffee;
  font-weight: 600;
}
.row.locked .row-t {
  color: $ink-2;
}
.off {
  font-size: 30rpx;
  font-weight: 800;
  color: $danger;
  margin-right: 4rpx;
  @include num;
}
.row-note {
  display: block;
  margin: -10rpx 0 8rpx 46rpx;
  font-size: 21rpx;
  color: $toffee;
}
.remark {
  flex: 1;
  margin-left: 30rpx;
  text-align: right;
  font-size: 25rpx;
}
.ph {
  color: $ink-3;
}
.pay {
  display: flex;
  align-items: center;
  padding: 18rpx 0;
  &.off .pay-t {
    color: $ink-3;
  }
  /* 游客：入口保留、标题保持可读，右侧换成「去登录」 */
  &.locked .pay-t {
    color: $ink-2;
  }
}
.pay-ic {
  width: 72rpx;
  height: 72rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  &.forest {
    background: $espresso;
  }
  &.wx {
    background: #3f9b5f;
  }
}
.pay-info {
  flex: 1;
  min-width: 0;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
}
.pay-t {
  font-size: 28rpx;
  font-weight: 700;
}
.pay-s {
  font-size: 22rpx;
  color: $ink-3;
  &.warn {
    color: $danger;
  }
}
.pay-topup {
  height: 56rpx;
  padding: 0 24rpx;
  border-radius: 20rpx;
  background: $caramel;
  display: flex;
  align-items: center;
}
.pay-topup-t {
  font-size: 23rpx;
  font-weight: 700;
  color: $roast;
}
.pay-login {
  height: 56rpx;
  padding: 0 24rpx;
  border-radius: 20rpx;
  background: $latte;
  display: flex;
  align-items: center;
}
.pay-login-t {
  font-size: 23rpx;
  font-weight: 700;
  color: $toffee;
}
.radio {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 3rpx solid rgba($ink, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  &.on {
    background: $espresso;
    border-color: $espresso;
  }
}
.tail {
  height: calc(env(safe-area-inset-bottom) + 200rpx);
}
.paybar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 28rpx calc(env(safe-area-inset-bottom) + 20rpx) 40rpx;
  background: rgba($paper, 0.96);
  box-shadow: 0 -1rpx 0 $line;
  display: flex;
  align-items: center;
  z-index: 50;
}
.pb-l {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.pb-total {
  display: flex;
  align-items: baseline;
}
.pb-l1 {
  font-size: 24rpx;
  color: $ink-2;
  margin-right: 10rpx;
}
.pb-c {
  font-size: 26rpx;
  font-weight: 700;
}
.pb-n {
  font-size: 50rpx;
  font-weight: 800;
  @include num;
}
.pb-save {
  font-size: 22rpx;
  color: $danger;
}
.pb-btn {
  height: 96rpx;
  padding: 0 56rpx;
  border-radius: 32rpx;
  background: $espresso;
  display: flex;
  align-items: center;
  box-shadow: $shadow-coffee;
  &.busy {
    opacity: 0.7;
  }
}
.pb-btn-t {
  font-size: 30rpx;
  font-weight: 700;
  color: $paper;
}
.c-list {
  height: 66vh;
  padding: 10rpx 28rpx 0;
}
.none {
  height: 100rpx;
  margin-bottom: 22rpx;
  padding: 0 30rpx;
  border-radius: 32rpx;
  background: $paper;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 3rpx solid transparent;
  &.on {
    border-color: $espresso;
  }
}
.none-t {
  font-size: 27rpx;
  font-weight: 600;
}
.c-tail {
  height: 40rpx;
}
</style>

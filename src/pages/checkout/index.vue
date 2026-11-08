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
      <!-- 取餐方式 -->
      <view class="mode">
        <view class="mode-i" :class="{ on: state.mode === 'pickup' }" @tap="state.mode = 'pickup'">
          <Icon name="store" :size="34" :color="state.mode === 'pickup' ? '#FAFBF7' : '#566156'" />
          <text class="mode-t">到店自取</text>
        </view>
        <view class="mode-i" :class="{ on: state.mode === 'delivery' }" @tap="state.mode = 'delivery'">
          <Icon name="scooter" :size="34" :color="state.mode === 'delivery' ? '#FAFBF7' : '#566156'" />
          <text class="mode-t">外卖配送</text>
        </view>
      </view>

      <view class="box where">
        <template v-if="state.mode === 'pickup'">
          <text class="w-t">{{ STORE.name }}</text>
          <text class="w-s">{{ STORE.address }}，距你 {{ STORE.distance }}</text>
          <view class="w-eta">
            <Icon name="clock" :size="26" color="#6E8B3D" />
            <text class="w-eta-t">现在下单，约 8 分钟后可取</text>
          </view>
        </template>
        <template v-else>
          <text class="w-t">淮海中路 300 号 香港新世界大厦 18F 前台</text>
          <text class="w-s">{{ USER.name }} {{ USER.phone }}</text>
          <view class="w-eta">
            <Icon name="clock" :size="26" color="#6E8B3D" />
            <text class="w-eta-t">预计 30 分钟送达，配送费 4 元</text>
          </view>
        </template>
      </view>

      <!-- 商品 -->
      <view class="box">
        <view v-for="it in items" :key="it.key" class="item">
          <view class="thumb" :style="{ background: 'linear-gradient(160deg,' + it.tile[0] + ',' + it.tile[1] + ')' }">
            <DrinkArt :spec="it.art" :size="66" />
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
        <view class="row" hover-class="tap-on" @tap="couponOpen = true">
          <view class="row-l">
            <Icon name="ticket" :size="32" color="#3B5A40" />
            <text class="row-t">礼品券</text>
          </view>
          <view class="row-r">
            <text v-if="chosen" class="off">−¥{{ money(discount) }}</text>
            <text v-else class="row-v">{{ usableCount ? usableCount + ' 张可用' : '暂无可用' }}</text>
            <Icon name="right" :size="28" color="#97A094" />
          </view>
        </view>
        <text v-if="chosen" class="row-note">已选「{{ chosen.title }}」，{{ chosen.issuer }}发放</text>
        <view v-if="fee > 0" class="row">
          <view class="row-l">
            <Icon name="scooter" :size="32" color="#3B5A40" />
            <text class="row-t">配送费</text>
          </view>
          <text class="row-v ink">¥{{ fee }}</text>
        </view>
        <view class="row">
          <view class="row-l">
            <Icon name="chat" :size="32" color="#3B5A40" />
            <text class="row-t">备注</text>
          </view>
          <input v-model="remark" class="remark" placeholder="口味、包装等要求" placeholder-class="ph" maxlength="40" />
        </view>
      </view>

      <!-- 支付方式 -->
      <view class="box">
        <text class="box-t">支付方式</text>
        <view class="pay" :class="{ on: pay === 'balance', off: !balanceEnough }" @tap="pickBalance">
          <view class="pay-ic forest">
            <Icon name="wallet" :size="34" color="#FAFBF7" />
          </view>
          <view class="pay-info">
            <text class="pay-t">会员余额</text>
            <text class="pay-s" :class="{ warn: !balanceEnough }">
              {{ balanceEnough ? '可用 ¥' + money2(state.balance) : '余额 ¥' + money2(state.balance) + '，不够支付本单' }}
            </text>
          </view>
          <view v-if="!balanceEnough" class="pay-topup" hover-class="tap-on" @tap.stop="toRecharge">
            <text class="pay-topup-t">去充值</text>
          </view>
          <view v-else class="radio" :class="{ on: pay === 'balance' }">
            <Icon v-if="pay === 'balance'" name="check" :size="24" color="#FAFBF7" :stroke="3" />
          </view>
        </view>
        <view class="pay" :class="{ on: pay === 'wechat' }" @tap="pay = 'wechat'">
          <view class="pay-ic wx">
            <Icon name="chat" :size="34" color="#FAFBF7" />
          </view>
          <view class="pay-info">
            <text class="pay-t">微信支付</text>
            <text class="pay-s">演示环境，不会真实扣款</text>
          </view>
          <view class="radio" :class="{ on: pay === 'wechat' }">
            <Icon v-if="pay === 'wechat'" name="check" :size="24" color="#FAFBF7" :stroke="3" />
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
    <Sheet v-model:show="couponOpen" title="选择礼品券" bg="#EEF0EA" max-height="80vh">
      <scroll-view scroll-y class="c-list">
        <view class="none" :class="{ on: !couponId }" hover-class="tap-on" @tap="pickCoupon('')">
          <text class="none-t">不使用礼品券</text>
          <view class="radio" :class="{ on: !couponId }">
            <Icon v-if="!couponId" name="check" :size="24" color="#FAFBF7" :stroke="3" />
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
import { computed, ref, watch } from 'vue'
import NavBar from '@/components/NavBar.vue'
import Icon from '@/components/Icon.vue'
import Sheet from '@/components/Sheet.vue'
import DrinkArt from '@/components/DrinkArt.vue'
import CouponCard from '@/components/CouponCard.vue'
import { STORE } from '@/mock/products'
import { USER } from '@/mock/seed'
import { state, cartTotal, evalCoupon, bestCoupon, couponState, placeOrder, backToTab } from '@/store'
import { money, money2 } from '@/utils/format'

const items = computed(() => state.cart)
const subtotal = computed(() => cartTotal.value)
const fee = computed(() => (state.mode === 'delivery' ? 4 : 0))

/* ---- 礼品券：默认自动选优惠最大的一张 ---- */
const couponId = ref(bestCoupon(state.cart, cartTotal.value)?.id || '')
const couponOpen = ref(false)
const couponRows = computed(() =>
  state.coupons
    .filter((c) => couponState(c) === 'available')
    .map((c) => ({ coupon: c, ...evalCoupon(c, items.value, subtotal.value) }))
    .sort((a, b) => Number(b.ok) - Number(a.ok) || b.off - a.off)
)
const usableCount = computed(() => couponRows.value.filter((r) => r.ok).length)
const chosen = computed(() => state.coupons.find((c) => c.id === couponId.value))
const discount = computed(() => {
  if (!chosen.value) return 0
  const r = evalCoupon(chosen.value, items.value, subtotal.value)
  return r.ok ? r.off : 0
})
// 购物车变化导致券不再满足条件时，自动取消
watch(subtotal, () => {
  if (chosen.value && !evalCoupon(chosen.value, items.value, subtotal.value).ok) couponId.value = ''
})

const total = computed(() => Math.max(0, Math.round((subtotal.value - discount.value + fee.value) * 100) / 100))

/* ---- 支付 ---- */
const balanceEnough = computed(() => state.balance >= total.value)
const pay = ref<'balance' | 'wechat'>(state.balance >= cartTotal.value ? 'balance' : 'wechat')
watch(balanceEnough, (ok) => {
  if (!ok && pay.value === 'balance') pay.value = 'wechat'
})
const remark = ref('')
const busy = ref(false)

function pickBalance() {
  if (balanceEnough.value) pay.value = 'balance'
  else uni.showToast({ title: '余额不足，可先充值或改用微信支付', icon: 'none' })
}
function pickCoupon(id: string) {
  couponId.value = id
  setTimeout(() => (couponOpen.value = false), 160)
}
function toRecharge() {
  uni.navigateTo({ url: '/pages/recharge/index' })
}

function submit() {
  if (busy.value || !items.value.length) return
  if (pay.value === 'balance' && !balanceEnough.value) return pickBalance()
  busy.value = true
  uni.showLoading({ title: pay.value === 'wechat' ? '正在调起支付' : '余额支付中', mask: true })
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
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: $fog;
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
  background: $forest;
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
  background: $mist;
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
    background: $forest;
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
  background: $mist;
}
.w-eta-t {
  margin-left: 8rpx;
  font-size: 23rpx;
  color: $matcha;
  font-weight: 600;
}
.item {
  display: flex;
  align-items: center;
  padding: 14rpx 0;
}
.thumb {
  width: 100rpx;
  height: 100rpx;
  border-radius: 26rpx;
  display: flex;
  align-items: flex-end;
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
  color: $matcha;
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
}
.pay-ic {
  width: 72rpx;
  height: 72rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  &.forest {
    background: $forest;
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
  background: $sage;
  display: flex;
  align-items: center;
}
.pay-topup-t {
  font-size: 23rpx;
  font-weight: 700;
  color: $pine;
}
.radio {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 3rpx solid rgba(30, 42, 33, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  &.on {
    background: $forest;
    border-color: $forest;
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
  background: rgba(250, 251, 247, 0.96);
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
  background: $forest;
  display: flex;
  align-items: center;
  box-shadow: $shadow-forest;
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
    border-color: $forest;
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

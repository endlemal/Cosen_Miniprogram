<template>
  <view class="page">
    <NavBar title="订单详情" />
    <view v-if="order" class="wrap">
      <!-- 取餐号卡 -->
      <view class="code-card">
        <view class="orb o1" />
        <view class="orb o2" />
        <text class="cc-l">{{ order.mode === 'pickup' ? '取餐号' : '外送单号' }}</text>
        <text class="cc-code">{{ order.code }}</text>
        <text class="cc-stage">{{ stage.label }}</text>
        <text class="cc-hint">{{ stage.hint }}</text>
        <view class="steps">
          <view v-for="(s, i) in stage.steps" :key="s" class="step" :class="{ done: i <= stage.step }">
            <view class="dot">
              <Icon v-if="i < stage.step" name="check" :size="20" color="#462719" :stroke="3.2" />
              <view v-else-if="i === stage.step" class="dot-in" />
            </view>
            <text class="step-t">{{ s }}</text>
            <view v-if="i < stage.steps.length - 1" class="bar" :class="{ done: i < stage.step }" />
          </view>
        </view>
      </view>

      <view class="box where">
        <view class="w-head">
          <Icon :name="order.mode === 'pickup' ? 'store' : 'scooter'" :size="32" color="#663A24" />
          <text class="w-t">{{ order.mode === 'pickup' ? order.store : '外卖配送' }}</text>
        </view>
        <text class="w-s">{{ order.mode === 'pickup' ? STORE.address : '淮海中路 300 号 香港新世界大厦 18F 前台' }}</text>
      </view>

      <view class="box">
        <view v-for="it in order.items" :key="it.key" class="item">
          <view class="thumb" :style="{ background: 'linear-gradient(160deg,' + it.tile[0] + ',' + it.tile[1] + ')' }">
            <DrinkArt :spec="it.art" :size="62" />
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
          <text class="k">{{ order.pay === 'balance' ? '余额支付' : '微信支付' }}</text>
          <text class="v big">¥{{ money(order.total) }}</text>
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
        <view class="btn" hover-class="tap-on" @tap="again">
          <text class="btn-t">再来一单</text>
        </view>
      </view>
      <view class="tail" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import Icon from '@/components/Icon.vue'
import DrinkArt from '@/components/DrinkArt.vue'
import { STORE } from '@/mock/products'
import { state, orderStage, reorder, backToTab } from '@/store'
import { hm, money, ymd } from '@/utils/format'

const id = ref('')
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

onLoad((q: any) => {
  id.value = q?.id || ''
  if (q?.fresh) uni.showToast({ title: '支付成功', icon: 'success' })
  timer = setInterval(() => (now.value = Date.now()), 1000)
})
onUnload(() => timer && clearInterval(timer))

const order = computed(() => state.orders.find((o) => o.id === id.value))
const stage = computed(() =>
  order.value ? orderStage(order.value, now.value) : { step: 0, steps: [], label: '', hint: '' }
)

function call() {
  uni.makePhoneCall({ phoneNumber: STORE.phone.replace(/-/g, ''), fail: () => {} })
}
function again() {
  if (!order.value) return
  reorder(order.value)
  uni.showToast({ title: '已加入购物车', icon: 'none' })
  setTimeout(() => backToTab('menu'), 500)
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
</style>

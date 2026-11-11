<template>
  <view class="page">
    <NavBar :title="fromCart ? '储值结算' : '会员储值'" />
    <view class="wrap">
      <view class="now">
        <view class="now-l">
          <text class="now-k">当前余额</text>
          <view class="now-v">
            <text class="now-c">¥</text>
            <text class="now-n">{{ money2(state.balance) }}</text>
          </view>
        </view>
        <view class="level">
          <Icon name="crown" :size="22" color="#462719" :stroke="2.2" />
          <text class="level-t">{{ memberLevel.name }}</text>
        </view>
      </view>

      <view v-if="!fromCart" class="head">
        <text class="head-t">选择储值金额</text>
        <text class="head-s">赠送金额和本金同时到账</text>
      </view>

      <view v-if="!fromCart" class="tiers">
        <view
          v-for="(t, i) in RECHARGE_TIERS"
          :key="t.amount"
          class="tier"
          :class="{ on: pick === i }"
          @tap="pick = i"
        >
          <view class="pic" :class="'p' + i">
            <view class="pic-orb a" />
            <view class="pic-orb b" />
            <view class="amt">
              <text class="amt-n">{{ t.amount }}</text>
              <text class="amt-u">元</text>
            </view>
            <Notch bg="#FFF9F0" :r="28" pad="8rpx 22rpx 14rpx 26rpx">
              <view class="bonus">
                <text class="bonus-k">送</text>
                <text class="bonus-n">{{ t.bonus }}</text>
              </view>
            </Notch>
            <view class="band">
              <text class="band-t">到账 {{ t.amount + t.bonus }} 元</text>
            </view>
          </view>
          <view class="t-foot">
            <text class="t-name">{{ t.name }}</text>
            <view class="t-check" :class="{ on: pick === i }">
              <Icon v-if="pick === i" name="check" :size="22" color="#FFF9F0" :stroke="3.2" />
            </view>
          </view>
          <view class="chips">
            <text class="chip">{{ t.note }}</text>
            <text v-if="t.hot" class="chip strong">更划算</text>
          </view>
        </view>
      </view>

      <view v-else class="records">
        <text class="rules-t">已选储值</text>
        <text v-if="!rechargeCart.length" class="empty-selection">购物车里暂无储值商品</text>
        <view v-for="item in rechargeCart" :key="item.amount" class="rec">
          <view class="rec-l">
            <text class="rec-t">{{ item.name }} ×{{ item.qty }}</text>
            <text class="rec-s">每份充 {{ item.amount }} 元，赠 {{ item.bonus }} 元</text>
          </view>
          <text class="rec-v">¥{{ item.amount * item.qty }}</text>
        </view>
      </view>

      <view class="rules">
        <text class="rules-t">储值说明</text>
        <text class="rule">赠送金额与本金一起到账，可用于点单时的余额支付。</text>
        <text class="rule">储值余额长期有效，不可提现，不可转赠。</text>
        <text class="rule">累计储值满 2000 元升级为 深焙会员。</text>
        <text class="rule">当前为演示环境，支付为模拟流程，不会产生真实扣款。</text>
      </view>

      <view v-if="state.recharges.length" class="records">
        <text class="rules-t">储值记录</text>
        <view v-for="r in state.recharges" :key="r.id" class="rec">
          <view class="rec-l">
            <text class="rec-t">储值 {{ r.amount }} 元，赠送 {{ r.bonus }} 元</text>
            <text class="rec-s">{{ ymd(r.at) }} {{ hm(r.at) }}</text>
          </view>
          <text class="rec-v">+{{ r.amount + r.bonus }}</text>
        </view>
      </view>
      <view class="tail" />
    </view>

    <view v-if="payment.amount" class="paybar">
      <view class="pb-l">
        <view class="pb-total">
          <text class="pb-k">实付</text>
          <text class="pb-c">¥</text>
          <text class="pb-n">{{ payment.amount }}</text>
        </view>
        <text class="pb-s">到账 {{ payment.amount + payment.bonus }} 元</text>
      </view>
      <view class="pb-btn" :class="{ busy }" hover-class="tap-on" @tap="submit">
        <text class="pb-btn-t">{{ busy ? '支付中…' : fromCart ? '模拟微信支付' : '立即充值' }}</text>
      </view>
    </view>

    <!-- 成功 -->
    <view v-if="done" class="done" :class="{ on: doneOn }">
      <view class="done-card">
        <view class="done-ic">
          <Icon name="check" :size="64" color="#462719" :stroke="3" />
        </view>
        <text class="done-t">充值成功</text>
        <view class="done-v">
          <text class="done-c">+¥</text>
          <text class="done-n">{{ done.amount + done.bonus }}</text>
        </view>
        <text class="done-s">含赠送 {{ done.bonus }} 元，当前余额 ¥{{ money2(state.balance) }}</text>
        <view class="done-btns">
          <view class="d-btn ghost" hover-class="tap-on" @tap="closeDone">
            <text class="d-btn-t ink">完成</text>
          </view>
          <view class="d-btn" hover-class="tap-on" @tap="toMenu">
            <text class="d-btn-t">去点单</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import Icon from '@/components/Icon.vue'
import Notch from '@/components/Notch.vue'
import { RECHARGE_TIERS } from '@/mock/seed'
import { state, memberLevel, recharge, backToTab, rechargeCart, rechargeCartTotal, changeRechargeQty } from '@/store'
import { hm, money2, ymd } from '@/utils/format'

const pick = ref(1)
const fromCart = ref(false)
onLoad((q: any) => {
  fromCart.value = q?.cart === '1'
  const i = Number(q?.tier)
  if (i === 0 || i === 1) pick.value = i
})
const payment = computed(() => fromCart.value
  ? { amount: rechargeCartTotal.value, bonus: rechargeCart.value.reduce((sum, item) => sum + item.bonus * item.qty, 0) }
  : RECHARGE_TIERS[pick.value]
)

const busy = ref(false)
const done = ref<{ amount: number; bonus: number } | null>(null)
const doneOn = ref(false)
let paymentTimer: ReturnType<typeof setTimeout> | undefined

onUnload(() => {
  if (paymentTimer === undefined) return
  clearTimeout(paymentTimer)
  uni.hideLoading()
})

function submit() {
  const { amount, bonus } = payment.value
  if (busy.value || done.value || !amount) return
  const paidItems = fromCart.value ? rechargeCart.value : []
  busy.value = true
  uni.showLoading({ title: '正在调起支付', mask: true })
  paymentTimer = setTimeout(() => {
    paymentTimer = undefined
    recharge(amount, bonus)
    paidItems.forEach((item) => changeRechargeQty(item.amount, -item.qty))
    uni.hideLoading()
    busy.value = false
    done.value = { amount, bonus }
    setTimeout(() => (doneOn.value = true), 30)
  }, 1200)
}

function closeDone() {
  doneOn.value = false
  setTimeout(() => {
    done.value = null
    const pages = getCurrentPages()
    if (pages.length > 1) uni.navigateBack()
  }, 220)
}
function toMenu() {
  backToTab('menu')
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
.now {
  padding: 30rpx 34rpx;
  border-radius: 40rpx;
  background: $espresso;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: $shadow-coffee;
}
.now-l {
  display: flex;
  flex-direction: column;
}
.now-k {
  font-size: 23rpx;
  color: $cream;
}
.now-v {
  display: flex;
  align-items: baseline;
  color: $paper;
}
.now-c {
  font-size: 28rpx;
  font-weight: 700;
  margin-right: 4rpx;
}
.now-n {
  font-size: 56rpx;
  font-weight: 800;
  @include num;
}
.level {
  height: 48rpx;
  padding: 0 18rpx 0 14rpx;
  border-radius: 16rpx;
  background: $caramel;
  display: flex;
  align-items: center;
}
.level-t {
  margin-left: 6rpx;
  font-size: 22rpx;
  font-weight: 700;
  color: $roast;
}
.head {
  padding: 48rpx 8rpx 20rpx;
  display: flex;
  align-items: baseline;
}
.head-t {
  font-size: 36rpx;
  font-weight: 800;
}
.head-s {
  margin-left: 14rpx;
  font-size: 23rpx;
  color: $ink-3;
}
.tiers {
  display: flex;
  justify-content: space-between;
}
.tier {
  width: 338rpx;
  padding: 12rpx 12rpx 22rpx;
  border-radius: 44rpx;
  background: $paper;
  box-shadow: $shadow-soft;
  border: 4rpx solid transparent;
  transition: border-color 0.2s ease;
  &.on {
    border-color: $espresso;
  }
}
.pic {
  position: relative;
  height: 300rpx;
  border-radius: 34rpx;
  overflow: hidden;
  &.p0 {
    background: linear-gradient(160deg, #c9d6b4 0%, #9db27f 100%);
  }
  &.p1 {
    background: linear-gradient(160deg, #905D3B 0%, #462719 100%);
  }
}
.pic-orb {
  position: absolute;
  border-radius: 50%;
  &.a {
    width: 200rpx;
    height: 200rpx;
    left: -60rpx;
    bottom: 10rpx;
    background: rgba(255, 255, 255, 0.16);
  }
  &.b {
    width: 110rpx;
    height: 110rpx;
    left: 80rpx;
    bottom: 120rpx;
    background: rgba(0, 0, 0, 0.1);
  }
}
.amt {
  position: absolute;
  left: 28rpx;
  bottom: 84rpx;
  display: flex;
  align-items: baseline;
}
.amt-n {
  font-size: 84rpx;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -3rpx;
  color: $roast;
  @include num;
}
.amt-u {
  margin-left: 6rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: $roast;
}
.p1 .amt-n,
.p1 .amt-u {
  color: $paper;
}
.bonus {
  display: flex;
  align-items: baseline;
  color: $toffee;
}
.bonus-k {
  font-size: 22rpx;
  font-weight: 700;
  margin-right: 2rpx;
}
.bonus-n {
  font-size: 40rpx;
  font-weight: 800;
  @include num;
}
.band {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 60rpx;
  background: $toffee;
  display: flex;
  align-items: center;
  justify-content: center;
}
.p1 .band {
  background: $caramel;
}
.band-t {
  font-size: 22rpx;
  font-weight: 600;
  color: $paper;
}
.p1 .band-t {
  color: $roast;
}
.t-foot {
  margin-top: 18rpx;
  padding: 0 10rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.t-name {
  font-size: 30rpx;
  font-weight: 700;
}
.t-check {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 3rpx solid rgba($ink, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  &.on {
    background: $espresso;
    border-color: $espresso;
  }
}
.chips {
  margin-top: 12rpx;
  padding: 0 4rpx;
  display: flex;
  flex-wrap: wrap;
}
.chip {
  margin: 0 6rpx 6rpx;
  padding: 6rpx 18rpx;
  border-radius: 999rpx;
  background: $latte;
  font-size: 21rpx;
  color: $ink-2;
  &.strong {
    background: $caramel;
    color: $roast;
    font-weight: 700;
  }
}
.rules,
.records {
  margin-top: 26rpx;
  padding: 30rpx 32rpx;
  border-radius: 40rpx;
  background: $paper;
  display: flex;
  flex-direction: column;
}
.rules-t {
  font-size: 28rpx;
  font-weight: 700;
  margin-bottom: 10rpx;
}
.empty-selection {
  font-size: 24rpx;
  color: $ink-2;
}
.rule {
  position: relative;
  padding-left: 24rpx;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: $ink-2;
}
.rule::before {
  content: '';
  position: absolute;
  left: 0;
  top: 16rpx;
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: $caramel;
}
.rec {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx 0;
  border-bottom: 1rpx solid $line;
}
.rec-l {
  display: flex;
  flex-direction: column;
}
.rec-t {
  font-size: 26rpx;
  font-weight: 600;
}
.rec-s {
  font-size: 22rpx;
  color: $ink-3;
  @include num;
}
.rec-v {
  font-size: 32rpx;
  font-weight: 800;
  color: $toffee;
  @include num;
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
.pb-k {
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
.pb-s {
  font-size: 22rpx;
  color: $toffee;
  font-weight: 600;
}
.pb-btn {
  height: 96rpx;
  padding: 0 60rpx;
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

/* 成功弹层 */
.done {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 300;
  background: rgba(22, 33, 25, 0);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.25s ease;
  &.on {
    background: rgba(22, 33, 25, 0.5);
  }
}
.done-card {
  width: 600rpx;
  padding: 56rpx 40rpx 40rpx;
  border-radius: 56rpx;
  background: $paper;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: scale(0.9);
  opacity: 0;
  transition: transform 0.28s cubic-bezier(0.22, 0.8, 0.26, 1), opacity 0.2s ease;
}
.done.on .done-card {
  transform: scale(1);
  opacity: 1;
}
.done-ic {
  width: 120rpx;
  height: 120rpx;
  border-radius: 44rpx;
  background: $caramel;
  display: flex;
  align-items: center;
  justify-content: center;
}
.done-t {
  margin-top: 26rpx;
  font-size: 34rpx;
  font-weight: 800;
}
.done-v {
  margin-top: 6rpx;
  display: flex;
  align-items: baseline;
  color: $toffee;
}
.done-c {
  font-size: 32rpx;
  font-weight: 800;
}
.done-n {
  font-size: 84rpx;
  font-weight: 800;
  @include num;
}
.done-s {
  font-size: 24rpx;
  color: $ink-2;
}
.done-btns {
  margin-top: 40rpx;
  width: 100%;
  display: flex;
}
.d-btn {
  flex: 1;
  height: 92rpx;
  border-radius: 30rpx;
  background: $espresso;
  display: flex;
  align-items: center;
  justify-content: center;
  &.ghost {
    margin-right: 18rpx;
    background: $latte;
  }
}
.d-btn-t {
  font-size: 28rpx;
  font-weight: 700;
  color: $paper;
  &.ink {
    color: $espresso;
  }
}
</style>

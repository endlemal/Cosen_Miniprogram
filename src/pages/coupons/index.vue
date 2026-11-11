<template>
  <view class="page">
    <NavBar title="礼品券" />
    <view class="wrap">
      <!-- 商家礼赠说明 -->
      <view class="intro">
        <view class="orb o1" />
        <view class="orb o2" />
        <view class="intro-ic">
          <Icon name="gift" :size="40" color="#462719" :stroke="2.1" />
        </view>
        <text class="intro-t">{{ newCount ? '有 ' + newCount + ' 张新券到账' : '门店送你的券都在这里' }}</text>
        <text class="intro-s">礼品券由店长和店员发放：下雨天、生日月、新品上市时多留意。</text>
      </view>

      <!-- 兑换码 -->
      <view class="redeem">
        <input
          v-model="code"
          class="r-input"
          placeholder="输入门店给你的兑换码"
          placeholder-class="ph"
          maxlength="16"
          confirm-type="done"
          @confirm="onRedeem"
        />
        <view class="r-btn" hover-class="tap-on" @tap="onRedeem">
          <text class="r-btn-t">兑换</text>
        </view>
      </view>
      <text class="r-hint">演示兑换码：MOSS2026、MATCHA88</text>

      <!-- tabs -->
      <view class="tabs">
        <view v-for="t in TABS" :key="t.key" class="tab" :class="{ on: tab === t.key }" @tap="tab = t.key">
          <text class="tab-t">{{ t.label }}</text>
          <text class="tab-n">{{ counts[t.key] }}</text>
        </view>
        <view class="tab-ind" :style="{ left: indLeft }" />
      </view>

      <view class="list">
        <CouponCard
          v-for="c in list"
          :key="c.id"
          :coupon="c"
          :mode="couponState(c)"
          @use="useIt"
        />
        <view v-if="!list.length" class="empty">
          <text class="empty-t">{{ emptyText }}</text>
        </view>
      </view>
      <view class="tail" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onUnload } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import Icon from '@/components/Icon.vue'
import CouponCard from '@/components/CouponCard.vue'
import { state, couponState, redeemCode, markCouponsSeen, backToTab, type CouponState } from '@/store'

const TABS: { key: CouponState; label: string }[] = [
  { key: 'available', label: '可使用' },
  { key: 'used', label: '已使用' },
  { key: 'expired', label: '已过期' }
]
const tab = ref<CouponState>('available')
const code = ref('')

const list = computed(() =>
  state.coupons
    .filter((c) => couponState(c) === tab.value)
    .sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew) || a.endAt - b.endAt)
)
const counts = computed(() => {
  const r: Record<string, number> = { available: 0, used: 0, expired: 0 }
  state.coupons.forEach((c) => r[couponState(c)]++)
  return r
})
const newCount = computed(() => state.coupons.filter((c) => c.isNew && couponState(c) === 'available').length)
const indLeft = computed(() => ['8rpx', 'calc(33.333% + 2.67rpx)', 'calc(66.666% - 2.67rpx)'][TABS.findIndex((t) => t.key === tab.value)])
const emptyText = computed(
  () => ({ available: '暂时没有可用的券，下雨天记得来店里', used: '还没有用过礼品券', expired: '没有过期的券' })[tab.value]
)

function onRedeem() {
  const r = redeemCode(code.value)
  uni.showToast({ title: r.msg, icon: r.ok ? 'success' : 'none' })
  if (r.ok) {
    code.value = ''
    tab.value = 'available'
  }
}

function useIt() {
  backToTab('menu')
}

onUnload(() => markCouponsSeen())
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: $canvas;
}
.wrap {
  padding: 12rpx 28rpx 0;
}
.intro {
  position: relative;
  padding: 36rpx 36rpx 34rpx;
  border-radius: 48rpx;
  background: $caramel;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.orb {
  position: absolute;
  border-radius: 50%;
}
.o1 {
  width: 240rpx;
  height: 240rpx;
  right: -70rpx;
  top: -90rpx;
  background: rgba(255, 255, 255, 0.25);
}
.o2 {
  width: 120rpx;
  height: 120rpx;
  right: 60rpx;
  top: 30rpx;
  background: rgba(59, 90, 64, 0.22);
}
.intro-ic {
  width: 76rpx;
  height: 76rpx;
  border-radius: 26rpx;
  background: rgba($paper, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}
.intro-t {
  position: relative;
  margin-top: 22rpx;
  font-size: 36rpx;
  font-weight: 800;
  color: $roast;
}
.intro-s {
  position: relative;
  margin-top: 6rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: rgba($roast, 0.8);
}
.redeem {
  margin-top: 22rpx;
  height: 100rpx;
  padding: 0 10rpx 0 30rpx;
  border-radius: 34rpx;
  background: $paper;
  display: flex;
  align-items: center;
  box-shadow: $shadow-soft;
}
.r-input {
  flex: 1;
  font-size: 27rpx;
  letter-spacing: 1rpx;
}
.ph {
  color: $ink-3;
  letter-spacing: 0;
}
.r-btn {
  height: 78rpx;
  padding: 0 40rpx;
  border-radius: 26rpx;
  background: $espresso;
  display: flex;
  align-items: center;
}
.r-btn-t {
  font-size: 27rpx;
  font-weight: 700;
  color: $paper;
}
.r-hint {
  display: block;
  margin: 12rpx 0 0 20rpx;
  font-size: 21rpx;
  color: $ink-3;
}
.tabs {
  position: relative;
  margin-top: 34rpx;
  height: 88rpx;
  padding: 8rpx;
  border-radius: 30rpx;
  background: $latte;
  display: flex;
}
.tab {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tab-t {
  font-size: 26rpx;
  font-weight: 700;
  color: $ink-2;
  transition: color 0.2s ease;
}
.tab-n {
  margin-left: 8rpx;
  font-size: 22rpx;
  color: $ink-3;
  @include num;
}
.tab.on .tab-t {
  color: $paper;
}
.tab.on .tab-n {
  color: $cream;
}
.tab-ind {
  position: absolute;
  top: 8rpx;
  bottom: 8rpx;
  width: calc(33.333% - 5.33rpx);
  border-radius: 24rpx;
  background: $espresso;
  transition: left 0.25s cubic-bezier(0.22, 0.8, 0.26, 1);
}
.list {
  margin-top: 26rpx;
}
.empty {
  padding: 80rpx 0;
  text-align: center;
}
.empty-t {
  font-size: 25rpx;
  color: $ink-3;
}
.tail {
  height: calc(env(safe-area-inset-bottom) + 60rpx);
}
</style>

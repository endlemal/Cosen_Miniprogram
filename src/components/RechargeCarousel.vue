<template>
  <view v-if="slides.length" class="tiers">
    <!--
      swiper 会裁掉自身范围外的内容，所以它必须铺满屏宽：
      左侧缩进改用 previous-margin，划走的卡片一直滑到屏幕边缘才消失。
    -->
    <swiper
      class="carousel"
      :circular="multi"
      previous-margin="50rpx"
      :next-margin="multi ? '84rpx' : '34rpx'"
      @change="onChange"
    >
      <swiper-item v-for="(tier, index) in slides" :key="index">
        <view class="tier-card" :class="{ reserve: tier.hot, on: current === index }">
          <!-- 俯视的一杯咖啡：深焙是带油脂圈的浓缩，醇香是拿铁拉花；切到这张卡时杯子转回正位 -->
          <view class="motif" aria-hidden="true">
            <view class="saucer">
              <view class="cup">
                <view class="handle" />
                <view class="coffee">
                  <view v-if="!tier.hot" class="art" />
                </view>
              </view>
            </view>
          </view>

          <view class="card-content">
            <view class="brand">
              <text class="brand-name">{{ STORE.name }}</text>
              <text class="wordmark">COSEN</text>
            </view>

            <view class="offer">
              <view class="tier-line">
                <text class="tier-name">{{ tier.name }}</text>
                <text v-if="tier.note" class="tier-note">{{ tier.note }}</text>
              </view>
              <view class="values">
                <text class="value-label">充</text>
                <text class="amount">{{ tier.amount }}</text>
                <!-- 赠送额度做成会员卡上的印章：卡片停稳时盖下去 -->
                <view class="stamp">
                  <text class="stamp-label">送</text>
                  <text class="stamp-value">{{ tier.bonus }}</text>
                </view>
              </view>
            </view>

            <view class="card-foot">
              <view class="credit">
                <text class="credit-label">到账</text>
                <text class="credit-value">¥{{ tier.amount + tier.bonus }}</text>
              </view>
              <button class="add" hover-class="tap-on" @tap="add(tier.amount, tier.tierIndex)">
                <Icon name="plus" :size="26" color="#462719" :stroke="2.5" />
                <text>{{ useMock ? '加入购物车' : '立即储值' }}</text>
              </button>
            </view>
          </view>
        </view>
      </swiper-item>
    </swiper>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { listRechargeTiers, toRechargeTiers } from '@/api/recharge'
import Icon from './Icon.vue'
import { STORE } from '@/mock/products'
import { RECHARGE_TIERS } from '@/mock/seed'
import { changeRechargeQty } from '@/store'
import { useMock } from '@/config/env'

const emit = defineEmits<{ (e: 'layout-change'): void }>()

// 两档各渲染两次，让循环滑动时左右两侧始终有卡片。
const tiers = ref(useMock ? RECHARGE_TIERS.map((tier, tierIndex) => ({ ...tier, tierIndex })) : [])
const slides = computed(() => tiers.value.length === 2 ? [...tiers.value, ...tiers.value] : tiers.value)
const multi = computed(() => slides.value.length > 1)
const current = ref(0)

function onChange(event: { detail: { current: number } }) {
  current.value = event.detail.current
}

onMounted(async () => {
  if (useMock) return
  try {
    tiers.value = toRechargeTiers(await listRechargeTiers())
      .map((tier, tierIndex) => ({ ...tier, tierIndex })).filter(tier => tier.available)
    current.value = 0
    if (tiers.value.length) emit('layout-change')
  } catch {
    tiers.value = []
  }
})

function add(amount: number, tierIndex: number) {
  if (!useMock) {
    // 真实模式没有「储值购物车」：直接带档位去储值页，由后端档位与微信支付结算
    uni.navigateTo({ url: `/pages/recharge/index?tier=${tierIndex}` })
    return
  }
  changeRechargeQty(amount, 1)
  uni.showToast({ title: '储值已加入购物车', icon: 'none', duration: 1000 })
}
</script>

<style lang="scss" scoped>
$ease-settle: cubic-bezier(0.22, 0.9, 0.24, 1);
$ease-stamp: cubic-bezier(0.34, 1.56, 0.64, 1);

.tiers {
  margin: 0 0 8rpx;
}
.carousel {
  height: 392rpx;
}

/* ---------- 卡片 ---------- */
.tier-card {
  position: relative;
  height: calc(100% - 50rpx);
  margin: 24rpx 16rpx 26rpx 0;
  border-radius: 56rpx;
  background:
    radial-gradient(120% 90% at 0% 0%, rgba($paper, 0.1), rgba($paper, 0) 60%),
    linear-gradient(150deg, #8B583D 0%, #744631 55%, #64391F 100%);
  color: $paper;
  box-shadow: 0 12rpx 22rpx -14rpx rgba($roast, 0);
  transform: scale(0.9);
  transition: transform 420ms $ease-settle, box-shadow 420ms $ease-settle;
}
.tier-card.reserve {
  background:
    radial-gradient(120% 90% at 0% 0%, rgba(#F4CA86, 0.1), rgba(#F4CA86, 0) 60%),
    linear-gradient(150deg, #573223 0%, $roast 55%, #2F1A10 100%);
}
.tier-card.on {
  transform: scale(1);
  box-shadow: 0 12rpx 22rpx -14rpx rgba($roast, 0.7);
}

/* ---------- 俯视咖啡杯 ---------- */
.motif {
  position: absolute;
  top: -20rpx;
  right: 4rpx;
  width: 196rpx;
  height: 196rpx;
  pointer-events: none;
  transform: rotate(-48deg) scale(0.9);
  transition: transform 720ms $ease-settle 60ms;
}
.on .motif {
  transform: rotate(0deg) scale(1);
}
.saucer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  border-radius: 50%;
  background: radial-gradient(circle, #F1DDBF 0 58%, #E3C59D 74%, #D8B68A 100%);
  box-shadow: -6rpx 14rpx 24rpx rgba($ink, 0.38);
}
.reserve .saucer {
  background: radial-gradient(circle, #CFA06C 0 58%, #B9864F 76%, #A67444 100%);
}
.cup {
  position: absolute;
  top: 28rpx;
  left: 28rpx;
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: $paper;
  box-shadow: -3rpx 6rpx 10rpx rgba($ink, 0.22), inset 0 0 0 3rpx rgba($ink, 0.05);
}
.handle {
  position: absolute;
  top: 54rpx;
  left: 124rpx;
  width: 40rpx;
  height: 32rpx;
  border-radius: 0 16rpx 16rpx 0;
  background: $paper;
  box-shadow: 2rpx 4rpx 6rpx rgba($ink, 0.18);
}
.coffee {
  position: absolute;
  top: 16rpx;
  left: 16rpx;
  width: 108rpx;
  height: 108rpx;
  border-radius: 50%;
  overflow: hidden;
  /* 拿铁：奶咖底，边缘一圈深色 */
  background: radial-gradient(circle, #C79A6E 0 46%, #A9744D 72%, #7D4B2F 100%);
}
.reserve .coffee {
  /* 深焙浓缩：中心近黑，外圈一层油脂 */
  background: radial-gradient(circle, #24130B 0 40%, #4A2817 62%, #9A6540 84%, #C08A57 92%, #8A5734 100%);
}
/* 拉花的心：转正时心尖朝下，旋转能看得出来 */
.art {
  position: absolute;
  top: 40rpx;
  left: 40rpx;
  width: 28rpx;
  height: 28rpx;
  background: #F6E8D3;
  transform: rotate(45deg);
}
.art::before,
.art::after {
  content: '';
  position: absolute;
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: #F6E8D3;
}
.art::before { left: -14rpx; top: 0; }
.art::after { left: 0; top: -14rpx; }

/* ---------- 内容 ---------- */
.card-content {
  position: relative;
  height: 100%;
  padding: 30rpx 36rpx 28rpx 44rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  opacity: 0.5;
  transition: opacity 420ms $ease-settle;
}
/* 旁边的卡片只压暗文字，卡面保持实色，避免半透明的棕色叠在米色底上发灰 */
.on .card-content {
  opacity: 1;
}
.brand,
.values,
.card-foot,
.credit,
.tier-line {
  display: flex;
  align-items: center;
}
.brand-name {
  font-family: $font-display;
  font-weight: 800;
  font-size: 33rpx;
  line-height: 1;
}
.wordmark {
  margin-left: 12rpx;
  font-family: $font-latin;
  font-size: 18rpx;
  font-weight: 800;
  letter-spacing: 3rpx;
}
.tier-line {
  align-items: baseline;
  gap: 14rpx;
}
.tier-name {
  font-size: 24rpx;
  font-weight: 700;
  letter-spacing: 3rpx;
  color: $cream;
}
.tier-note {
  font-size: 20rpx;
  color: rgba($cream, 0.72);
}
.values {
  gap: 10rpx;
  margin-top: 2rpx;
  white-space: nowrap;
}
.value-label {
  align-self: flex-end;
  margin-bottom: 12rpx;
  font-size: 31rpx;
  font-weight: 700;
}
.amount {
  font-size: 66rpx;
  font-weight: 800;
  line-height: 1.05;
  @include num;
}

/* ---------- 印章 ---------- */
.stamp {
  position: relative;
  flex-shrink: 0;
  width: 100rpx;
  height: 100rpx;
  margin: -2rpx 0 -18rpx 14rpx;
  border-radius: 50%;
  border: 3rpx solid $cream;
  color: $cream;
  background: rgba($cream, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  opacity: 0;
  transform: rotate(-24deg) scale(1.45);
  transition: opacity 200ms ease-out 160ms, transform 460ms $ease-stamp 160ms;
}
.stamp::after {
  content: '';
  position: absolute;
  top: 6rpx;
  right: 6rpx;
  bottom: 6rpx;
  left: 6rpx;
  border-radius: 50%;
  border: 2rpx dashed rgba($cream, 0.6);
}
.reserve .stamp {
  border-color: #F4CA86;
  color: #F4CA86;
  background: rgba(#F4CA86, 0.1);
}
.reserve .stamp::after {
  border-color: rgba(#F4CA86, 0.6);
}
.on .stamp {
  opacity: 1;
  transform: rotate(-10deg) scale(1);
}
.stamp-label {
  font-size: 19rpx;
  font-weight: 700;
  line-height: 1;
}
.stamp-value {
  margin-top: 4rpx;
  font-size: 32rpx;
  font-weight: 800;
  line-height: 1;
  @include num;
}

/* ---------- 底栏 ---------- */
.card-foot {
  justify-content: space-between;
}
.credit {
  align-items: baseline;
  gap: 8rpx;
}
.credit-label {
  font-size: 21rpx;
  color: $cream;
}
.credit-value {
  font-size: 30rpx;
  font-weight: 800;
  @include num;
}
.add {
  display: flex;
  align-items: center;
  gap: 6rpx;
  margin: 0;
  padding: 0 24rpx;
  min-height: 60rpx;
  border-radius: 30rpx;
  background: $paper;
  color: $roast;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.1;
}
.add::after {
  border: none;
}
.reserve .add {
  background: #F4D4A0;
}

@media (prefers-reduced-motion: reduce) {
  .tier-card,
  .card-content,
  .motif,
  .stamp {
    transition: none;
  }
}
</style>

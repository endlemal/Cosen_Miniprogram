<template>
  <view class="tiers">
    <swiper class="carousel" circular next-margin="68rpx">
      <swiper-item v-for="(tier, index) in slides" :key="index">
        <view class="tier-card" :class="{ reserve: tier.hot }">
          <view class="motif" aria-hidden="true">
            <view class="disc disc-back" />
            <view class="disc disc-light" />
            <view class="disc disc-front" />
          </view>
          <view class="card-content">
            <view class="brand">
              <text class="brand-name">{{ STORE.name }}</text>
              <text class="wordmark">COSEN</text>
            </view>
            <view class="offer">
              <text class="tier-name">{{ tier.name }}</text>
              <view class="values">
                <text class="value-label">充</text>
                <text class="amount">{{ tier.amount }}</text>
                <text class="bonus">送 {{ tier.bonus }}</text>
              </view>
              <view class="credit">
                <text class="credit-label">储值到账</text>
                <text class="credit-value">¥{{ tier.amount + tier.bonus }}</text>
              </view>
            </view>
            <view class="card-foot">
              <button class="add" hover-class="tap-on" @tap="add(tier.amount)">
                <Icon name="plus" :size="26" color="#462719" :stroke="2.5" />
                <text>加入购物车</text>
              </button>
            </view>
          </view>
        </view>
      </swiper-item>
    </swiper>
  </view>
</template>

<script setup lang="ts">
import Icon from './Icon.vue'
import { STORE } from '@/mock/products'
import { RECHARGE_TIERS } from '@/mock/seed'
import { changeRechargeQty } from '@/store'

// 两档各渲染两次，让循环滑动时右侧始终有预览。
const slides = [...RECHARGE_TIERS, ...RECHARGE_TIERS]

function add(amount: number) {
  changeRechargeQty(amount, 1)
  uni.showToast({ title: '储值已加入购物车', icon: 'none', duration: 1000 })
}
</script>

<style lang="scss" scoped>
.tiers {
  margin: 0 0 8rpx 50rpx;
}
.carousel {
  height: 376rpx;
}
.tier-card {
  position: relative;
  height: calc(100% - 35rpx);
  margin: 23rpx 18rpx 12rpx 0;
  border-radius: 64rpx;
  background: #784B35;
  color: $paper;
}
.tier-card.reserve {
  background: $roast;
}
.motif {
  position: absolute;
  top: -18rpx;
  right: -10rpx;
  width: 230rpx;
  height: 216rpx;
  pointer-events: none;
}
.disc {
  position: absolute;
  border-radius: 50%;
  box-shadow: -5rpx 10rpx 20rpx rgba($ink, 0.34), inset 0 1rpx 0 rgba($paper, 0.15);
}
.disc-back {
  top: 0;
  right: 0;
  width: 182rpx;
  height: 182rpx;
  background: #A57353;
}
.disc-light {
  top: 64rpx;
  left: 8rpx;
  width: 142rpx;
  height: 142rpx;
  background: $cream;
}
.disc-front {
  top: 53rpx;
  right: 40rpx;
  width: 112rpx;
  height: 112rpx;
  background: $espresso;
}
.reserve .disc-back {
  background: $toffee;
}
.reserve .disc-light {
  background: #D7AC74;
}
.reserve .disc-front {
  background: #543022;
}
.card-content {
  position: relative;
  height: 100%;
  padding: 28rpx 40rpx 27rpx 44rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.brand,
.values,
.card-foot,
.credit {
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
.tier-name {
  display: block;
  font-size: 24rpx;
  font-weight: 700;
  letter-spacing: 3rpx;
  color: $cream;
}
.values {
  align-items: baseline;
  gap: 10rpx;
  margin-top: 4rpx;
  white-space: nowrap;
}
.value-label {
  font-size: 31rpx;
  font-weight: 700;
}
.amount {
  font-size: 62rpx;
  font-weight: 800;
  line-height: 1.05;
  @include num;
}
.bonus {
  margin-left: 4rpx;
  color: $cream;
  font-size: 29rpx;
  font-weight: 800;
}
.reserve .bonus {
  color: #F4CA86;
}
.card-foot {
  justify-content: flex-end;
}
.credit {
  gap: 8rpx;
  margin-top: 6rpx;
}
.credit-label {
  font-size: 21rpx;
  color: $cream;
}
.credit-value {
  font-size: 25rpx;
  font-weight: 800;
  @include num;
}
.add {
  display: flex;
  align-items: center;
  gap: 6rpx;
  margin: 0;
  padding: 0 22rpx;
  min-height: 58rpx;
  border-radius: 29rpx;
  background: $paper;
  color: $roast;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.1;
}
.reserve .add {
  background: #F4D4A0;
}
</style>

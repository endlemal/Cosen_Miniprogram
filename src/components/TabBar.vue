<!-- 悬浮底栏：图标、标签和当前页面指示 -->
<template>
  <view class="tabbar" :class="{ 'menu-dock': state.ui.tab === 'menu' }">
    <view
      v-for="t in tabs"
      :key="t.key"
      class="item"
      :class="{ on: state.ui.tab === t.key }"
      hover-class="tap-on"
      @tap="go(t.key)"
    >
      <view class="ic">
        <Icon :name="t.icon" :size="44" :color="state.ui.tab === t.key ? '#462719' : '#EDD3AE'" :stroke="2.1" />
        <view v-if="t.key === 'menu' && cartCount > 0 && state.ui.tab !== 'menu'" class="badge" :class="{ bump: bump }">
          <text class="bt">{{ cartCount > 99 ? '99+' : cartCount }}</text>
        </view>
      </view>
      <text class="label">{{ t.label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Icon from './Icon.vue'
import { state, cartCount, switchTab } from '@/store'
import type { TabKey } from '@/types'

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'square', label: '广场', icon: 'square' },
  { key: 'menu', label: '点单', icon: 'bag' },
  { key: 'mine', label: '我的', icon: 'user' }
]

function go(k: TabKey) {
  if (state.ui.tab === k) return
  switchTab(k)
  // #ifdef MP-WEIXIN
  uni.vibrateShort({ type: 'light' } as any)
  // #endif
}

const bump = ref(false)
watch(
  () => state.ui.cartPulse,
  () => {
    bump.value = false
    setTimeout(() => (bump.value = true), 16)
    setTimeout(() => (bump.value = false), 420)
  }
)
</script>

<style lang="scss" scoped>
.tabbar {
  position: fixed;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom) + 28rpx);
  width: 560rpx;
  height: 116rpx;
  margin-left: -280rpx;
  padding: 0 18rpx;
  border-radius: 44rpx;
  background: $espresso;
  box-shadow: 0 30rpx 50rpx -24rpx rgba($roast, 0.7), 0 2rpx 0 rgba(255, 255, 255, 0.06) inset;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 100;
}
.tabbar.menu-dock {
  left: calc(50% + 36rpx);
}
.item {
  height: 84rpx;
  flex: 1;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: $cream;
  transition: background 0.25s ease;
  &.on {
    background: $caramel;
    color: $roast;
  }
}
.ic {
  position: relative;
}
.label {
  margin-top: 1rpx;
  font-size: 20rpx;
  line-height: 1.2;
  font-weight: 700;
}
.badge {
  position: absolute;
  top: -14rpx;
  right: -20rpx;
  min-width: 34rpx;
  height: 34rpx;
  padding: 0 8rpx;
  border-radius: 17rpx;
  background: $paper;
  border: 3rpx solid $espresso;
  display: flex;
  align-items: center;
  justify-content: center;
  &.bump {
    animation: bump 0.4s ease;
  }
}
.bt {
  font-size: 19rpx;
  font-weight: 800;
  color: $roast;
  @include num;
}
@keyframes bump {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.35);
  }
  100% {
    transform: scale(1);
  }
}
</style>

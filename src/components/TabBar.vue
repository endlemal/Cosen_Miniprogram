<!-- 悬浮胶囊底栏（参考稿 1）：选中项展开成浅绿胶囊并显示文字 -->
<template>
  <view class="tabbar">
    <view
      v-for="t in tabs"
      :key="t.key"
      class="item"
      :class="{ on: state.ui.tab === t.key }"
      hover-class="tap-on"
      @tap="go(t.key)"
    >
      <view class="ic">
        <Icon :name="t.icon" :size="44" :color="state.ui.tab === t.key ? '#2C4431' : '#C5D2B0'" :stroke="2.1" />
        <view v-if="t.key === 'menu' && cartCount > 0 && state.ui.tab !== 'menu'" class="badge" :class="{ bump: bump }">
          <text class="bt">{{ cartCount > 99 ? '99+' : cartCount }}</text>
        </view>
      </view>
      <text v-if="state.ui.tab === t.key" class="label">{{ t.label }}</text>
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
  background: $forest;
  box-shadow: 0 30rpx 50rpx -24rpx rgba(31, 52, 36, 0.7), 0 2rpx 0 rgba(255, 255, 255, 0.06) inset;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 100;
}
.item {
  height: 84rpx;
  min-width: 120rpx;
  padding: 0 24rpx;
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.25s ease, padding 0.25s ease;
  &.on {
    background: $sage;
    padding: 0 30rpx 0 26rpx;
  }
}
.ic {
  position: relative;
}
.label {
  margin-left: 12rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: $pine;
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
  border: 3rpx solid $forest;
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
  color: $pine;
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

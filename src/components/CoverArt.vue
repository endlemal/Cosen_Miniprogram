<!-- 动态封面：渐变 + 参考稿 1 的叠圆装饰 / 饮品插画 / 大字排版 -->
<template>
  <view class="cover" :style="{ height: h + 'rpx', background: bg, borderRadius: radius + 'rpx' }">
    <template v-if="cover.style === 'drink'">
      <view class="halo" :style="halo" />
      <view class="floor" />
      <view class="art-wrap" :style="{ bottom: width * 0.06 + 'rpx' }">
        <DrinkArt v-if="cover.art" :spec="cover.art" :size="artSize" />
      </view>
    </template>
    <template v-else>
      <view class="orb" :style="orb(0.66, -0.2, -0.2, 'rgba(255,255,255,0.14)')" />
      <view class="orb" :style="orb(0.46, 0.1, 0.14, 'rgba(255,255,255,0.24)')" />
      <view class="orb dark" :style="orb(0.3, 0.02, 0.02, 'rgba(0,0,0,0.13)')" />
    </template>
    <view v-if="cover.text" class="words" :style="{ padding: '0 ' + width * 0.07 + 'rpx ' + width * 0.07 + 'rpx' }">
      <text class="big" :style="{ fontSize: big + 'rpx', color: ink }">{{ cover.text }}</text>
      <text v-if="cover.sub" class="sub" :style="{ fontSize: (width > 500 ? 28 : 21) + 'rpx', color: ink }">{{ cover.sub }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CoverSpec } from '@/types'
import DrinkArt from './DrinkArt.vue'

const props = withDefaults(defineProps<{ cover: CoverSpec; width: number; radius?: number; fixedHeight?: number }>(), {
  radius: 24,
  fixedHeight: 0
})

const h = computed(() => props.fixedHeight || Math.round(props.width / props.cover.ratio))
const bg = computed(() => `linear-gradient(160deg, ${props.cover.bg[0]} 0%, ${props.cover.bg[1]} 100%)`)
const ink = computed(() => (props.cover.light ? '#FFF9F0' : '#462719'))
const artSize = computed(() => Math.min(props.width * 0.56, (h.value * 0.82) / 1.3))
const halo = computed(() => {
  const s = props.width * 0.78
  return {
    width: s + 'rpx',
    height: s + 'rpx',
    left: (props.width - s) / 2 + 'rpx',
    bottom: h.value * 0.14 + 'rpx'
  }
})
const big = computed(() => {
  const t = props.cover.text || ''
  const latin = /^[\x00-\x7F]+$/.test(t)
  const per = latin ? 0.6 : 1
  return Math.round(Math.min(props.width * 0.34, (props.width * 0.8) / Math.max(1, t.length * per)))
})

function orb(size: number, top: number, right: number, color: string) {
  const w = props.width
  return {
    width: w * size + 'rpx',
    height: w * size + 'rpx',
    top: w * top + 'rpx',
    right: w * right + 'rpx',
    background: color
  }
}
</script>

<style lang="scss" scoped>
.cover {
  position: relative;
  overflow: hidden;
  width: 100%;
}
.orb {
  position: absolute;
  border-radius: 50%;
}
.orb.dark {
  box-shadow: 0 12rpx 24rpx rgba(0, 0, 0, 0.12);
}
.halo {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
}
.floor {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 22%;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.08));
}
.art-wrap {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
}
.words {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
}
.big {
  font-family: $font-latin;
  font-weight: 800;
  line-height: 1.02;
  letter-spacing: -2rpx;
}
.sub {
  margin-top: 8rpx;
  opacity: 0.86;
  font-weight: 500;
}
</style>

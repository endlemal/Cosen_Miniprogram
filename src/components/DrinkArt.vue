<!--
  用纯 CSS 画的饮品插画，替代商品图。
  设计画板固定为 200×260rpx，通过 scale 缩放到任意尺寸。
  cup: tall（带盖塑料杯）/ pint（高玻璃杯）/ rocks（切面玻璃杯）/ mug（热饮陶瓷杯）
-->
<template>
  <view class="drink-art" :style="{ width: size + 'rpx', height: size * 1.3 + 'rpx' }">
    <view class="drink-stage" :style="{ transform: 'scale(' + size / 200 + ')' }">
      <!-- 投影 -->
      <view v-if="spec.cup === 'rocks'" class="cast" />
      <view v-else class="pool" :class="{ wide: spec.cup === 'mug' }" />

      <!-- ========== 高杯 ========== -->
      <template v-if="spec.cup === 'tall' || spec.cup === 'pint'">
        <view v-if="spec.straw && !hasDome" class="straw" :style="{ background: spec.straw }" />
        <view class="tall-cup" :class="{ pint: spec.cup === 'pint' }" :style="{ background: bodyBg }">
          <view v-if="spec.marble" class="marble" />
          <template v-if="spec.ice">
            <view class="ice i1" />
            <view class="ice i2" />
            <view class="ice i3" />
          </template>
          <view class="gloss" />
          <view class="gloss2" />
        </view>
        <view v-if="spec.cup === 'tall'" class="lid" />
        <view v-else class="pint-rim" />
        <template v-if="hasDome">
          <view class="peak" :style="{ background: creamBg }" />
          <view class="dome" :style="{ background: creamBg }">
            <view v-if="spec.drizzle" class="drizzle" :style="drizzleStyle" />
            <view v-if="spec.dust" class="dust" :style="dustStyle" />
          </view>
        </template>
      </template>

      <!-- ========== 切面玻璃杯 ========== -->
      <template v-else-if="spec.cup === 'rocks'">
        <template v-if="spec.ice">
          <view class="cube c1" />
          <view class="cube c2" />
        </template>
        <view class="rocks" :style="{ background: bodyBg }">
          <view class="rim" />
          <view class="arches">
            <view class="arch" />
            <view class="arch" />
            <view class="arch" />
            <view class="arch" />
          </view>
          <view class="base" />
          <view class="gloss" />
        </view>
      </template>

      <!-- ========== 热饮马克杯 ========== -->
      <template v-else>
        <view class="steam s1" :class="{ live: animated }" />
        <view class="steam s2" :class="{ live: animated }" />
        <view class="steam s3" :class="{ live: animated }" />
        <view class="saucer" :style="{ background: mugColor }">
          <view class="saucer-in" />
        </view>
        <view class="handle" :style="{ borderColor: mugColor }" />
        <view class="mug" :style="{ background: mugShade + ', ' + mugColor }" />
        <view class="surface" :style="{ background: surfaceBg, borderColor: mugColor }" />
        <view v-if="spec.milk" class="ring" :style="{ borderColor: spec.milk }" />
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DrinkArtSpec } from '@/types'

const props = withDefaults(defineProps<{ spec: DrinkArtSpec; size?: number; animated?: boolean }>(), {
  size: 200,
  animated: false
})

const hasDome = computed(() => props.spec.topping === 'cream')

const bodyBg = computed(() => {
  const { liquid, milk, cup } = props.spec
  const [l0, l1] = liquid
  if (milk) {
    const r = props.spec.milkRatio ?? 20
    return `linear-gradient(180deg, ${milk} 0%, ${milk} ${r}%, ${l0} ${r + 18}%, ${l1} 100%)`
  }
  if (cup === 'rocks') return `linear-gradient(180deg, ${l0} 0%, ${l0} 42%, ${l1} 62%, ${l1} 100%)`
  return `linear-gradient(180deg, ${l0}, ${l1})`
})

const creamBg = computed(
  () => `radial-gradient(circle at 34% 28%, #FFFFFF 0%, ${props.spec.toppingColor || '#F6F4EC'} 58%, ${props.spec.toppingColor || '#F6F4EC'} 100%)`
)
const dustStyle = computed(() => {
  const d = props.spec.dust
  return {
    backgroundImage: `radial-gradient(${d} 30%, transparent 36%), radial-gradient(${d} 22%, transparent 28%), radial-gradient(${d} 26%, transparent 32%)`,
    backgroundSize: '19rpx 15rpx, 13rpx 17rpx, 23rpx 11rpx',
    backgroundPosition: '0 0, 7rpx 5rpx, 3rpx 9rpx'
  }
})
const drizzleStyle = computed(() => ({
  background: `repeating-linear-gradient(158deg, transparent 0, transparent 15rpx, ${props.spec.drizzle} 15rpx, ${props.spec.drizzle} 20rpx)`
}))

const mugColor = computed(() => props.spec.mug || '#F3F1EA')
const mugShade =
  'linear-gradient(90deg, rgba(0,0,0,0.10) 0%, rgba(255,255,255,0.22) 26%, rgba(255,255,255,0) 52%, rgba(0,0,0,0.16) 100%)'
const surfaceBg = computed(() => {
  const [l0, l1] = props.spec.liquid
  const m = props.spec.milk
  if (m) return `radial-gradient(ellipse at 50% 56%, ${m} 0%, ${m} 24%, ${l0} 40%, ${l1} 100%)`
  return `radial-gradient(ellipse at 40% 40%, ${l0} 0%, ${l1} 100%)`
})
</script>

<style lang="scss" scoped>
.drink-art {
  position: relative;
  flex-shrink: 0;
}
.drink-stage {
  position: absolute;
  left: 0;
  top: 0;
  width: 200rpx;
  height: 260rpx;
  transform-origin: 0 0;
}
.cast,
.pool,
.straw,
.tall-cup,
.lid,
.peak,
.dome,
.cube,
.rocks,
.steam,
.saucer,
.handle,
.mug,
.surface,
.ring {
  position: absolute;
}

/* 投影 */
.pool {
  bottom: 4rpx;
  left: 38rpx;
  width: 124rpx;
  height: 24rpx;
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba($ink, 0.3) 0%, rgba($ink, 0) 70%);
  &.wide {
    left: 10rpx;
    width: 190rpx;
  }
}
.cast {
  bottom: 16rpx;
  left: 118rpx;
  width: 74rpx;
  height: 40rpx;
  border-radius: 12rpx;
  background: linear-gradient(90deg, rgba($ink, 0.28), rgba($ink, 0));
  transform: skewX(-48deg);
}

/* ---------- tall ---------- */
.straw {
  top: 0;
  left: 110rpx;
  width: 14rpx;
  height: 120rpx;
  border-radius: 7rpx;
  transform: rotate(10deg);
}
.tall-cup {
  top: 88rpx;
  left: 32rpx;
  width: 136rpx;
  height: 160rpx;
  overflow: hidden;
  -webkit-clip-path: polygon(0 0, 100% 0, 87% 100%, 13% 100%);
  clip-path: polygon(0 0, 100% 0, 87% 100%, 13% 100%);
}
.tall-cup.pint {
  top: 48rpx;
  height: 192rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.44);
  border-bottom-width: 11rpx;
  border-radius: 4rpx 4rpx 22rpx 22rpx;
  clip-path: polygon(0 0, 100% 0, 91% 100%, 9% 100%);
}
.pint-rim {
  position: absolute;
  top: 43rpx;
  left: 31rpx;
  width: 138rpx;
  height: 14rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.72);
  border-radius: 50%;
}
.marble {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: radial-gradient(42% 12% at 32% 44%, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0) 72%),
    radial-gradient(24% 22% at 70% 58%, rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0) 72%),
    radial-gradient(38% 10% at 46% 78%, rgba(255, 255, 255, 0.32), rgba(255, 255, 255, 0) 72%),
    radial-gradient(16% 12% at 24% 66%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0) 72%);
}
.ice {
  position: absolute;
  width: 36rpx;
  height: 32rpx;
  border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.24);
  border: 2rpx solid rgba(255, 255, 255, 0.5);
}
.i1 {
  top: 34rpx;
  left: 22rpx;
  transform: rotate(14deg);
}
.i2 {
  top: 50rpx;
  left: 72rpx;
  transform: rotate(-12deg);
}
.i3 {
  top: 82rpx;
  left: 40rpx;
  transform: rotate(28deg);
}
.gloss,
.gloss2 {
  position: absolute;
  top: 6rpx;
  bottom: 8rpx;
  border-radius: 8rpx;
}
.gloss {
  left: 18rpx;
  width: 10rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.08));
}
.gloss2 {
  right: 26rpx;
  width: 4rpx;
  background: rgba(255, 255, 255, 0.28);
}
.lid {
  top: 78rpx;
  left: 24rpx;
  width: 152rpx;
  height: 16rpx;
  border-radius: 10rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(232, 236, 225, 0.95));
  box-shadow: 0 4rpx 8rpx rgba($ink, 0.1);
}
.peak {
  top: 2rpx;
  left: 80rpx;
  width: 44rpx;
  height: 40rpx;
  border-radius: 50% 50% 50% 50% / 62% 62% 38% 38%;
  transform: rotate(-10deg);
}
.dome {
  top: 18rpx;
  left: 34rpx;
  width: 132rpx;
  height: 70rpx;
  overflow: hidden;
  border-radius: 50% 50% 44% 44% / 66% 66% 34% 34%;
  box-shadow: inset 0 -10rpx 16rpx rgba($ink, 0.07);
}
.dust {
  position: absolute;
  top: 0;
  left: 12rpx;
  right: 12rpx;
  height: 42rpx;
  border-radius: 50%;
  opacity: 0.8;
}
.drizzle {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  opacity: 0.7;
}

/* ---------- rocks ---------- */
.cube {
  width: 40rpx;
  height: 36rpx;
  border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.55);
  border: 2rpx solid rgba(255, 255, 255, 0.85);
}
.c1 {
  top: 86rpx;
  left: 56rpx;
  transform: rotate(12deg);
}
.c2 {
  top: 92rpx;
  left: 100rpx;
  width: 36rpx;
  height: 32rpx;
  transform: rotate(-18deg);
}
.rocks {
  top: 104rpx;
  left: 32rpx;
  width: 136rpx;
  height: 140rpx;
  overflow: hidden;
  border-radius: 14rpx 14rpx 26rpx 26rpx;
}
.rim {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 8rpx;
  background: rgba(255, 255, 255, 0.55);
}
.arches {
  position: absolute;
  left: 8rpx;
  right: 8rpx;
  bottom: 22rpx;
  height: 52%;
  display: flex;
  justify-content: space-between;
}
.arch {
  width: 23%;
  height: 100%;
  border-radius: 999rpx 999rpx 10rpx 10rpx;
  background: rgba(0, 0, 0, 0.1);
  box-shadow: inset 0 0 0 3rpx rgba(255, 255, 255, 0.24);
}
.base {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 22rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.3));
}

/* ---------- mug ---------- */
.steam {
  top: 34rpx;
  width: 8rpx;
  height: 58rpx;
  border-radius: 8rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.8));
  opacity: 0.8;
}
.s1 {
  left: 64rpx;
  top: 46rpx;
}
.s2 {
  left: 92rpx;
}
.s3 {
  left: 120rpx;
  top: 52rpx;
}
.steam.live {
  animation: rise 2.6s ease-in-out infinite;
}
.s2.live {
  animation-delay: 0.6s;
}
.s3.live {
  animation-delay: 1.2s;
}
@keyframes rise {
  0% {
    transform: translateY(14rpx) scaleY(0.7);
    opacity: 0;
  }
  40% {
    opacity: 0.85;
  }
  100% {
    transform: translateY(-18rpx) scaleY(1.1);
    opacity: 0;
  }
}
.saucer {
  bottom: 10rpx;
  left: 6rpx;
  width: 188rpx;
  height: 36rpx;
  border-radius: 50%;
}
.saucer-in {
  position: absolute;
  top: 5rpx;
  left: 34rpx;
  right: 34rpx;
  height: 18rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.1);
}
.handle {
  top: 144rpx;
  left: 136rpx;
  width: 56rpx;
  height: 60rpx;
  border-radius: 50%;
  border-width: 14rpx;
  border-style: solid;
}
.mug {
  top: 120rpx;
  left: 22rpx;
  width: 136rpx;
  height: 112rpx;
  border-radius: 12rpx 12rpx 60rpx 60rpx / 12rpx 12rpx 52rpx 52rpx;
}
.surface {
  top: 106rpx;
  left: 22rpx;
  width: 136rpx;
  height: 34rpx;
  border-radius: 50%;
  border-width: 5rpx;
  border-style: solid;
}
.ring {
  top: 113rpx;
  left: 74rpx;
  width: 32rpx;
  height: 14rpx;
  border-radius: 50%;
  border-width: 3rpx;
  border-style: solid;
  opacity: 0.85;
}
</style>

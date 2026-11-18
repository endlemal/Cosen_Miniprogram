<!-- 商品卡：饮品插画叠在焦糖色底座和咖啡色信息面板上 -->
<template>
  <view class="pcard" @tap="emit('open')">
    <view class="panel">
      <Notch v-if="badges.length" bg="#F8F0E3" :r="24" pad="6rpx 18rpx 10rpx 22rpx">
        <text class="badge">{{ badgeLabel }}</text>
      </Notch>
      <text class="name">{{ product.name }}</text>
      <text class="en">{{ product.en }}</text>
      <view class="price">
        <text class="cny">¥</text>
        <text class="amt">{{ product.price }}</text>
      </view>
      <view class="rating">
        <Icon name="star" :size="26" color="#E7A43A" />
        <text class="score">{{ product.rating.toFixed(1) }}</text>
      </view>
    </view>
    <view class="tile" :style="{ background: tileBg }" />
    <!-- 契约 v1.5.0：有封面图时显示图片；无图 / 加载失败显示空占位（等待图片上传） -->
    <view v-if="coverSrc && !coverBroken" class="cover">
      <image class="cover-img" :src="coverSrc" mode="aspectFill" @error="onCoverError" />
    </view>
    <view v-else class="art">
      <ProductImagePlaceholder />
    </view>
    <view class="plus" hover-class="tap-on" @tap.stop="emit('add')">
      <Icon name="plus" :size="38" color="#462719" :stroke="3" />
      <view v-if="qty > 0" class="qty">
        <text class="qty-n">{{ qty }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Product } from '@/types'
import Icon from './Icon.vue'
import Notch from './Notch.vue'
import ProductImagePlaceholder from './ProductImagePlaceholder.vue'
import { badgeText, normalizeBadges } from '@/utils/badge'
import { mediaCover } from '@/utils/media'

const props = withDefaults(defineProps<{ product: Product; qty?: number }>(), { qty: 0 })
const emit = defineEmits<{ (e: 'open'): void; (e: 'add'): void }>()
const tileBg = computed(() => `linear-gradient(165deg, ${props.product.tile[0]} 0%, ${props.product.tile[1]} 100%)`)
// 契约 badge 是数组；兼容旧 mock 字符串，多个角标显示「首个 +N」
const badges = computed(() => normalizeBadges(props.product.badge))
const badgeLabel = computed(() => badgeText(badges.value))
// 契约 v1.5.0 封面：mock 模式恒为 ''（外观走空占位），真实模式拼 API base
const coverSrc = computed(() => mediaCover(props.product.coverUrl, props.product.gallery))
const coverBroken = ref(false)
watch(coverSrc, () => {
  coverBroken.value = false
})
function onCoverError() {
  coverBroken.value = true
}
</script>

<style lang="scss" scoped>
.pcard {
  position: relative;
  height: 316rpx;
  margin-bottom: 30rpx;
}
.panel {
  position: absolute;
  left: 176rpx;
  right: 14rpx;
  top: 70rpx;
  height: 204rpx;
  border-radius: 40rpx;
  background: $espresso;
  padding: 26rpx 22rpx 0 58rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.badge {
  font-size: 20rpx;
  font-weight: 700;
  color: $espresso;
  letter-spacing: 2rpx;
}
.name {
  font-size: 30rpx;
  line-height: 1.32;
  font-weight: 700;
  color: $paper;
  padding-right: 54rpx;
  @include ellipsis(2);
}
.en {
  margin-top: 4rpx;
  font-size: 20rpx;
  color: rgba($cream, 0.85);
  font-family: $font-latin;
  @include ellipsis(1);
}
.price {
  position: absolute;
  left: 58rpx;
  bottom: 22rpx;
  display: flex;
  align-items: baseline;
  color: $paper;
}
.cny {
  font-size: 24rpx;
  font-weight: 700;
  margin-right: 4rpx;
}
.amt {
  font-size: 40rpx;
  font-weight: 800;
  @include num;
}
.rating {
  position: absolute;
  right: 98rpx;
  bottom: 26rpx;
  display: flex;
  align-items: center;
}
.score {
  margin-left: 6rpx;
  font-size: 24rpx;
  color: rgba($paper, 0.9);
  @include num;
}
.tile {
  position: absolute;
  left: 0;
  top: 44rpx;
  width: 214rpx;
  height: 256rpx;
  border-radius: 40rpx;
  border: 1rpx solid rgba($paper, 0.55);
  box-shadow: $shadow-coffee;
}
/* 封面图：占住原插画所在的焦糖底座位置（内缩 3rpx 露出纸边），圆角裁切 */
.cover {
  position: absolute;
  left: 3rpx;
  top: 47rpx;
  width: 208rpx;
  height: 250rpx;
  border-radius: 37rpx;
  overflow: hidden;
}
.cover-img {
  display: block;
  width: 100%;
  height: 100%;
}
.art {
  position: absolute;
  left: 3rpx;
  top: 47rpx;
  width: 208rpx;
  height: 250rpx;
  border-radius: 37rpx;
  overflow: hidden;
}
.plus {
  position: absolute;
  right: 0;
  top: 236rpx;
  width: 92rpx;
  height: 74rpx;
  border-radius: 24rpx;
  background: $caramel;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 14rpx 24rpx -10rpx rgba($roast, 0.55);
}
.qty {
  position: absolute;
  top: -14rpx;
  left: -12rpx;
  min-width: 36rpx;
  height: 36rpx;
  padding: 0 8rpx;
  border-radius: 18rpx;
  background: $paper;
  border: 3rpx solid $caramel;
  display: flex;
  align-items: center;
  justify-content: center;
}
.qty-n {
  font-size: 20rpx;
  font-weight: 800;
  color: $roast;
  @include num;
}
</style>

<!-- 商品卡：饮品插画叠在焦糖色底座和咖啡色信息面板上；v1.6.0 售罄置灰 -->
<template>
  <view class="pcard" :class="{ soldout: soldOut }" @tap="emit('open')">
    <view class="panel" :class="{ marked: product.cornerText }">
      <Notch v-if="product.cornerText" bg="#F8F0E3" :r="24" pad="6rpx 18rpx 10rpx 22rpx">
        <text class="badge">{{ product.cornerText }}</text>
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
    <!-- 正方形封面居中裁切，无图时按商品编码选猫。 -->
    <view v-if="!coverSrc || coverBroken" class="art"><ProductImagePlaceholder :product-key="product.id" /></view>
    <view v-if="coverSrc && !coverBroken" class="cover">
      <image :key="coverSrc" class="cover-img" :class="{ ready: coverReady }" @load="coverReady = true" :src="coverSrc" mode="aspectFill" @error="onCoverError" />
    </view>
    <view v-if="soldOut" class="soldout-mask">
      <text class="soldout-t">售罄</text>
    </view>
    <view class="plus" :class="{ sold: soldOut }" hover-class="tap-on" @tap.stop="onAdd">
      <text v-if="soldOut" class="plus-t-sold">售罄</text>
      <template v-else>
        <Icon name="plus" :size="38" color="#462719" :stroke="3" />
        <view v-if="qty > 0" class="qty">
          <text class="qty-n">{{ qty }}</text>
        </view>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Product } from '@/types'
import Icon from './Icon.vue'
import Notch from './Notch.vue'
import ProductImagePlaceholder from './ProductImagePlaceholder.vue'
import { mediaCover, productThumbnail } from '@/utils/media'

const props = withDefaults(defineProps<{ product: Product; qty?: number }>(), { qty: 0 })
const emit = defineEmits<{ (e: 'open'): void; (e: 'add'): void }>()
/** 契约 v1.6.0：soldOut 时置灰，禁止快捷加购（仍可打开详情查看） */
const soldOut = computed(() => props.product.soldOut === true)
const tileBg = computed(() => `linear-gradient(165deg, ${props.product.tile[0]} 0%, ${props.product.tile[1]} 100%)`)
const originalCover = computed(() => mediaCover(props.product.coverUrl, props.product.gallery))
const useOriginal = ref(false)
const coverSrc = computed(() => useOriginal.value ? originalCover.value : productThumbnail(originalCover.value))
const coverBroken = ref(false)
const coverReady = ref(false)
watch(originalCover, () => {
  useOriginal.value = false
  coverReady.value = false
  coverBroken.value = false
})
function onCoverError() {
  coverReady.value = false
  if (coverSrc.value !== originalCover.value) useOriginal.value = true
  else coverBroken.value = true
}
function onAdd() {
  if (soldOut.value) {
    uni.showToast({ title: '该商品已售罄', icon: 'none', duration: 1600 })
    return
  }
  emit('add')
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
.panel.marked { padding-top: 42rpx; }
.badge {
  display: block;
  max-width: 240rpx;
  @include ellipsis(1);
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
  padding-right: 8rpx;
  @include ellipsis(2);
}
.en {
  margin-top: 4rpx;
  font-size: 20rpx;
  color: rgba($cream, 0.85);
  font-family: $font-product-en;
  line-height: 1.3;
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
/* v1.6.0 售罄：整卡降饱和 + 蒙层标签 + 加购按钮置灰 */
.pcard.soldout {
  opacity: 0.66;
}
.soldout-mask {
  position: absolute;
  left: 3rpx;
  top: 47rpx;
  width: 208rpx;
  height: 250rpx;
  border-radius: 37rpx;
  background: rgba(70, 39, 25, 0.32);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}
.soldout-t {
  padding: 8rpx 22rpx;
  border-radius: 999rpx;
  background: rgba(255, 249, 240, 0.92);
  color: $roast;
  font-size: 24rpx;
  font-weight: 800;
  letter-spacing: 2rpx;
}
.plus.sold {
  background: $line;
  box-shadow: none;
}
.plus-t-sold {
  font-size: 22rpx;
  font-weight: 700;
  color: $ink-3;
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
.cover-img.ready { opacity: 1; }
.cover-img {
  opacity: 0;
  transition: opacity 160ms ease-out;
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

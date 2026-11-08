<!-- 商品卡（参考稿 1）：浅绿底图 + 深绿信息面板，杯子溢出到底图外，右下角加号 -->
<template>
  <view class="pcard" @tap="emit('open')">
    <view class="panel">
      <Notch v-if="product.badge" bg="#EEF0EA" :r="24" pad="6rpx 18rpx 10rpx 22rpx">
        <text class="badge">{{ product.badge }}</text>
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
    <view class="art">
      <DrinkArt :spec="product.art" :size="196" />
    </view>
    <view class="plus" hover-class="tap-on" @tap.stop="emit('add')">
      <Icon name="plus" :size="38" color="#FAFBF7" :stroke="3" />
      <view v-if="qty > 0" class="qty">
        <text class="qty-n">{{ qty }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '@/types'
import Icon from './Icon.vue'
import Notch from './Notch.vue'
import DrinkArt from './DrinkArt.vue'

const props = withDefaults(defineProps<{ product: Product; qty?: number }>(), { qty: 0 })
const emit = defineEmits<{ (e: 'open'): void; (e: 'add'): void }>()
const tileBg = computed(() => `linear-gradient(165deg, ${props.product.tile[0]} 0%, ${props.product.tile[1]} 100%)`)
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
  background: $forest;
  padding: 26rpx 22rpx 0 58rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.badge {
  font-size: 20rpx;
  font-weight: 700;
  color: $forest;
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
  color: rgba(197, 210, 176, 0.85);
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
  color: rgba(250, 251, 247, 0.9);
  @include num;
}
.tile {
  position: absolute;
  left: 0;
  top: 44rpx;
  width: 214rpx;
  height: 256rpx;
  border-radius: 40rpx;
  box-shadow: $shadow-forest;
}
.art {
  position: absolute;
  left: 9rpx;
  top: -4rpx;
}
.plus {
  position: absolute;
  right: 0;
  top: 236rpx;
  width: 92rpx;
  height: 74rpx;
  border-radius: 24rpx;
  background: $sage;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 14rpx 24rpx -10rpx rgba(44, 68, 49, 0.55);
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
  border: 3rpx solid $sage;
  display: flex;
  align-items: center;
  justify-content: center;
}
.qty-n {
  font-size: 20rpx;
  font-weight: 800;
  color: $pine;
  @include num;
}
</style>

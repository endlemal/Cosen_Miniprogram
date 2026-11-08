<template>
  <Sheet :show="show" title="已选饮品" max-height="80vh" @update:show="(v) => emit('update:show', v)">
    <template #head-right>
      <view class="clear" hover-class="tap-on" @tap="onClear">
        <Icon name="trash" :size="26" color="#97A094" />
        <text class="clear-t">清空</text>
      </view>
    </template>
    <scroll-view scroll-y class="list" :style="{ height: listHeight }">
      <view v-for="it in state.cart" :key="it.key" class="row">
        <view class="thumb" :style="{ background: 'linear-gradient(160deg,' + it.tile[0] + ',' + it.tile[1] + ')' }">
          <DrinkArt :spec="it.art" :size="74" />
        </view>
        <view class="info">
          <text class="name">{{ it.name }}</text>
          <text class="spec">{{ it.specText }}</text>
          <text class="price">¥{{ money(it.unitPrice) }}</text>
        </view>
        <Stepper :value="it.qty" small @change="(d) => changeQty(it.key, d)" />
      </view>
    </scroll-view>
    <view class="foot">
      <view class="total">
        <text class="t-l">合计</text>
        <text class="t-c">¥</text>
        <text class="t-n">{{ money(cartTotal) }}</text>
      </view>
      <view class="cta" hover-class="tap-on" @tap="emit('checkout')">
        <text class="cta-t">去结算</text>
      </view>
    </view>
  </Sheet>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import Sheet from './Sheet.vue'
import Icon from './Icon.vue'
import Stepper from './Stepper.vue'
import DrinkArt from './DrinkArt.vue'
import { state, cartTotal, changeQty, clearCart } from '@/store'
import { money } from '@/utils/format'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ (e: 'update:show', v: boolean): void; (e: 'checkout'): void }>()

const listHeight = computed(() => Math.min(state.cart.length * 156 + 20, 760) + 'rpx')

watch(
  () => state.cart.length,
  (n) => {
    if (n === 0 && props.show) emit('update:show', false)
  }
)

function onClear() {
  uni.showModal({
    title: '清空购物车？',
    content: '已选的饮品会全部移除',
    confirmText: '清空',
    confirmColor: '#B9543F',
    success: (r) => r.confirm && clearCart()
  })
}
</script>

<style lang="scss" scoped>
.clear {
  display: flex;
  align-items: center;
  padding: 10rpx 16rpx;
}
.clear-t {
  margin-left: 6rpx;
  font-size: 24rpx;
  color: $ink-3;
}
.list {
  padding: 0 32rpx;
}
.row {
  display: flex;
  align-items: center;
  padding: 18rpx 0;
  border-bottom: 1rpx solid $line;
}
.thumb {
  width: 116rpx;
  height: 116rpx;
  border-radius: 28rpx;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
.info {
  flex: 1;
  min-width: 0;
  padding: 0 20rpx;
  display: flex;
  flex-direction: column;
}
.name {
  font-size: 28rpx;
  font-weight: 700;
}
.spec {
  margin-top: 2rpx;
  font-size: 21rpx;
  color: $ink-3;
  @include ellipsis(1);
}
.price {
  margin-top: 6rpx;
  font-size: 28rpx;
  font-weight: 700;
  @include num;
}
.foot {
  display: flex;
  align-items: center;
  padding: 24rpx 28rpx 26rpx 40rpx;
}
.total {
  flex: 1;
  display: flex;
  align-items: baseline;
}
.t-l {
  font-size: 24rpx;
  color: $ink-2;
  margin-right: 10rpx;
}
.t-c {
  font-size: 26rpx;
  font-weight: 700;
}
.t-n {
  font-size: 48rpx;
  font-weight: 800;
  @include num;
}
.cta {
  height: 92rpx;
  padding: 0 60rpx;
  border-radius: 30rpx;
  background: $forest;
  display: flex;
  align-items: center;
  box-shadow: $shadow-forest;
}
.cta-t {
  color: $paper;
  font-size: 30rpx;
  font-weight: 700;
}
</style>

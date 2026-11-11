<template>
  <view class="stepper" :class="{ dark }">
    <view class="btn minus" hover-class="tap-on" @tap.stop="emit('change', -1)">
      <Icon name="minus" :size="small ? 26 : 30" :color="dark ? '#FFF9F0' : '#663A24'" :stroke="2.4" />
    </view>
    <text class="n" :class="{ small }">{{ value }}</text>
    <view class="btn plus" hover-class="tap-on" @tap.stop="emit('change', 1)">
      <Icon name="plus" :size="small ? 26 : 30" color="#FFF9F0" :stroke="2.4" />
    </view>
  </view>
</template>

<script setup lang="ts">
import Icon from './Icon.vue'

withDefaults(defineProps<{ value: number; small?: boolean; dark?: boolean }>(), { small: false, dark: false })
const emit = defineEmits<{ (e: 'change', delta: number): void }>()
</script>

<style lang="scss" scoped>
.stepper {
  display: flex;
  align-items: center;
}
.btn {
  width: 52rpx;
  height: 52rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.minus {
  background: $latte;
}
.dark .minus {
  background: rgba(255, 255, 255, 0.16);
}
.plus {
  background: $espresso;
}
.dark .plus {
  background: $caramel;
}
.n {
  min-width: 56rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 700;
  @include num;
  &.small {
    font-size: 26rpx;
    min-width: 48rpx;
  }
}
.dark .n {
  color: $paper;
}
</style>

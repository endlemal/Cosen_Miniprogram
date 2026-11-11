<!-- 底部弹层：遮罩 + 上滑面板 -->
<template>
  <view v-if="rendered" class="sheet-root" :class="{ on: visible }">
    <view class="mask" @tap="close" @touchmove.stop.prevent="noop" />
    <view class="panel" :style="{ background: bg, maxHeight: maxHeight }">
      <view class="grip" />
      <view v-if="title" class="head">
        <text class="title">{{ title }}</text>
        <slot name="head-right" />
        <view class="x" hover-class="tap-on" @tap="close">
          <Icon name="close" :size="30" color="#6D513D" />
        </view>
      </view>
      <slot />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Icon from './Icon.vue'

const props = withDefaults(defineProps<{ show: boolean; title?: string; bg?: string; maxHeight?: string }>(), {
  title: '',
  bg: '#FFF9F0',
  maxHeight: '86vh'
})
const emit = defineEmits<{ (e: 'update:show', v: boolean): void }>()

const rendered = ref(false)
const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.show,
  (v) => {
    if (timer) clearTimeout(timer)
    if (v) {
      rendered.value = true
      timer = setTimeout(() => (visible.value = true), 30)
    } else {
      visible.value = false
      timer = setTimeout(() => (rendered.value = false), 280)
    }
  },
  { immediate: true }
)

function close() {
  emit('update:show', false)
}
function noop() {}
</script>

<style lang="scss" scoped>
.sheet-root {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 200;
}
.mask {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(22, 33, 25, 0.48);
  opacity: 0;
  transition: opacity 0.26s ease;
}
.panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 48rpx 48rpx 0 0;
  padding-bottom: env(safe-area-inset-bottom);
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.22, 0.8, 0.26, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.on .mask {
  opacity: 1;
}
.on .panel {
  transform: translateY(0);
}
.grip {
  width: 72rpx;
  height: 8rpx;
  border-radius: 8rpx;
  background: rgba($ink, 0.14);
  margin: 16rpx auto 0;
  flex-shrink: 0;
}
.head {
  display: flex;
  align-items: center;
  padding: 18rpx 32rpx 10rpx 40rpx;
  flex-shrink: 0;
}
.title {
  flex: 1;
  font-size: 34rpx;
  font-weight: 700;
}
.x {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: $latte;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 16rpx;
}
</style>

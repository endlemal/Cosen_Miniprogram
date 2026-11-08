<!--
  参考稿 2 的"缺口价签"：贴在容器右上角，两侧用径向渐变做出内凹圆角。
  bg 必须与容器外围的颜色一致，看起来才像是从图里"挖"出来的。
  父容器需要 position: relative。
-->
<template>
  <view class="notch" :style="{ background: bg, borderBottomLeftRadius: r + 'rpx', padding: pad }">
    <slot />
    <view class="ear ear-l" :style="ear" />
    <view class="ear ear-b" :style="ear" />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ bg?: string; r?: number; pad?: string }>(), {
  bg: '#FAFBF7',
  r: 28,
  pad: '10rpx 22rpx 14rpx 26rpx'
})
const ear = computed(() => ({
  width: props.r + 'rpx',
  height: props.r + 'rpx',
  background: `radial-gradient(circle at 0 100%, transparent 70.2%, ${props.bg} 71.4%)`
}))
</script>

<style scoped>
.notch {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 3;
}
.ear {
  position: absolute;
}
.ear-l {
  top: 0;
  right: 100%;
}
.ear-b {
  top: 100%;
  right: 0;
}
</style>

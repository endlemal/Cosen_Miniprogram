<template>
  <image class="icon" :src="src" mode="aspectFit" :style="{ width: size + 'rpx', height: size + 'rpx' }" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { iconUri } from '@/utils/icons'

const props = withDefaults(defineProps<{ name: string; size?: number; color?: string; stroke?: number }>(), {
  size: 40,
  color: '#38251A',
  stroke: 2
})
const src = computed(() => iconUri(props.name, props.color, props.stroke))
</script>

<style scoped>
.icon {
  display: block;
  flex-shrink: 0;
}
</style>

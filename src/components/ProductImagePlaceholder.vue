<template>
  <view class="ph">
    <!-- #ifdef MP-WEIXIN -->
    <view class="cat-window">
      <image class="cat-sheet" src="/static/product-coffee-cats.jpg" :style="catPosition" mode="scaleToFill" aria-label="咖啡猫" />
    </view>
    <!-- #endif -->
    <!-- #ifndef MP-WEIXIN -->
    <image class="cat" :src="catCover(productKey)" mode="aspectFit" aria-label="咖啡猫" />
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { catCover, catIndex } from '@/utils/cat-cover'

defineOptions({ options: { virtualHost: true } })
const props = defineProps<{ productKey: string }>()
const catPosition = computed(() => {
  const index = catIndex(props.productKey)
  return { left: -(index % 5) * 100 + '%', top: -Math.floor(index / 5) * 100 + '%' }
})
</script>

<style scoped>
.ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f4e8d7; }
.cat { display: block; width: 90%; height: 90%; }
.cat-window { position: relative; width: 90%; aspect-ratio: 1; overflow: hidden; }
.cat-sheet { position: absolute; width: 500%; height: 400%; max-width: none; }
</style>

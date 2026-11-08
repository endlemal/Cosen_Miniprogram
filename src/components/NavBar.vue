<!-- 子页面自定义导航栏：避开小程序胶囊，支持透明叠加在封面上 -->
<template>
  <view>
    <view
      class="nav"
      :style="{
        paddingTop: L.statusBar + 'px',
        height: L.header + 'px',
        background: solid ? bg : 'transparent'
      }"
    >
      <view class="row" :style="{ height: L.navHeight + 'px', paddingRight: Math.max(L.capsule, 16) + 'px' }">
        <view class="back" :class="{ glass: !solid }" hover-class="tap-on" @tap="goBack">
          <Icon name="back" :size="38" :color="solid ? '#1E2A21' : '#FAFBF7'" :stroke="2.4" />
        </view>
        <text class="title" :style="{ opacity: solid ? 1 : 0 }">{{ title }}</text>
      </view>
    </view>
    <view v-if="placeholder" :style="{ height: L.header + 'px' }" />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'
import { getLayout } from '@/utils/layout'

const props = withDefaults(
  defineProps<{ title?: string; bg?: string; placeholder?: boolean; overlay?: boolean; scrollTop?: number }>(),
  { title: '', bg: '#EEF0EA', placeholder: true, overlay: false, scrollTop: 0 }
)
const L = getLayout()
/** overlay 模式：滚动前透明（白色返回键），滚过 120px 后变实色 */
const solid = computed(() => !props.overlay || props.scrollTop > 120)

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.reLaunch({ url: '/pages/index/index' })
}
</script>

<style lang="scss" scoped>
.nav {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  z-index: 90;
  transition: background 0.2s ease;
}
.row {
  display: flex;
  align-items: center;
  padding-left: 20rpx;
}
.back {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  &.glass {
    background: rgba(30, 42, 33, 0.28);
  }
}
.title {
  margin-left: 12rpx;
  font-size: 34rpx;
  font-weight: 700;
  transition: opacity 0.2s ease;
}
</style>

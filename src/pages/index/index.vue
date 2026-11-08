<!--
  首页外壳：三个 tab 视图 + 悬浮胶囊底栏。
  不用原生 tabBar，是为了实现参考稿 1 的悬浮深绿胶囊底栏，且切换时不闪烁。
  视图首次访问时才渲染，之后用 display 切换以保留滚动位置和状态。
-->
<template>
  <view class="shell">
    <view v-if="seen.square" class="pane" :class="{ hidden: state.ui.tab !== 'square' }">
      <SquareView />
    </view>
    <view v-if="seen.menu" class="pane" :class="{ hidden: state.ui.tab !== 'menu' }">
      <MenuView />
    </view>
    <view v-if="seen.mine" class="pane" :class="{ hidden: state.ui.tab !== 'mine' }">
      <MineView />
    </view>
    <TabBar />
  </view>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { onShareAppMessage } from '@dcloudio/uni-app'
import SquareView from '@/views/SquareView.vue'
import MenuView from '@/views/MenuView.vue'
import MineView from '@/views/MineView.vue'
import TabBar from '@/components/TabBar.vue'
import { hydrate, state } from '@/store'

hydrate()

const seen = reactive({ square: false, menu: false, mine: false })
watch(
  () => state.ui.tab,
  (t) => (seen[t] = true),
  { immediate: true }
)

onShareAppMessage(() => ({
  title: '苔生 Mossy｜今天想喝哪一杯？',
  path: '/pages/index/index'
}))
</script>

<style lang="scss" scoped>
.shell {
  position: relative;
  height: 100vh;
  overflow: hidden;
  background: $fog;
}
.pane {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}
.hidden {
  display: none;
}
</style>

<!--
  首页外壳：三个 tab 视图 + 悬浮胶囊底栏。
  自定义底栏在三个首页视图之间切换。
  视图首次访问时才渲染，之后用 display 切换以保留滚动位置和状态。
-->
<template>
  <view class="shell">
    <view v-if="!catalogReady || !pagesReady" class="boot">
      <text class="boot-text">{{ catalogFailed ? '菜单加载失败' : '正在加载菜单…' }}</text>
      <view v-if="catalogFailed" class="boot-btn" @tap="loadCatalog"><text>重试</text></view>
    </view>
    <view v-if="catalogReady && pagesReady && state.ui.squareEnabled && seen.square" class="pane" :class="{ hidden: state.ui.tab !== 'square' }">
      <SquareView />
    </view>
    <view v-if="catalogReady && pagesReady && seen.menu" class="pane" :class="{ hidden: state.ui.tab !== 'menu' }">
      <MenuView />
    </view>
    <view v-if="catalogReady && pagesReady && seen.mine" class="pane" :class="{ hidden: state.ui.tab !== 'mine' }">
      <MineView />
    </view>
    <TabBar v-if="pagesReady" />
  </view>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { onLoad, onShareAppMessage, onShow } from '@dcloudio/uni-app'
import SquareView from '@/views/SquareView.vue'
import MenuView from '@/views/MenuView.vue'
import MineView from '@/views/MineView.vue'
import TabBar from '@/components/TabBar.vue'
import { getStoreInfo } from '@/api/store'
import { cacheSubscribeTemplates } from '@/api/order'
import { bindTableNo, extractTableNo, hydrate, setSquareEnabled, state, switchTab } from '@/store'
import { useMock } from '@/config/env'
import { hydrateCatalogFromApi } from '@/api/catalogHydrate'
import { hasToken } from '@/api/token'
import { syncMemberProfile } from '@/store/member'

hydrate()

onLoad((query) => {
  const tableNo = extractTableNo(query as Record<string, any>)
  if (tableNo) {
    bindTableNo(tableNo)
  }
})

// 真实模式：菜单/价格以后端目录为准，加载完成后再渲染三个首页视图
const catalogReady = ref(useMock)
const catalogFailed = ref(false)
const pagesReady = ref(useMock)
const squareCacheKey = 'cosen:square-enabled'
let settingsRequest = 0
async function refreshPageSettings() {
  const requestId = ++settingsRequest
  try {
    const store = await getStoreInfo(true)
    if (requestId !== settingsRequest) return
    const enabled = store.squareEnabled !== false
    setSquareEnabled(enabled)
    try {
      uni.setStorageSync(squareCacheKey, enabled)
      cacheSubscribeTemplates(store)
    } catch { /* storage unavailable */ }
  } catch {
    if (requestId === settingsRequest && !pagesReady.value) {
      let enabled = false
      try { enabled = uni.getStorageSync(squareCacheKey) === true } catch { /* storage unavailable */ }
      setSquareEnabled(enabled)
    }
  } finally {
    if (requestId === settingsRequest) pagesReady.value = true
  }
}
async function loadCatalog() {
  catalogFailed.value = false
  try {
    await hydrateCatalogFromApi()
    catalogReady.value = true
  } catch {
    catalogFailed.value = true
  }
}
if (!useMock) void loadCatalog()
// 每次回到首页（充值 / 支付后返回）刷新储值余额，保证「我的」与结算页一致
onShow(() => {
  if (!useMock) {
    void refreshPageSettings()
    // #ifdef H5
    if (!hasToken()) return
    // #endif
    void syncMemberProfile()
  }
})

const seen = reactive({ square: false, menu: false, mine: false })
watch(
  () => state.ui.tab,
  (t) => (seen[t] = true),
  { immediate: true }
)

onShareAppMessage(() => ({
  title: '可森 COSEN｜日咖夜酒的社区客厅',
  path: '/pages/index/index'
}))
</script>

<style lang="scss" scoped>
.shell {
  position: relative;
  height: 100vh;
  overflow: hidden;
  background: $canvas;
}
.boot {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
}
.boot-text {
  font-size: 28rpx;
  color: #8a6a4f;
}
.boot-btn {
  padding: 14rpx 40rpx;
  border-radius: 999rpx;
  background: #c5976b;
  color: #fff;
  font-size: 26rpx;
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

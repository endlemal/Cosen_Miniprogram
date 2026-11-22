<!-- 点单：会员储值卡、弧形竖排分类与商品列表 -->
<template>
  <view class="view" :style="{ paddingTop: layout.statusBar + layout.topGap + 'px' }">
    <scroll-view
      scroll-y
      class="menu-scroll"
      :scroll-top="menuTarget"
      @scroll="onScroll"
    >
      <view @touchstart="startMenuGesture" @wheel="startMenuGesture">
        <RechargeCarousel @layout-change="scheduleMeasure" />
      </view>

      <view v-if="state.tableNo" class="table-bar">
        <view class="tb-left">
          <Icon name="pin" :size="26" color="#663A24" />
          <text class="tb-t">当前桌号：{{ state.tableNo }} 号桌 · 扫码已自动绑定</text>
        </view>
        <text class="tb-clear" hover-class="tap-on" @tap="bindTableNo('')">改回自取</text>
      </view>

      <view v-if="!CATEGORIES.length" class="empty-menu">暂无上架商品</view>
      <view v-else class="body">
        <view
          class="rail-slot"
          :class="{ 'rail-pinned': railPinned }"
          @touchstart="pauseRailFollow"
          @wheel="pauseRailFollow"
        >
          <scroll-view
            id="menu-rail"
            class="rail"
            :style="{ height: railViewportHeight + 'px' }"
            :scroll-y="railPinned || railPosition > 0"
            :scroll-top="railTarget"
            :show-scrollbar="false"
            @scroll.stop="onRailScroll"
            enhanced
          >
            <view class="rail-track" :style="{ minHeight: railViewportHeight + 'px' }">
              <view
                v-for="category in CATEGORIES"
                :key="category.id"
                class="rail-card"
                :class="{ on: active === category.id }"
                @tap="jump(category.id)"
              >
                <view class="rail-text">
                  <view class="rail-cn">
                    <text v-for="(char, index) in category.name.split('')" :key="index">{{ char }}</text>
                  </view>
                  <text class="rail-en">{{ category.en }}</text>
                </view>
              </view>
              <view
                class="rail-bar"
                :class="{ show: indicatorReady }"
                :style="{ transform: `translate3d(0, ${indicatorY}px, 0)` }"
              />
            </view>
          </scroll-view>
        </view>

        <view class="list" @touchstart="startMenuGesture" @wheel="startMenuGesture">
          <view
            v-for="c in CATEGORIES"
            :id="'sec-' + c.id"
            :key="c.id"
            class="sec"
            :style="c.id === lastCat ? { minHeight: lastSectionHeight } : undefined"
          >
            <view class="sec-head">
              <view class="sec-row">
                <text class="sec-name">{{ c.name }}</text>
                <text class="sec-en">{{ c.en }}</text>
              </view>
              <text class="sec-desc">{{ c.desc }}</text>
            </view>
            <ProductCard
              v-for="p in byCat[c.id]"
              :key="p.id"
              :product="p"
              :qty="qtyOfProduct(p.id)"
              @open="open(p)"
              @add="quickAdd(p)"
            />
          </view>
          <view class="list-tail" :class="{ 'with-cart': cartCount > 0 }" />
        </view>
      </view>
    </scroll-view>

    <!-- 购物车条 -->
    <view class="cartbar" :class="{ show: cartCount > 0 }">
      <view class="cb-l" hover-class="tap-on" @tap="cartOpen = true">
        <view class="cb-icon">
          <Icon name="bag" :size="40" color="#FFF9F0" :stroke="2.2" />
          <view class="cb-badge">
            <text class="cb-badge-t">{{ cartCount }}</text>
          </view>
        </view>
        <view class="cb-sum">
          <view class="cb-price">
            <text class="cb-c">¥</text>
            <text class="cb-n">{{ money(cartTotal + rechargeCartTotal) }}</text>
          </view>
        </view>
      </view>
      <view class="cb-go" hover-class="tap-on" @tap="checkoutCart">
        <text class="cb-go-t">去结算</text>
      </view>
    </view>

    <ProductSheet v-model:show="sheetOpen" :product="current" />
    <CartSheet v-model:show="cartOpen" @checkout="checkoutDrinks" @recharge="checkoutRecharge" />
  </view>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Product } from '@/types'
import Icon from '@/components/Icon.vue'
import ProductCard from '@/components/ProductCard.vue'
import ProductSheet from '@/components/ProductSheet.vue'
import CartSheet from '@/components/CartSheet.vue'
import RechargeCarousel from '@/components/RechargeCarousel.vue'
import { CATEGORIES, PRODUCTS, getProduct, specGroupsOf } from '@/mock/products'
import { bindTableNo, state, cartCount, cartTotal, addToCart, qtyOfProduct, rechargeCart, rechargeCartTotal, type Selection } from '@/store'
import { getLayout } from '@/utils/layout'
import { money } from '@/utils/format'

const layout = getLayout()
const topInset = layout.statusBar + layout.topGap
const usableHeight = `100vh - ${topInset}px - env(safe-area-inset-bottom)`
const dockReserve = 144
const cartReserve = 300
const lastSectionHeight = computed(() => `calc(${usableHeight} - ${cartCount.value ? cartReserve : dockReserve}rpx)`)
const railViewportHeight = ref(layout.windowHeight - topInset)
const lastCat = CATEGORIES[CATEGORIES.length - 1]?.id

const byCat: Record<string, Product[]> = {}
CATEGORIES.forEach((c) => (byCat[c.id] = PRODUCTS.filter((p) => p.cat === c.id)))

const active = ref(CATEGORIES[0]?.id || '')
const menuTarget = ref(0)
const railTarget = ref(0)
const railPinned = ref(false)
const railPosition = ref(0)
const indicatorY = ref(0)
const indicatorReady = ref(false)
let railHasGesture = false
let offsets: { id: string; top: number; titleTop: number }[] = []
let railBounds: Record<string, { top: number; bottom: number }> = {}
let menuViewportHeight = railViewportHeight.value
let railContentHeight = 0
let menuScrollLimit = 0
let readingLine = 0
let scrollTop = 0
let railStart = Infinity
let measuredRpx = layout.rpx
let railDestination = -1
let jumpId = ''
let stopMenuMotion = () => {}
let stopRailMotion = () => {}
let unlockTimer: ReturnType<typeof setTimeout> | undefined
let measureTimer: ReturnType<typeof setTimeout> | undefined
let pendingProductTimer: ReturnType<typeof setTimeout> | undefined
let disposed = false
let reducedMotion = false
// #ifdef H5
reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
// #endif

const instance = getCurrentInstance()

// Animate the actual scroll offset, including on H5 where the native animated
// scroll-view translates its entire content (which also moves the sticky rail).
// Each motion has one cancellation handle; a new tap or gesture owns the scroll.
function animateOffset(from: number, to: number, duration: number, write: (value: number) => void, done = () => {}) {
  let cancelled = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let frame: number | undefined
  const start = Date.now()
  const tick = () => {
    if (cancelled) return
    const progress = reducedMotion ? 1 : Math.min(1, (Date.now() - start) / duration)
    write(from + (to - from) * (1 - Math.pow(1 - progress, 3)))
    if (progress < 1) {
      if (typeof requestAnimationFrame === 'function') frame = requestAnimationFrame(tick)
      else timer = setTimeout(tick, 16)
    } else done()
  }
  tick()
  return () => {
    cancelled = true
    if (frame !== undefined) cancelAnimationFrame(frame)
    if (timer !== undefined) clearTimeout(timer)
  }
}

function measure() {
  if (!CATEGORIES.length) return
  if (disposed || state.ui.tab !== 'menu') return
  uni
    .createSelectorQuery()
    .in(instance?.proxy)
    .select('.menu-scroll')
    .fields({ rect: true, size: true, scrollOffset: true }, () => {})
    .select('.body')
    .boundingClientRect()
    .selectAll('.sec')
    .boundingClientRect()
    .selectAll('.sec-row')
    .boundingClientRect()
    .select('.list-tail')
    .boundingClientRect()
    .select('.rail')
    .boundingClientRect()
    .select('.rail-track')
    .boundingClientRect()
    .selectAll('.rail-card')
    .boundingClientRect()
    .exec(([viewport, body, sections, titles, tail, rail, track, cards]) => {
      if (disposed || state.ui.tab !== 'menu' || !viewport?.height || !body || !sections?.length) return
      scrollTop = viewport.scrollTop ?? scrollTop
      const origin = scrollTop - viewport.top
      menuViewportHeight = viewport.height
      railStart = body.top + origin
      updateRailViewport()
      measuredRpx = rail ? rail.width / 116 : layout.rpx
      const tailHeight = tail?.height ?? (cartCount.value > 0 ? cartReserve : dockReserve) * measuredRpx
      // Use the upper quarter of the unobscured reading area, not the bottom edge.
      readingLine = Math.max(24, Math.min(140, (viewport.height - tailHeight) * 0.24))
      menuScrollLimit = Math.max(0, (tail?.bottom ?? body.bottom) + origin - viewport.height)
      offsets = sections.map((section: { id: string; top: number }, index: number) => ({
        id: section.id.replace('sec-', ''),
        top: section.top + origin,
        titleTop: (titles?.[index]?.top ?? section.top) + origin
      }))
      if (rail && track && cards?.length === CATEGORIES.length) {
        railContentHeight = cards[cards.length - 1].bottom - track.top
        railBounds = Object.fromEntries(CATEGORIES.map((category, index) => {
          const card = cards[index]
          return [category.id, { top: card.top - track.top, bottom: card.bottom - track.top }]
        }))
      }
      syncCategory()
      consumePending()
    })
}

function scheduleMeasure() {
  clearTimeout(measureTimer)
  measureTimer = setTimeout(() => nextTick(measure), 80)
}

onMounted(() => {
  nextTick(measure)
  uni.onWindowResize(scheduleMeasure)
})
onUnmounted(() => {
  disposed = true
  cancelJump()
  stopRailMotion()
  clearTimeout(measureTimer)
  clearTimeout(pendingProductTimer)
  uni.offWindowResize(scheduleMeasure)
})
watch(() => cartCount.value > 0, scheduleMeasure)
watch(() => state.tableNo, scheduleMeasure)
watch(() => state.ui.tab, (tab) => {
  cancelJump()
  stopRailMotion()
  railDestination = -1
  if (tab === 'menu') nextTick(measure)
})

function categoryAt(y: number) {
  let category = offsets[0].id
  for (const section of offsets) {
    if (section.titleTop > y) break
    category = section.id
  }
  return category
}

function syncCategory() {
  if (!offsets.length) return
  if (!jumpId) {
    active.value = scrollTop >= menuScrollLimit - 1 && menuScrollLimit > 0
      ? lastCat : categoryAt(scrollTop + readingLine)
  }
  revealRailCard(active.value)
}

// The unpinned rail starts below the visible portion of the header.
function updateRailViewport() {
  if (!Number.isFinite(railStart)) return
  const headerRemaining = Math.max(0, railStart - scrollTop)
  railPinned.value = headerRemaining <= 1
  railViewportHeight.value = Math.max(0, menuViewportHeight - headerRemaining)
}

function onScroll(e: { target?: { id?: string }; detail: { scrollTop: number } }) {
  if (e.target?.id === 'menu-rail') return
  scrollTop = Math.max(0, e.detail.scrollTop)
  updateRailViewport()
  syncCategory()
}

function onRailScroll(e: { detail: { scrollTop: number } }) {
  railPosition.value = Math.max(0, e.detail.scrollTop)
}

function pauseRailFollow() {
  if (railPinned.value || railPosition.value > 0) {
    railHasGesture = true
    stopRailMotion()
    railDestination = -1
  }
}

function cancelJump() {
  stopMenuMotion()
  clearTimeout(unlockTimer)
  jumpId = ''
}

function startMenuGesture() {
  cancelJump()
  railHasGesture = false
  syncCategory()
}

function revealRailCard(id: string) {
  const card = railBounds[id]
  if (!card) return
  // Preserve SABE-9's 10px dot / 6px bottom inset on the 390px design canvas.
  indicatorY.value = card.bottom - (11.538462 + 19.230769) * measuredRpx
  indicatorReady.value = true
  if (railHasGesture) return
  const centered = (card.top + card.bottom - railViewportHeight.value) / 2
  const railScrollLimit = Math.max(0, railContentHeight - railViewportHeight.value)
  const target = railPinned.value ? Math.min(railScrollLimit, Math.max(0, centered)) : 0
  if (Math.abs(target - railDestination) < 1) return
  stopRailMotion()
  railDestination = target
  stopRailMotion = animateOffset(railPosition.value, target, 320, (value) => {
    railTarget.value = value
  })
}

function jump(id: string) {
  const section = offsets.find((section) => section.id === id)
  if (!section) return
  cancelJump()
  railHasGesture = false
  jumpId = id
  active.value = id
  revealRailCard(id)
  const target = Math.min(menuScrollLimit, section.top)
  // Rebase the bound value after manual scrolling so repeated taps still work.
  menuTarget.value = scrollTop
  stopMenuMotion = animateOffset(scrollTop, target, 420, (value) => {
    menuTarget.value = value
  }, () => {
    // Let the final native scroll event arrive before releasing the selected tab.
    unlockTimer = setTimeout(() => {
      jumpId = ''
      syncCategory()
    }, 100)
  })
}

/* ---- 规格弹层 ---- */
const sheetOpen = ref(false)
const cartOpen = ref(false)
const current = ref<Product | null>(null)

function open(p: Product) {
  current.value = p
  sheetOpen.value = true
}

/** 加号：按默认规格直接加购 */
function quickAdd(p: Product) {
  const groups = specGroupsOf(p)
  const sel: Selection = {}
  groups.forEach((g) => (sel[g.key] = g.multi ? [] : 0))
  addToCart(p, groups, sel, 1)
  uni.showToast({ title: `已加入 ${p.name}`, icon: 'none', duration: 1000 })
}

function checkoutCart() {
  if (state.cart.length && rechargeCart.value.length) cartOpen.value = true
  else if (rechargeCart.value.length) checkoutRecharge()
  else if (state.cart.length) checkoutDrinks()
}

function checkoutDrinks() {
  cartOpen.value = false
  uni.navigateTo({ url: '/pages/checkout/index' })
}

function checkoutRecharge() {
  cartOpen.value = false
  uni.navigateTo({ url: '/pages/recharge/index?cart=1' })
}

/* ---- 从其他页面跳来时打开指定商品 ---- */
function consumePending() {
  const id = state.ui.pendingProductId
  if (!id || !offsets.length) return
  state.ui.pendingProductId = ''
  const p = getProduct(id)
  if (!p) return
  jump(p.cat)
  clearTimeout(pendingProductTimer)
  pendingProductTimer = setTimeout(() => open(p), 460)
}
watch(() => state.ui.pendingProductId, consumePending)
</script>

<style lang="scss" scoped>
.empty-menu { padding: 100rpx 32rpx; text-align: center; color: #856951; }
$rail-width: 116rpx;

.view {
  position: relative;
  height: 100vh;
  /* #ifdef H5 */
  height: 100dvh;
  /* #endif */
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.menu-scroll {
  height: 100%;
}
.body {
  display: flex;
}

/* ---------- 左侧分类标签页 ---------- */
.rail-slot {
  position: sticky;
  top: 0;
  z-index: 1;
  align-self: flex-start;
  width: $rail-width;
  flex-shrink: 0;
}
.rail {
  width: 100%;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.rail-pinned .rail,
.rail-pinned :deep(.uni-scroll-view-scrollbar-hidden) {
  overscroll-behavior-y: contain;
}
:deep(.rail .uni-scroll-view::-webkit-scrollbar) {
  display: none;
  width: 0;
  height: 0;
}
.rail-track {
  position: relative;
  border-top-right-radius: $rail-width 178rpx;
  background: $espresso;
}
.rail-card {
  position: relative;
  height: 342rpx;
  padding: 54rpx 8rpx 36rpx 0;
  border-top-right-radius: $rail-width 178rpx;
  background: $espresso;
  box-shadow: 0 -3rpx 4rpx rgba($roast, 0.38);
  transition: background-color 220ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rail-card + .rail-card {
  margin-top: -42rpx;
}
.rail-card.on {
  background: #80543A;
}
.rail-text {
  opacity: 0.82;
  transition: opacity 220ms ease;
  display: flex;
  align-items: center;
}
.rail-card.on .rail-text {
  opacity: 1;
}
.rail-cn {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 25rpx;
  line-height: 1.16;
  font-weight: 700;
  color: rgba($paper, 0.92);
}
.rail-en {
  writing-mode: vertical-rl;
  margin-left: 5rpx;
  font-size: 16rpx;
  line-height: 1.1;
  color: $cream;
  font-family: $font-latin;
}
.rail-bar {
  position: absolute;
  // Figma 53:26: 10px dot, 7px right / 6px bottom of the selected card.
  // Convert the 390px canvas to 750rpx without rounding to whole rpx.
  right: 13.461538rpx;
  top: 0;
  z-index: 2;
  pointer-events: none;
  width: 19.230769rpx;
  height: 19.230769rpx;
  border-radius: 50%;
  background: $paper;
  opacity: 0;
  transition: transform 240ms cubic-bezier(0.22, 0.8, 0.26, 1), opacity 0.2s ease;
  will-change: transform;
}
.rail-bar.show {
  opacity: 1;
}
@media (prefers-reduced-motion: reduce) {
  .rail-bar, .rail-card, .rail-text {
    transition: none;
  }
}
/* ---------- 商品列表 ---------- */
.list {
  flex: 1;
  min-width: 0;
  padding: 0 24rpx 0 30rpx;
}
.sec {
  padding-top: 18rpx;
}
.sec-head {
  padding: 8rpx 0 6rpx 6rpx;
}
.sec-row {
  display: flex;
  align-items: baseline;
}
.sec-name {
  font-size: 34rpx;
  font-weight: 800;
}
.sec-en {
  margin-left: 12rpx;
  font-size: 22rpx;
  color: $ink-3;
  font-family: $font-product-en;
}
.sec-desc {
  font-size: 22rpx;
  color: $ink-3;
}
.list-tail {
  height: calc(env(safe-area-inset-bottom) + 144rpx);
}
.list-tail.with-cart {
  height: calc(env(safe-area-inset-bottom) + 300rpx);
}

/* ---------- 购物车条 ---------- */
.cartbar {
  position: fixed;
  left: $rail-width + 14rpx;
  right: 40rpx;
  bottom: calc(env(safe-area-inset-bottom) + 166rpx);
  height: 108rpx;
  border-radius: 38rpx;
  background: $paper;
  box-shadow: 0 24rpx 48rpx -20rpx rgba($ink, 0.45);
  display: flex;
  align-items: center;
  padding: 0 10rpx 0 14rpx;
  z-index: 99;
  transform: translateY(40rpx);
  opacity: 0;
  pointer-events: none;
  transition: transform 0.28s cubic-bezier(0.22, 0.8, 0.26, 1), opacity 0.2s ease;
  &.show {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }
}
.cb-l {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}
.cb-icon {
  position: relative;
  width: 80rpx;
  height: 80rpx;
  border-radius: 28rpx;
  background: $espresso;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cb-badge {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  min-width: 34rpx;
  height: 34rpx;
  padding: 0 8rpx;
  border-radius: 17rpx;
  background: $caramel;
  border: 3rpx solid $paper;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cb-badge-t {
  font-size: 19rpx;
  font-weight: 800;
  color: $roast;
  @include num;
}
.cb-sum {
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
}
.cb-price {
  display: flex;
  align-items: baseline;
}
.cb-c {
  font-size: 24rpx;
  font-weight: 700;
}
.cb-n {
  font-size: 38rpx;
  font-weight: 800;
  line-height: 1.1;
  @include num;
}
.cb-go {
  height: 86rpx;
  padding: 0 44rpx;
  border-radius: 30rpx;
  background: $espresso;
  display: flex;
  align-items: center;
}
.cb-go-t {
  font-size: 28rpx;
  font-weight: 700;
  color: $paper;
}
.table-bar {
  margin: 14rpx 28rpx 0;
  padding: 16rpx 24rpx;
  border-radius: 26rpx;
  background: #F4E9D8;
  border: 1rpx solid #E2CEB1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}
.tb-left {
  display: flex;
  align-items: center;
  gap: 10rpx;
  min-width: 0;
  flex: 1;
}
.tb-t {
  font-size: 24rpx;
  font-weight: 600;
  color: $espresso;
}
.tb-clear {
  font-size: 23rpx;
  color: $toffee;
  font-weight: 600;
  flex-shrink: 0;
}
</style>

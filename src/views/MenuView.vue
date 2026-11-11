<!-- 点单：会员储值卡、弧形竖排分类与商品列表 -->
<template>
  <view class="view" :style="{ paddingTop: layout.statusBar + layout.topGap + 'px' }">
    <scroll-view
      scroll-y
      class="menu-scroll"
      :scroll-into-view="menuAnchor"
      @scroll="onScroll"
    >
      <view @touchstart="startMenuGesture" @wheel="startMenuGesture">
        <RechargeCarousel />
      </view>

      <view class="body">
        <view
          class="rail-slot"
          :class="{ 'rail-pinned': railPinned }"
          @touchstart="pauseRailFollow"
          @wheel="pauseRailFollow"
        >
          <scroll-view
            id="menu-rail"
            class="rail"
            :style="{ height: railHeight }"
            :scroll-y="railPinned || railPosition > 0"
            :scroll-top="railTarget"
            :show-scrollbar="false"
            @scroll="onRailScroll"
            enhanced
          >
            <view class="rail-track">
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
                <view class="rail-bar" :class="{ show: active === category.id }" />
              </view>
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
import { computed, getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue'
import type { Product } from '@/types'
import Icon from '@/components/Icon.vue'
import ProductCard from '@/components/ProductCard.vue'
import ProductSheet from '@/components/ProductSheet.vue'
import CartSheet from '@/components/CartSheet.vue'
import RechargeCarousel from '@/components/RechargeCarousel.vue'
import { CATEGORIES, PRODUCTS, getProduct, specGroupsOf } from '@/mock/products'
import { state, cartCount, cartTotal, addToCart, qtyOfProduct, rechargeCart, rechargeCartTotal, type Selection } from '@/store'
import { getLayout } from '@/utils/layout'
import { money } from '@/utils/format'

const layout = getLayout()
const topInset = layout.statusBar + layout.topGap
const usableHeight = `100vh - ${topInset}px - env(safe-area-inset-bottom)`
const railHeight = `calc(100vh - ${topInset}px)`
const dockReserve = 144
const cartReserve = 300
const lastSectionHeight = computed(() => `calc(${usableHeight} - ${cartCount.value ? cartReserve : dockReserve}rpx)`)
const lastCat = CATEGORIES[CATEGORIES.length - 1].id

const byCat: Record<string, Product[]> = {}
CATEGORIES.forEach((c) => (byCat[c.id] = PRODUCTS.filter((p) => p.cat === c.id)))

const active = ref(CATEGORIES[0].id)
const menuAnchor = ref('')
const railTarget = ref(0)
const railPinned = ref(false)
const railPosition = ref(0)
let railHasGesture = false
let offsets: { id: string; top: number; titleTop: number }[] = []
let railBounds: Record<string, { top: number; bottom: number }> = {}
let railViewportHeight = 0
let railScrollLimit = 0
let scrollTop = 0
let railStart = Infinity
let dockTop = 0
let cartTop = 0

const instance = getCurrentInstance()

function measure() {
  uni
    .createSelectorQuery()
    .in(instance?.proxy)
    .select('.menu-scroll')
    .fields({ rect: true, scrollOffset: true }, () => {})
    .select('.body')
    .boundingClientRect()
    .selectAll('.sec')
    .boundingClientRect()
    .selectAll('.sec-row')
    .boundingClientRect()
    .select('.list-tail')
    .boundingClientRect()
    .select('.cartbar')
    .boundingClientRect()
    .select('.rail')
    .boundingClientRect()
    .select('.rail-track')
    .boundingClientRect()
    .selectAll('.rail-card')
    .boundingClientRect()
    .exec(([viewport, body, sections, titles, tail, cart, rail, track, cards]) => {
      if (!viewport || !body || !sections?.length) return
      const origin = (viewport.scrollTop ?? scrollTop) - viewport.top
      railStart = body.top + origin
      railPinned.value = scrollTop >= railStart - 1
      const rpx = rail ? rail.width / 116 : layout.rpx
      const tailHeight = tail?.height ?? (cartCount.value > 0 ? cartReserve : dockReserve) * rpx
      const dockHeight = tailHeight - (cartCount.value > 0 ? (cartReserve - dockReserve) * rpx : 0)
      dockTop = Math.max(0, viewport.bottom - viewport.top - dockHeight)
      cartTop = cart ? Math.max(0, cart.top - viewport.top) : dockTop
      offsets = sections.map((section: { id: string; top: number }, index: number) => ({
        id: section.id.replace('sec-', ''),
        top: section.top + origin,
        titleTop: (titles?.[index]?.top ?? section.top) + origin
      }))
      if (rail && track && cards?.length === CATEGORIES.length) {
        railViewportHeight = rail.height
        railScrollLimit = Math.max(0, track.height - rail.height)
        railBounds = Object.fromEntries(CATEGORIES.map((category, index) => {
          const card = cards[index]
          return [category.id, { top: card.top - track.top, bottom: card.bottom - track.top }]
        }))
      }
      consumePending()
    })
}

onMounted(() => nextTick(measure))

function categoryAt(y: number) {
  let category = offsets[0].id
  for (const section of offsets) {
    if (section.titleTop > y) break
    category = section.id
  }
  return category
}

function onScroll(e: { target?: { id?: string }; detail: { scrollTop: number } }) {
  if (e.target?.id === 'menu-rail') return
  const previousTop = scrollTop
  scrollTop = e.detail.scrollTop
  // 定位只由点击触发，滚动回调只读取位置并撤销已使用的锚点。
  const fromCategoryTap = Boolean(menuAnchor.value)
  if (fromCategoryTap) menuAnchor.value = ''
  if (!offsets.length) return
  railPinned.value = scrollTop >= railStart - 1
  if (!fromCategoryTap) {
    const visibleBottom = cartCount.value > 0 ? cartTop : dockTop
    const previousCategory = categoryAt(previousTop + visibleBottom)
    const visibleCategory = categoryAt(scrollTop + visibleBottom)
    // 标题越过商品可视区下缘时才切换，点击定位后保留用户点中的分类。
    if (visibleCategory !== previousCategory) active.value = visibleCategory
  }
  revealRailCard(active.value)
}

function onRailScroll(e: { detail: { scrollTop: number } }) {
  railPosition.value = Math.max(0, e.detail.scrollTop)
}

function pauseRailFollow() {
  // 分栏可滚动时，用户自己滑动的期间不自动跟随
  if (railPinned.value || railPosition.value > 0) railHasGesture = true
}

function startMenuGesture() {
  menuAnchor.value = ''
  railHasGesture = false
}

async function revealRailCard(id: string) {
  const card = railBounds[id]
  if (!card || railHasGesture) return

  const position = railPosition.value
  let target = 0
  if (railPinned.value) {
    target = position
    if (card.top < position) target = Math.floor(card.top)
    else if (card.bottom > position + railViewportHeight) target = Math.ceil(card.bottom - railViewportHeight)
  }
  target = Math.max(0, Math.min(railScrollLimit, target))
  if (Math.abs(target - position) < 1) return
  // 手动滑开后，仍可再次发出相同的定位指令。
  if (railTarget.value === target) {
    railTarget.value = position
    await nextTick()
    if (active.value !== id || railHasGesture) return
  }
  railTarget.value = target
}

function jump(id: string) {
  const target = offsets.find((section) => section.id === id)
  if (!target) return
  railHasGesture = false
  active.value = id
  if (Math.abs(target.top - scrollTop) < 1) {
    revealRailCard(id)
    return
  }
  menuAnchor.value = 'sec-' + id
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
  setTimeout(() => open(p), 260)
}
watch(() => state.ui.pendingProductId, consumePending)
</script>

<style lang="scss" scoped>
$rail-width: 116rpx;

.view {
  position: relative;
  height: 100vh;
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
  display: flex;
  align-items: center;
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
  right: 7rpx;
  top: 40%;
  bottom: 40%;
  width: 5rpx;
  border-radius: 5rpx;
  background: $paper;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.rail-bar.show {
  opacity: 1;
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
  font-family: $font-latin;
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
</style>

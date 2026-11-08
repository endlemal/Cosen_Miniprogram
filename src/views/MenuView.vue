<!-- 点单：左侧弧形竖排分类（参考稿 1）+ 右侧商品卡，联动滚动 -->
<template>
  <view class="view">
    <view class="head" :style="{ paddingTop: L.statusBar + 'px' }">
      <view class="nav" :style="{ height: L.navHeight + 'px' }">
        <text class="title">点单</text>
      </view>
      <view class="store">
        <view class="store-l" hover-class="tap-on" @tap="showStore">
          <view class="pin">
            <Icon name="pin" :size="30" color="#FAFBF7" :stroke="2.2" />
          </view>
          <view class="store-txt">
            <view class="store-name-row">
              <text class="store-name">{{ STORE.name }}</text>
              <Icon name="down" :size="26" color="#566156" :stroke="2.4" />
            </view>
            <text class="store-sub">距你 {{ STORE.distance }}，营业到 21:30</text>
          </view>
        </view>
        <view class="seg">
          <view class="seg-i" :class="{ on: state.mode === 'pickup' }" @tap="state.mode = 'pickup'">
            <text class="seg-t">自取</text>
          </view>
          <view class="seg-i" :class="{ on: state.mode === 'delivery' }" @tap="state.mode = 'delivery'">
            <text class="seg-t">外送</text>
          </view>
        </view>
      </view>
    </view>

    <view class="body" :style="{ height: bodyH + 'px' }">
      <!-- 左侧分类 -->
      <scroll-view scroll-y class="rail" :style="{ height: bodyH + 'px' }" :show-scrollbar="false">
        <view
          v-for="(c, i) in CATEGORIES"
          :id="'rail-' + c.id"
          :key="c.id"
          class="rail-item"
          :class="{ on: active === c.id, first: i === 0 }"
          :style="{ zIndex: i + 1 }"
          @tap="jump(c.id)"
        >
          <view class="rail-text">
            <view class="rail-cn">
              <text v-for="(ch, k) in c.name.split('')" :key="k" class="ch">{{ ch }}</text>
            </view>
            <text class="rail-en">{{ c.en }}</text>
          </view>
          <view v-if="active === c.id" class="rail-bar" />
        </view>
        <view class="rail-tail" :class="{ on: active === lastCat }" :style="{ zIndex: CATEGORIES.length }" />
      </scroll-view>

      <!-- 右侧商品 -->
      <scroll-view
        scroll-y
        class="list"
        :style="{ height: bodyH + 'px' }"
        :scroll-into-view="intoView"
        :scroll-with-animation="true"
        @scroll="onScroll"
      >
        <view v-for="c in CATEGORIES" :id="'sec-' + c.id" :key="c.id" class="sec">
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
        <view class="list-tail" />
      </scroll-view>
    </view>

    <!-- 购物车条 -->
    <view class="cartbar" :class="{ show: cartCount > 0 }">
      <view class="cb-l" hover-class="tap-on" @tap="cartOpen = true">
        <view class="cb-icon">
          <Icon name="bag" :size="40" color="#FAFBF7" :stroke="2.2" />
          <view class="cb-badge">
            <text class="cb-badge-t">{{ cartCount }}</text>
          </view>
        </view>
        <view class="cb-sum">
          <view class="cb-price">
            <text class="cb-c">¥</text>
            <text class="cb-n">{{ money(cartTotal) }}</text>
          </view>
          <text class="cb-tip">{{ state.mode === 'pickup' ? '到店自取，约 8 分钟' : '外送另付配送费 4 元' }}</text>
        </view>
      </view>
      <view class="cb-go" hover-class="tap-on" @tap="checkout">
        <text class="cb-go-t">去结算</text>
      </view>
    </view>

    <ProductSheet v-model:show="sheetOpen" :product="current" />
    <CartSheet v-model:show="cartOpen" @checkout="checkout" />
  </view>
</template>

<script setup lang="ts">
import { getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue'
import type { Product } from '@/types'
import Icon from '@/components/Icon.vue'
import ProductCard from '@/components/ProductCard.vue'
import ProductSheet from '@/components/ProductSheet.vue'
import CartSheet from '@/components/CartSheet.vue'
import { CATEGORIES, PRODUCTS, STORE, getProduct, specGroupsOf } from '@/mock/products'
import { state, cartCount, cartTotal, addToCart, qtyOfProduct, type Selection } from '@/store'
import { getLayout } from '@/utils/layout'
import { money } from '@/utils/format'

const L = getLayout()
/** 门店行高度 128rpx，换算成 px */
const bodyH = Math.floor(L.windowHeight - L.header - 128 * L.rpx)
const lastCat = CATEGORIES[CATEGORIES.length - 1].id

const byCat: Record<string, Product[]> = {}
CATEGORIES.forEach((c) => (byCat[c.id] = PRODUCTS.filter((p) => p.cat === c.id)))

const active = ref(CATEGORIES[0].id)
const intoView = ref('')
let offsets: { id: string; top: number }[] = []
let lockUntil = 0

const instance = getCurrentInstance()

function measure() {
  uni
    .createSelectorQuery()
    .in(instance?.proxy)
    .selectAll('.sec')
    .boundingClientRect((rects: any) => {
      const list = (rects || []) as { id: string; top: number }[]
      if (!list.length) return
      const base = list[0].top
      offsets = list.map((r) => ({ id: r.id.replace('sec-', ''), top: r.top - base }))
    })
    .exec()
}

onMounted(() => {
  setTimeout(measure, 350)
  consumePending()
})

function onScroll(e: any) {
  if (Date.now() < lockUntil || !offsets.length) return
  const y = e.detail.scrollTop + 60
  let cur = offsets[0].id
  for (const o of offsets) if (o.top <= y) cur = o.id
  if (cur !== active.value) active.value = cur
}

function jump(id: string) {
  active.value = id
  lockUntil = Date.now() + 600
  intoView.value = ''
  nextTick(() => (intoView.value = 'sec-' + id))
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

function checkout() {
  cartOpen.value = false
  if (!cartCount.value) return
  uni.navigateTo({ url: '/pages/checkout/index' })
}

function showStore() {
  uni.showModal({
    title: STORE.name,
    content: `${STORE.address}\n营业时间 ${STORE.hours}\n电话 ${STORE.phone}`,
    showCancel: false,
    confirmText: '知道了',
    confirmColor: '#3B5A40'
  })
}

/* ---- 从其他页面跳来时打开指定商品 ---- */
function consumePending() {
  const id = state.ui.pendingProductId
  if (!id) return
  state.ui.pendingProductId = ''
  const p = getProduct(id)
  if (!p) return
  jump(p.cat)
  setTimeout(() => open(p), 260)
}
watch(() => state.ui.pendingProductId, consumePending)
</script>

<style lang="scss" scoped>
.view {
  position: relative;
  height: 100vh;
  overflow: hidden;
}
.head {
  background: $fog;
}
.nav {
  display: flex;
  align-items: center;
  padding: 0 32rpx;
}
.title {
  font-size: 38rpx;
  font-weight: 800;
}
.store {
  height: 128rpx;
  display: flex;
  align-items: center;
  padding: 0 28rpx 10rpx;
}
.store-l {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}
.pin {
  width: 72rpx;
  height: 72rpx;
  border-radius: 26rpx;
  background: $forest;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.store-txt {
  margin-left: 18rpx;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.store-name-row {
  display: flex;
  align-items: center;
}
.store-name {
  font-size: 30rpx;
  font-weight: 700;
  margin-right: 6rpx;
}
.store-sub {
  font-size: 22rpx;
  color: $ink-3;
}
.seg {
  display: flex;
  padding: 6rpx;
  border-radius: 26rpx;
  background: $mist;
}
.seg-i {
  height: 64rpx;
  padding: 0 26rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  transition: background 0.2s ease;
  &.on {
    background: $forest;
  }
}
.seg-t {
  font-size: 25rpx;
  font-weight: 700;
  color: $ink-2;
}
.seg-i.on .seg-t {
  color: $paper;
}

.body {
  display: flex;
}

/* ---------- 弧形竖排分类 ---------- */
.rail {
  width: 116rpx;
  flex-shrink: 0;
}
.rail-item {
  position: relative;
  height: 250rpx;
  margin-top: -58rpx;
  border-top-right-radius: 116rpx;
  background: $forest;
  box-shadow: 0 -14rpx 22rpx -8rpx rgba(20, 34, 24, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 36rpx;
  transition: background 0.25s ease;
  &.first {
    margin-top: 0;
  }
  &.on {
    background: $sage;
  }
}
.rail-text {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.rail-cn {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.ch {
  font-size: 28rpx;
  line-height: 1.22;
  font-weight: 700;
  color: rgba(250, 251, 247, 0.92);
}
.rail-en {
  writing-mode: vertical-rl;
  margin-left: 6rpx;
  font-size: 18rpx;
  color: rgba(197, 210, 176, 0.75);
  font-family: $font-latin;
  letter-spacing: 1rpx;
}
.rail-item.on .ch {
  color: $pine;
}
.rail-item.on .rail-en {
  color: rgba(44, 68, 49, 0.7);
}
.rail-bar {
  position: absolute;
  right: 10rpx;
  top: 50%;
  margin-top: -18rpx;
  width: 8rpx;
  height: 72rpx;
  border-radius: 8rpx;
  background: $paper;
}
.rail-tail {
  position: relative;
  height: 900rpx;
  margin-top: -2rpx;
  background: $forest;
  &.on {
    background: $sage;
  }
}

/* ---------- 商品列表 ---------- */
.list {
  flex: 1;
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
  height: calc(env(safe-area-inset-bottom) + 360rpx);
}

/* ---------- 购物车条 ---------- */
.cartbar {
  position: fixed;
  left: 40rpx;
  right: 40rpx;
  bottom: calc(env(safe-area-inset-bottom) + 166rpx);
  height: 108rpx;
  border-radius: 38rpx;
  background: $paper;
  box-shadow: 0 24rpx 48rpx -20rpx rgba(30, 42, 33, 0.45);
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
  background: $forest;
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
  background: $sage;
  border: 3rpx solid $paper;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cb-badge-t {
  font-size: 19rpx;
  font-weight: 800;
  color: $pine;
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
.cb-tip {
  font-size: 20rpx;
  color: $ink-3;
}
.cb-go {
  height: 86rpx;
  padding: 0 44rpx;
  border-radius: 30rpx;
  background: $forest;
  display: flex;
  align-items: center;
}
.cb-go-t {
  font-size: 28rpx;
  font-weight: 700;
  color: $paper;
}
</style>

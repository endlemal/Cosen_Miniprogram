<!-- 规格选择：缺口价签、余额提示和配料标签 -->
<template>
  <Sheet :show="show" bg="#FFF9F0" max-height="92vh" @update:show="(v) => emit('update:show', v)">
    <template v-if="product">
      <scroll-view scroll-y class="body" :style="{ height: bodyHeight }">
        <view class="hero" :style="{ background: heroBg }">
          <view class="art">
            <DrinkArt :spec="product.art" :size="280" animated />
          </view>
          <Notch bg="#FFF9F0" :r="36" pad="12rpx 30rpx 20rpx 34rpx">
            <view class="tag">
              <text class="tag-c">¥</text>
              <text class="tag-n">{{ money(unitPrice) }}</text>
            </view>
          </Notch>
          <view class="band">
            <text class="band-t">储值余额可直接支付</text>
          </view>
        </view>

        <view class="title-row">
          <view class="tt">
            <text class="name">{{ product.name }}</text>
            <text class="en">{{ product.en }}</text>
          </view>
          <view class="rate">
            <Icon name="star" :size="28" color="#E7A43A" />
            <text class="rate-n">{{ product.rating.toFixed(1) }}</text>
          </view>
        </view>
        <text class="desc">{{ product.desc }}</text>
        <view class="chips">
          <text v-for="t in product.ingredients" :key="t" class="chip">{{ t }}</text>
        </view>

        <view v-for="g in groups" :key="g.key" class="group">
          <view class="g-head">
            <text class="g-name">{{ g.name }}</text>
            <text v-if="g.multi" class="g-tip">可多选</text>
          </view>
          <view class="opts">
            <view
              v-for="(o, i) in g.options"
              :key="o.label"
              class="opt"
              :class="{ on: isOn(g.key, i) }"
              hover-class="tap-on"
              @tap="pick(g.key, i, !!g.multi)"
            >
              <text class="o-label">{{ o.label }}</text>
              <text v-if="o.sub || o.price" class="o-sub">{{ o.sub || '' }}{{ o.price ? ' +¥' + o.price : '' }}</text>
            </view>
          </view>
        </view>
        <view class="spacer" />
      </scroll-view>

      <view class="foot">
        <view class="sum">
          <text v-if="summary.text" class="sum-spec">{{ summary.text }}</text>
          <view class="sum-price">
            <text class="sum-c">¥</text>
            <text class="sum-n">{{ money(unitPrice * qty) }}</text>
          </view>
        </view>
        <Stepper :value="qty" @change="(d) => (qty = Math.max(1, qty + d))" />
        <view class="cta" hover-class="tap-on" @tap="add">
          <text class="cta-t">加入购物车</text>
        </view>
      </view>
    </template>
  </Sheet>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Product } from '@/types'
import Sheet from './Sheet.vue'
import Notch from './Notch.vue'
import Icon from './Icon.vue'
import Stepper from './Stepper.vue'
import DrinkArt from './DrinkArt.vue'
import { specGroupsOf } from '@/mock/products'
import { addToCart, describeSelection, type Selection } from '@/store'
import { money } from '@/utils/format'

const props = defineProps<{ show: boolean; product: Product | null }>()
const emit = defineEmits<{ (e: 'update:show', v: boolean): void; (e: 'added'): void }>()

const bodyHeight = '64vh'
const sel = ref<Selection>({})
const qty = ref(1)

const groups = computed(() => (props.product ? specGroupsOf(props.product) : []))
const summary = computed(() => describeSelection(groups.value, sel.value))
const unitPrice = computed(() => (props.product ? props.product.price + summary.value.extra : 0))
const heroBg = computed(() =>
  props.product ? `linear-gradient(160deg, ${props.product.tile[0]} 0%, ${props.product.tile[1]} 100%)` : ''
)

watch(
  () => [props.show, props.product?.id],
  () => {
    if (!props.show) return
    const s: Selection = {}
    groups.value.forEach((g) => (s[g.key] = g.multi ? [] : 0))
    sel.value = s
    qty.value = 1
  },
  { immediate: true }
)

function isOn(key: string, i: number) {
  const v = sel.value[key]
  return Array.isArray(v) ? v.includes(i) : v === i
}

function pick(key: string, i: number, multi: boolean) {
  const next = { ...sel.value }
  if (multi) {
    const arr = [...((next[key] as number[]) || [])]
    const at = arr.indexOf(i)
    if (at >= 0) arr.splice(at, 1)
    else arr.push(i)
    next[key] = arr.sort()
  } else next[key] = i
  sel.value = next
}

function add() {
  if (!props.product) return
  addToCart(props.product, groups.value, sel.value, qty.value)
  emit('added')
  emit('update:show', false)
  uni.showToast({ title: '已加入购物车', icon: 'none', duration: 1200 })
}
</script>

<style lang="scss" scoped>
.body {
  flex-shrink: 0;
}
.hero {
  position: relative;
  margin: 24rpx 28rpx 0;
  height: 500rpx;
  border-radius: 44rpx;
  overflow: hidden;
}
.art {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 70rpx;
  display: flex;
  justify-content: center;
}
.tag {
  display: flex;
  align-items: baseline;
  color: $ink;
}
.tag-c {
  font-size: 26rpx;
  font-weight: 700;
  margin-right: 2rpx;
}
.tag-n {
  font-size: 52rpx;
  font-weight: 700;
  @include num;
}
.band {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 64rpx;
  background: $toffee;
  display: flex;
  align-items: center;
  justify-content: center;
}
.band-t {
  color: $paper;
  font-size: 23rpx;
  letter-spacing: 1rpx;
}
.title-row {
  display: flex;
  align-items: flex-end;
  padding: 34rpx 40rpx 0;
}
.tt {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.name {
  font-size: 46rpx;
  font-weight: 700;
  letter-spacing: -0.5rpx;
  line-height: 1.2;
}
.en {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: $ink-3;
  font-family: $font-latin;
}
.rate {
  display: flex;
  align-items: center;
  padding-bottom: 6rpx;
}
.rate-n {
  margin-left: 6rpx;
  font-size: 28rpx;
  font-weight: 700;
  @include num;
}
.desc {
  display: block;
  padding: 18rpx 40rpx 0;
  font-size: 26rpx;
  line-height: 1.7;
  color: $ink-2;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  padding: 20rpx 34rpx 8rpx;
}
.chip {
  margin: 0 6rpx 12rpx;
  padding: 8rpx 24rpx;
  border-radius: 999rpx;
  background: $latte;
  font-size: 22rpx;
  color: $ink-2;
}
.group {
  padding: 26rpx 40rpx 0;
}
.g-head {
  display: flex;
  align-items: baseline;
  margin-bottom: 16rpx;
}
.g-name {
  font-size: 28rpx;
  font-weight: 700;
}
.g-tip {
  margin-left: 12rpx;
  font-size: 22rpx;
  color: $ink-3;
}
.opts {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -8rpx;
}
.opt {
  margin: 0 8rpx 16rpx;
  min-width: 140rpx;
  padding: 16rpx 26rpx;
  border-radius: 24rpx;
  background: $latte;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: background 0.18s ease;
  &.on {
    background: $espresso;
  }
}
.o-label {
  font-size: 26rpx;
  font-weight: 600;
  color: $ink;
}
.o-sub {
  margin-top: 2rpx;
  font-size: 20rpx;
  color: $ink-3;
  @include num;
}
.opt.on .o-label {
  color: $paper;
}
.opt.on .o-sub {
  color: $cream;
}
.spacer {
  height: 40rpx;
}
.foot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 22rpx 28rpx 26rpx 40rpx;
  border-top: 1rpx solid $line;
  background: $paper;
}
.sum {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  margin-right: 16rpx;
}
.sum-spec {
  font-size: 21rpx;
  color: $ink-3;
  @include ellipsis(1);
}
.sum-price {
  display: flex;
  align-items: baseline;
}
.sum-c {
  font-size: 24rpx;
  font-weight: 700;
}
.sum-n {
  font-size: 44rpx;
  font-weight: 800;
  @include num;
}
.cta {
  margin-left: 22rpx;
  height: 92rpx;
  padding: 0 40rpx;
  border-radius: 30rpx;
  background: $espresso;
  display: flex;
  align-items: center;
  box-shadow: $shadow-coffee;
}
.cta-t {
  color: $paper;
  font-size: 28rpx;
  font-weight: 700;
}
</style>

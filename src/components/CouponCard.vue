<!-- 礼品券：左侧面额票根 + 打孔分割线 + 右侧说明。商家发放的来源写在券面上 -->
<template>
  <view class="coupon" :class="[mode, { selected }]" @tap="onTap">
    <view class="stub" :class="'t-' + coupon.type">
      <view class="face">
        <text v-if="face.prefix" class="f-pre">{{ face.prefix }}</text>
        <text class="f-val">{{ face.value }}</text>
        <text v-if="!face.prefix" class="f-unit">{{ face.unit }}</text>
      </view>
      <text class="f-rule">{{ shortRule }}</text>
    </view>
    <view class="seam">
      <view class="hole top" :style="{ background: holeBg }" />
      <view class="dash" />
      <view class="hole bottom" :style="{ background: holeBg }" />
    </view>
    <view class="body">
      <view class="b-top">
        <text class="title">{{ coupon.title }}</text>
      </view>
      <view class="issuer">
        <Icon name="gift" :size="24" :color="mode === 'available' ? '#6E8B3D' : '#97A094'" />
        <text class="issuer-t">{{ coupon.issuer }} 发放</text>
      </view>
      <text class="reason">{{ reason || coupon.reason }}</text>
      <view class="b-foot">
        <text class="until">{{ untilText }}</text>
        <view v-if="selectable" class="radio" :class="{ on: selected }">
          <Icon v-if="selected" name="check" :size="26" color="#FAFBF7" :stroke="3" />
        </view>
        <view v-else-if="mode === 'available'" class="use" hover-class="tap-on" @tap.stop="emit('use')">
          <text class="use-t">去使用</text>
        </view>
      </view>
    </view>
    <view v-if="mode === 'used' || mode === 'expired'" class="stamp">
      <text class="stamp-t">{{ mode === 'used' ? '已使用' : '已过期' }}</text>
    </view>
    <Notch v-if="coupon.isNew && mode === 'available'" :bg="holeBg" :r="20" pad="4rpx 18rpx 8rpx 20rpx">
      <text class="new">新到</text>
    </Notch>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Coupon } from '@/types'
import Icon from './Icon.vue'
import Notch from './Notch.vue'
import { couponFace } from '@/store'
import { md } from '@/utils/format'

const props = withDefaults(
  defineProps<{
    coupon: Coupon
    mode?: 'available' | 'used' | 'expired' | 'unusable'
    reason?: string
    selectable?: boolean
    selected?: boolean
    holeBg?: string
  }>(),
  { mode: 'available', reason: '', selectable: false, selected: false, holeBg: '#EEF0EA' }
)
const emit = defineEmits<{ (e: 'use'): void; (e: 'select'): void }>()

const face = computed(() => couponFace(props.coupon))
const shortRule = computed(() => {
  const c = props.coupon
  if (c.type === 'gift') return `${c.value} 元内任选`
  if (c.type === 'discount') return c.maxOff ? `最多减 ${c.maxOff}` : '全单可用'
  return c.threshold ? `满 ${c.threshold} 可用` : '无门槛'
})
const untilText = computed(() => {
  const c = props.coupon
  if (props.mode === 'used' && c.usedAt) return `${md(c.usedAt)} 已使用`
  if (props.mode === 'expired') return `${md(c.endAt)} 已过期`
  const days = Math.ceil((c.endAt - Date.now()) / 86400000)
  return days <= 3 ? `${days} 天后到期` : `${md(c.endAt)} 前有效`
})

function onTap() {
  if (props.selectable && props.mode === 'available') emit('select')
}
</script>

<style lang="scss" scoped>
.coupon {
  position: relative;
  display: flex;
  height: 236rpx;
  border-radius: 32rpx;
  background: $paper;
  overflow: hidden;
  margin-bottom: 24rpx;
  box-shadow: $shadow-soft;
  border: 3rpx solid transparent;
  &.selected {
    border-color: $forest;
  }
}
.stub {
  width: 196rpx;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: $forest;
  color: $paper;
  &.t-discount {
    background: $matcha;
  }
  &.t-gift {
    background: $sage;
    color: $pine;
  }
}
.unusable .stub,
.used .stub,
.expired .stub {
  background: #c9cec4;
  color: $paper;
}
.face {
  display: flex;
  align-items: baseline;
}
.f-pre {
  font-size: 30rpx;
  font-weight: 700;
  margin-right: 2rpx;
}
.f-val {
  font-size: 76rpx;
  font-weight: 800;
  line-height: 1;
  @include num;
}
.f-unit {
  margin-left: 4rpx;
  font-size: 26rpx;
  font-weight: 700;
}
.f-rule {
  margin-top: 12rpx;
  font-size: 21rpx;
  opacity: 0.9;
}
.seam {
  position: relative;
  width: 0;
}
.hole {
  position: absolute;
  left: -18rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  z-index: 2;
  &.top {
    top: -18rpx;
  }
  &.bottom {
    bottom: -18rpx;
  }
}
.dash {
  position: absolute;
  top: 26rpx;
  bottom: 26rpx;
  left: -1rpx;
  border-left: 2rpx dashed rgba(30, 42, 33, 0.14);
}
.body {
  flex: 1;
  min-width: 0;
  padding: 26rpx 28rpx 22rpx 34rpx;
  display: flex;
  flex-direction: column;
}
.title {
  font-size: 30rpx;
  line-height: 1.3;
  font-weight: 700;
}
.issuer {
  margin-top: 8rpx;
  display: flex;
  align-items: center;
}
.issuer-t {
  margin-left: 8rpx;
  font-size: 22rpx;
  color: $matcha;
  font-weight: 600;
}
.used .issuer-t,
.expired .issuer-t,
.unusable .issuer-t {
  color: $ink-3;
}
.reason {
  margin-top: 2rpx;
  font-size: 22rpx;
  line-height: 1.5;
  color: $ink-3;
  @include ellipsis(1);
}
.unusable .reason {
  color: $danger;
}
.b-foot {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.until {
  font-size: 21rpx;
  color: $ink-3;
}
.use {
  height: 56rpx;
  padding: 0 26rpx;
  border-radius: 20rpx;
  background: $forest;
  display: flex;
  align-items: center;
}
.use-t {
  font-size: 23rpx;
  font-weight: 700;
  color: $paper;
}
.radio {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 3rpx solid rgba(30, 42, 33, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  &.on {
    background: $forest;
    border-color: $forest;
  }
}
.unusable .title,
.used .title,
.expired .title {
  color: $ink-2;
}
.stamp {
  position: absolute;
  right: 26rpx;
  top: 34rpx;
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  border: 3rpx solid rgba(151, 160, 148, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(-18deg);
}
.stamp-t {
  font-size: 24rpx;
  font-weight: 700;
  color: rgba(151, 160, 148, 0.85);
  letter-spacing: 2rpx;
}
.new {
  font-size: 20rpx;
  font-weight: 700;
  color: $forest;
}
</style>

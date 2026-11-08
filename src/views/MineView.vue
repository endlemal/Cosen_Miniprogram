<!-- 我的：会员储值卡、充值入口、礼品券、订单 -->
<template>
  <view class="view">
    <view class="topbar" :class="{ solid: scrolled }" :style="{ height: L.header + 'px', paddingTop: L.statusBar + 'px' }">
      <view class="tb-row" :style="{ height: L.navHeight + 'px' }">
        <text class="tb-title" :style="{ opacity: scrolled ? 1 : 0 }">我的</text>
      </view>
    </view>

    <scroll-view scroll-y class="scroll" @scroll="onScroll">
      <view :style="{ height: L.header + 'px' }" />

      <!-- 个人信息 -->
      <view class="me">
        <view class="avatar">
          <text class="avatar-t">{{ USER.name.slice(0, 1) }}</text>
        </view>
        <view class="me-info">
          <text class="me-name">{{ USER.name }}</text>
          <view class="me-row">
            <view class="level">
              <Icon name="crown" :size="22" color="#2C4431" :stroke="2.2" />
              <text class="level-t">{{ memberLevel.name }}</text>
            </view>
            <text class="me-phone">{{ USER.phone }}</text>
          </view>
        </view>
      </view>

      <!-- 储值卡 -->
      <view class="card">
        <view class="orb o1" />
        <view class="orb o2" />
        <view class="orb o3" />
        <text class="card-l">储值余额</text>
        <view class="bal">
          <text class="bal-c">¥</text>
          <text class="bal-n">{{ money2(state.balance) }}</text>
        </view>
        <text class="card-sub">累计充值 {{ state.rechargeTotal }} 元，已获赠 {{ state.bonusTotal }} 元</text>
        <view class="card-foot">
          <view class="stat" hover-class="tap-on" @tap="toast('积分商城下个月开放')">
            <text class="stat-n">{{ thousands(state.points) }}</text>
            <text class="stat-l">积分</text>
          </view>
          <view class="stat" hover-class="tap-on" @tap="go('/pages/coupons/index')">
            <text class="stat-n">{{ availableCouponCount }}</text>
            <text class="stat-l">礼品券</text>
          </view>
          <view class="topup" hover-class="tap-on" @tap="go('/pages/recharge/index')">
            <Icon name="plus" :size="28" color="#2C4431" :stroke="2.8" />
            <text class="topup-t">充值</text>
          </view>
        </view>
      </view>

      <!-- 储值档位 -->
      <view class="tiers">
        <view
          v-for="(t, i) in RECHARGE_TIERS"
          :key="t.amount"
          class="tier"
          :class="{ hot: t.hot }"
          hover-class="tap-on"
          @tap="go('/pages/recharge/index?tier=' + i)"
        >
          <view class="tier-l">
            <text class="tier-k">充 {{ t.amount }}</text>
            <text class="tier-s">到账 {{ t.amount + t.bonus }}</text>
          </view>
          <view class="tier-r">
            <text class="tier-plus">送</text>
            <text class="tier-n">{{ t.bonus }}</text>
          </view>
        </view>
      </view>

      <!-- 商家礼赠提醒 -->
      <view v-if="newest" class="gift" hover-class="tap-on" @tap="go('/pages/coupons/index')">
        <view class="gift-ic">
          <Icon name="gift" :size="36" color="#FAFBF7" :stroke="2.1" />
        </view>
        <view class="gift-txt">
          <text class="gift-t">{{ newest.issuer }}送你一张「{{ newest.title }}」</text>
          <text class="gift-s">{{ newest.reason }}，{{ newCouponCount > 1 ? '还有 ' + (newCouponCount - 1) + ' 张新券待查看' : '点开查看' }}</text>
        </view>
        <Icon name="right" :size="30" color="#97A094" />
      </view>

      <!-- 快捷入口 -->
      <view class="grid">
        <view class="cell" hover-class="tap-on" @tap="go('/pages/coupons/index')">
          <view class="cell-ic">
            <Icon name="ticket" :size="40" color="#3B5A40" />
            <view v-if="newCouponCount" class="cell-dot" />
          </view>
          <text class="cell-t">礼品券</text>
        </view>
        <view class="cell" hover-class="tap-on" @tap="go('/pages/recharge/index')">
          <view class="cell-ic">
            <Icon name="wallet" :size="40" color="#3B5A40" />
          </view>
          <text class="cell-t">会员储值</text>
        </view>
        <view class="cell" hover-class="tap-on" @tap="toMenu">
          <view class="cell-ic">
            <Icon name="bag" :size="40" color="#3B5A40" />
          </view>
          <text class="cell-t">继续点单</text>
        </view>
        <view class="cell" hover-class="tap-on" @tap="showStore">
          <view class="cell-ic">
            <Icon name="store" :size="40" color="#3B5A40" />
          </view>
          <text class="cell-t">门店信息</text>
        </view>
      </view>

      <!-- 最近订单 -->
      <view class="sec-head">
        <text class="sec-t">最近订单</text>
        <text class="sec-s">共 {{ state.orders.length }} 单</text>
      </view>
      <view v-if="!state.orders.length" class="empty">
        <text class="empty-t">还没有订单，去点一杯吧</text>
      </view>
      <view
        v-for="o in recent"
        :key="o.id"
        class="order"
        hover-class="tap-on"
        @tap="go('/pages/order/index?id=' + o.id)"
      >
        <view class="o-arts">
          <view
            v-for="(it, k) in o.items.slice(0, 2)"
            :key="it.key"
            class="o-thumb"
            :style="{ background: 'linear-gradient(160deg,' + it.tile[0] + ',' + it.tile[1] + ')', marginLeft: k ? '-28rpx' : '0' }"
          >
            <DrinkArt :spec="it.art" :size="60" />
          </view>
        </view>
        <view class="o-info">
          <view class="o-top">
            <text class="o-code">{{ o.code }}</text>
            <text class="o-stage" :class="{ live: orderStage(o, now).step < 3 }">{{ orderStage(o, now).label }}</text>
          </view>
          <text class="o-items">{{ itemsText(o) }}</text>
          <text class="o-time">{{ ago(o.createdAt, now) }}，{{ o.mode === 'pickup' ? '到店自取' : '外送' }}</text>
        </view>
        <text class="o-total">¥{{ money(o.total) }}</text>
      </view>

      <view class="reset" hover-class="tap-on" @tap="onReset">
        <Icon name="refresh" :size="24" color="#97A094" />
        <text class="reset-t">重置演示数据</text>
      </view>
      <text class="foot">苔生 Mossy，页面中的商品、订单与支付均为 Mock 数据</text>
      <view class="tail" />
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import type { Order } from '@/types'
import Icon from '@/components/Icon.vue'
import DrinkArt from '@/components/DrinkArt.vue'
import { STORE } from '@/mock/products'
import { RECHARGE_TIERS, USER } from '@/mock/seed'
import {
  state,
  memberLevel,
  availableCouponCount,
  newCouponCount,
  couponState,
  orderStage,
  resetDemo,
  switchTab
} from '@/store'
import { getLayout } from '@/utils/layout'
import { ago, money, money2 } from '@/utils/format'

const L = getLayout()
const scrolled = ref(false)
const now = ref(Date.now())
const timer = setInterval(() => (now.value = Date.now()), 5000)
onUnmounted(() => clearInterval(timer))

const recent = computed(() => state.orders.slice(0, 4))
const newest = computed(() => state.coupons.find((c) => c.isNew && couponState(c) === 'available'))

function onScroll(e: any) {
  const next = e.detail.scrollTop > 40
  if (next !== scrolled.value) scrolled.value = next
}
function itemsText(o: Order) {
  return o.items.map((i) => i.name + (i.qty > 1 ? ' ×' + i.qty : '')).join('，')
}
function thousands(n: number) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
function go(url: string) {
  uni.navigateTo({ url })
}
function toMenu() {
  switchTab('menu')
}
function toast(title: string) {
  uni.showToast({ title, icon: 'none' })
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
function onReset() {
  uni.showModal({
    title: '重置演示数据？',
    content: '余额、礼品券、订单和购物车会恢复到初始状态',
    confirmText: '重置',
    confirmColor: '#3B5A40',
    success: (r) => {
      if (r.confirm) {
        resetDemo()
        uni.showToast({ title: '已重置', icon: 'none' })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.view {
  position: relative;
  height: 100vh;
}
.topbar {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  z-index: 20;
  transition: background 0.2s ease;
  &.solid {
    background: rgba(238, 240, 234, 0.94);
    box-shadow: 0 1rpx 0 $line;
  }
}
.tb-row {
  display: flex;
  align-items: center;
  padding: 0 32rpx;
}
.tb-title {
  font-size: 34rpx;
  font-weight: 700;
  transition: opacity 0.2s ease;
}
.scroll {
  height: 100vh;
}

/* ---------- 个人信息 ---------- */
.me {
  display: flex;
  align-items: center;
  padding: 20rpx 36rpx 0;
}
.avatar {
  width: 112rpx;
  height: 112rpx;
  border-radius: 40rpx;
  background: linear-gradient(140deg, $sage 0%, $moss 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-t {
  font-size: 52rpx;
  font-weight: 800;
  color: $paper;
  font-family: $font-latin;
}
.me-info {
  margin-left: 26rpx;
  display: flex;
  flex-direction: column;
}
.me-name {
  font-size: 44rpx;
  font-weight: 800;
  letter-spacing: -0.5rpx;
}
.me-row {
  margin-top: 6rpx;
  display: flex;
  align-items: center;
}
.level {
  height: 42rpx;
  padding: 0 16rpx 0 12rpx;
  border-radius: 14rpx;
  background: $sage;
  display: flex;
  align-items: center;
}
.level-t {
  margin-left: 6rpx;
  font-size: 21rpx;
  font-weight: 700;
  color: $pine;
}
.me-phone {
  margin-left: 16rpx;
  font-size: 23rpx;
  color: $ink-3;
  @include num;
}

/* ---------- 储值卡 ---------- */
.card {
  position: relative;
  margin: 40rpx 28rpx 0;
  height: 400rpx;
  border-radius: 56rpx;
  background: $forest;
  padding: 44rpx 44rpx 0;
  overflow: hidden;
  box-shadow: $shadow-forest;
  display: flex;
  flex-direction: column;
}
.orb {
  position: absolute;
  border-radius: 50%;
}
.o1 {
  width: 300rpx;
  height: 300rpx;
  top: -120rpx;
  right: -80rpx;
  background: $moss;
}
.o2 {
  width: 200rpx;
  height: 200rpx;
  top: -40rpx;
  right: 120rpx;
  background: rgba(163, 180, 139, 0.55);
}
.o3 {
  width: 130rpx;
  height: 130rpx;
  top: -10rpx;
  right: 40rpx;
  background: $forest;
  box-shadow: -8rpx 14rpx 26rpx rgba(20, 34, 24, 0.35);
}
.card-l {
  position: relative;
  font-size: 24rpx;
  color: $sage-soft;
}
.bal {
  position: relative;
  margin-top: 6rpx;
  display: flex;
  align-items: baseline;
  color: $paper;
}
.bal-c {
  font-size: 36rpx;
  font-weight: 700;
  margin-right: 6rpx;
}
.bal-n {
  font-size: 84rpx;
  font-weight: 800;
  line-height: 1.05;
  @include num;
  letter-spacing: -2rpx;
}
.card-sub {
  position: relative;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: rgba(250, 251, 247, 0.7);
}
.card-foot {
  position: absolute;
  left: 44rpx;
  right: 28rpx;
  bottom: 30rpx;
  display: flex;
  align-items: center;
}
.stat {
  margin-right: 48rpx;
  display: flex;
  flex-direction: column;
}
.stat-n {
  font-size: 34rpx;
  font-weight: 800;
  color: $paper;
  @include num;
}
.stat-l {
  font-size: 21rpx;
  color: $sage-soft;
}
.topup {
  margin-left: auto;
  height: 80rpx;
  padding: 0 36rpx 0 28rpx;
  border-radius: 28rpx;
  background: $sage;
  display: flex;
  align-items: center;
}
.topup-t {
  margin-left: 8rpx;
  font-size: 28rpx;
  font-weight: 800;
  color: $pine;
}

/* ---------- 储值档位 ---------- */
.tiers {
  display: flex;
  justify-content: space-between;
  padding: 22rpx 28rpx 0;
}
.tier {
  position: relative;
  width: 338rpx;
  height: 132rpx;
  border-radius: 36rpx;
  background: $paper;
  box-shadow: $shadow-soft;
  padding: 0 30rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
}
.tier.hot {
  background: $sage;
}
.tier-l {
  display: flex;
  flex-direction: column;
}
.tier-k {
  font-size: 28rpx;
  font-weight: 700;
  color: $ink;
}
.tier-s {
  font-size: 21rpx;
  color: $ink-3;
}
.tier.hot .tier-s {
  color: rgba(44, 68, 49, 0.7);
}
.tier.hot .tier-r {
  color: $pine;
}
.tier-r {
  display: flex;
  align-items: baseline;
  color: $matcha;
}
.tier-plus {
  font-size: 24rpx;
  font-weight: 700;
  margin-right: 4rpx;
}
.tier-n {
  font-size: 56rpx;
  font-weight: 800;
  @include num;
}

/* ---------- 礼赠提醒 ---------- */
.gift {
  margin: 22rpx 28rpx 0;
  padding: 22rpx 24rpx;
  border-radius: 36rpx;
  background: $mist;
  display: flex;
  align-items: center;
}
.gift-ic {
  width: 76rpx;
  height: 76rpx;
  border-radius: 26rpx;
  background: $matcha;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.gift-txt {
  flex: 1;
  min-width: 0;
  margin: 0 16rpx 0 20rpx;
  display: flex;
  flex-direction: column;
}
.gift-t {
  font-size: 26rpx;
  font-weight: 700;
  @include ellipsis(1);
}
.gift-s {
  font-size: 22rpx;
  color: $ink-2;
  @include ellipsis(1);
}

/* ---------- 宫格 ---------- */
.grid {
  margin: 22rpx 28rpx 0;
  padding: 30rpx 10rpx;
  border-radius: 40rpx;
  background: $paper;
  box-shadow: $shadow-soft;
  display: flex;
}
.cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cell-ic {
  position: relative;
  width: 88rpx;
  height: 88rpx;
  border-radius: 30rpx;
  background: $mist;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cell-dot {
  position: absolute;
  top: 10rpx;
  right: 12rpx;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #d9483b;
  border: 3rpx solid $mist;
}
.cell-t {
  margin-top: 12rpx;
  font-size: 23rpx;
  color: $ink-2;
}

/* ---------- 订单 ---------- */
.sec-head {
  display: flex;
  align-items: baseline;
  padding: 52rpx 36rpx 18rpx;
}
.sec-t {
  font-size: 34rpx;
  font-weight: 800;
}
.sec-s {
  margin-left: 14rpx;
  font-size: 23rpx;
  color: $ink-3;
}
.empty {
  margin: 0 28rpx;
  padding: 50rpx 0;
  border-radius: 36rpx;
  background: $paper;
  text-align: center;
}
.empty-t {
  font-size: 25rpx;
  color: $ink-3;
}
.order {
  margin: 0 28rpx 18rpx;
  padding: 22rpx 28rpx 22rpx 22rpx;
  border-radius: 36rpx;
  background: $paper;
  display: flex;
  align-items: center;
}
.o-arts {
  display: flex;
  width: 140rpx;
  flex-shrink: 0;
}
.o-thumb {
  width: 92rpx;
  height: 104rpx;
  border-radius: 26rpx;
  border: 4rpx solid $paper;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
}
.o-info {
  flex: 1;
  min-width: 0;
  margin: 0 16rpx 0 8rpx;
  display: flex;
  flex-direction: column;
}
.o-top {
  display: flex;
  align-items: center;
}
.o-code {
  font-size: 30rpx;
  font-weight: 800;
  @include num;
}
.o-stage {
  margin-left: 12rpx;
  padding: 2rpx 12rpx;
  border-radius: 10rpx;
  font-size: 19rpx;
  color: $ink-3;
  background: $fog;
  &.live {
    color: $paper;
    background: $matcha;
  }
}
.o-items {
  margin-top: 4rpx;
  font-size: 23rpx;
  color: $ink-2;
  @include ellipsis(1);
}
.o-time {
  font-size: 21rpx;
  color: $ink-3;
}
.o-total {
  font-size: 32rpx;
  font-weight: 800;
  @include num;
}
.reset {
  margin: 40rpx auto 0;
  width: 260rpx;
  height: 64rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.reset-t {
  margin-left: 8rpx;
  font-size: 23rpx;
  color: $ink-3;
}
.foot {
  display: block;
  text-align: center;
  margin-top: 8rpx;
  font-size: 20rpx;
  color: rgba(151, 160, 148, 0.8);
}
.tail {
  height: calc(env(safe-area-inset-bottom) + 220rpx);
}
</style>

<template>
  <view class="view">
    <view class="topbar" :style="{ paddingTop: L.statusBar + L.topGap + 'px' }">
      <view class="nav" :style="{ height: L.navHeight + 'px', paddingRight: L.capsule ? L.capsule + 'px' : '32rpx' }">
        <view class="wordmark">
          <text class="brand">可森</text>
          <text class="brand-en">COSEN</text>
        </view>
        <view class="bell" hover-class="tap-on" @tap="toCoupons">
          <Icon name="bell" :size="34" color="#462719" :stroke="2.1" />
          <text v-if="newCouponCount > 0" class="bell-dot">{{ newCouponCount }}</text>
        </view>
      </view>
    </view>

    <scroll-view
      scroll-y
      class="scroll"
      :lower-threshold="240"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      refresher-background="#F8F0E3"
      @scrolltolower="loadMore"
      @refresherrefresh="onRefresh"
    >
      <view class="content">
        <view class="intro">
          <image class="intro-pattern" src="/static/coffee-splash.svg" mode="aspectFill" />
          <view class="issue">
            <text class="issue-name">COSEN JOURNAL</text>
            <text class="issue-date">{{ dateText }}</text>
          </view>
          <text class="title">可森手记</text>
          <view class="greeting">
            <text>{{ hi }}，{{ USER.name }}。</text>
            <text>从白天的咖啡，到夜里的小酌。</text>
          </view>
        </view>

        <view class="today" hover-class="tap-on" @tap="openToday">
          <view class="today-art">
            <DrinkArt :spec="today.art" :size="54" />
          </view>
          <view class="today-info">
            <text class="today-label">今日推荐</text>
            <text class="today-name">{{ today.name }}</text>
          </view>
          <view class="today-cta">
            <text>去点单</text>
            <Icon name="arrow" :size="24" color="#FFF9F0" :stroke="2.2" />
          </view>
        </view>

        <view class="feed-head">
          <text class="feed-title">店里动态</text>
          <text class="feed-sub">店长和咖啡师的日常</text>
        </view>

        <view
          v-for="(p, i) in posts"
          :key="p.id"
          class="post"
          :class="{ featured: i === 0 }"
          hover-class="tap-on"
          @tap="openPost(p)"
        >
          <view class="post-cover">
            <CoverArt
              :cover="p.cover"
              :width="i === 0 ? 686 : 136"
              :fixed-height="i === 0 ? 326 : 136"
              :radius="0"
            />
            <text v-if="i === 0" class="featured-label">最新动态</text>
          </view>
          <view class="post-info">
            <text class="post-title">{{ p.title }}</text>
            <text v-if="i === 0" class="post-excerpt">{{ p.content[0] }}</text>
            <view class="post-meta">
              <text class="byline">{{ p.author }} · {{ ago(p.at) }}</text>
              <view class="like" @tap.stop="toggleLike(p.id)">
                <Icon
                  :name="state.likes[p.id] ? 'heartFill' : 'heart'"
                  :size="28"
                  :color="state.likes[p.id] ? '#B9543F' : '#6D513D'"
                />
                <text class="like-count">{{ p.likes + (state.likes[p.id] ? 1 : 0) }}</text>
              </view>
            </view>
          </view>
        </view>

        <text class="more">{{ loading ? '正在加载…' : hasMore ? '继续上滑，看看往期' : '已经看完了，明天见' }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Post } from '@/types'
import Icon from '@/components/Icon.vue'
import CoverArt from '@/components/CoverArt.vue'
import DrinkArt from '@/components/DrinkArt.vue'
import { fetchPosts } from '@/mock/posts'
import { getProduct } from '@/mock/products'
import { USER } from '@/mock/seed'
import { state, newCouponCount, switchTab } from '@/store'
import { getLayout } from '@/utils/layout'
import { ago, greeting, md, weekday } from '@/utils/format'

const L = getLayout()
const hi = greeting()
const dateText = `${md(Date.now())} ${weekday()}`
const today = getProduct('s1')!

const first = fetchPosts(0)
const posts = ref(first.list)
const hasMore = ref(first.hasMore)
const refreshing = ref(false)
const loading = ref(false)
let page = 0

function loadMore() {
  if (loading.value || refreshing.value || !hasMore.value) return
  loading.value = true
  setTimeout(() => {
    if (!refreshing.value) {
      const next = fetchPosts(++page)
      posts.value = posts.value.concat(next.list)
      hasMore.value = next.hasMore
    }
    loading.value = false
  }, 600)
}

function onRefresh() {
  if (refreshing.value) return
  refreshing.value = true
  setTimeout(() => {
    page = 0
    const next = fetchPosts(page)
    posts.value = next.list
    hasMore.value = next.hasMore
    refreshing.value = false
  }, 800)
}

function toggleLike(id: string) {
  state.likes[id] = !state.likes[id]
}

function openPost(p: Post) {
  uni.navigateTo({ url: `/pages/post/index?id=${encodeURIComponent(p.id)}` })
}
function openToday() {
  state.ui.pendingProductId = today.id
  switchTab('menu')
}
function toCoupons() {
  uni.navigateTo({ url: '/pages/coupons/index' })
}
</script>

<style lang="scss" scoped>
.view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $canvas;
}
.topbar {
  flex-shrink: 0;
  border-bottom: 1rpx solid $line;
}
.nav,
.wordmark {
  display: flex;
  align-items: center;
}
.nav {
  justify-content: space-between;
  padding-left: 32rpx;
}
.brand {
  font-size: 34rpx;
  font-weight: 800;
  letter-spacing: 3rpx;
  color: $espresso;
}
.brand-en {
  margin-left: 14rpx;
  font-family: $font-latin;
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 3rpx;
  color: $ink-2;
}
.bell {
  position: relative;
  width: 62rpx;
  height: 62rpx;
  border-radius: 50%;
  background: $latte;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bell-dot {
  position: absolute;
  top: -3rpx;
  right: -4rpx;
  min-width: 29rpx;
  height: 29rpx;
  padding: 0 5rpx;
  border-radius: 15rpx;
  background: $danger;
  color: #fff;
  font-size: 18rpx;
  font-weight: 700;
  line-height: 29rpx;
  text-align: center;
  @include num;
}
.scroll {
  flex: 1;
  height: 0;
  min-height: 0;
}
.content {
  padding: 24rpx 32rpx calc(env(safe-area-inset-bottom) + 164rpx);
}
.intro {
  position: relative;
  padding: 28rpx 32rpx 34rpx;
  border-radius: 40rpx;
  overflow: hidden;
  background: $latte;
}
.intro-pattern {
  position: absolute;
  top: 0;
  right: 0;
  width: 46%;
  height: 100%;
  opacity: 0.54;
}
.issue,
.title,
.greeting {
  position: relative;
}
.issue {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  color: $espresso;
}
.issue-name {
  font-family: $font-latin;
  font-size: 20rpx;
  font-weight: 800;
  letter-spacing: 4rpx;
}
.issue-date {
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  background: $paper;
  font-size: 22rpx;
  color: $ink-2;
}
.title {
  display: block;
  margin-top: 10rpx;
  color: $roast;
  font-family: $font-display;
  font-size: 72rpx;
  font-weight: 800;
  line-height: 1.22;
  letter-spacing: 3rpx;
}
.greeting {
  display: flex;
  flex-direction: column;
  width: 76%;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: $ink-2;
}
.today {
  display: flex;
  align-items: center;
  margin-top: 28rpx;
  padding: 12rpx 22rpx 12rpx 12rpx;
  border-radius: 26rpx;
  background: $roast;
  color: $paper;
}
.today-art {
  display: flex;
  flex: 0 0 76rpx;
  height: 76rpx;
  align-items: flex-end;
  justify-content: center;
  border-radius: 16rpx;
  background: $caramel;
  overflow: hidden;
}
.today-info {
  flex: 1;
  min-width: 0;
  margin: 0 18rpx;
}
.today-label {
  display: block;
  font-size: 20rpx;
  color: $cream;
}
.today-name {
  display: block;
  font-size: 27rpx;
  font-weight: 700;
  @include ellipsis;
}
.today-cta {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8rpx;
  font-size: 23rpx;
}
.feed-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12rpx;
  margin: 38rpx 0 18rpx;
}
.feed-title {
  color: $ink;
  font-size: 34rpx;
  font-weight: 800;
}
.feed-sub {
  color: $ink-2;
  font-size: 22rpx;
}
.post {
  display: flex;
  align-items: center;
  gap: 22rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid $line;
}
.post-cover {
  position: relative;
  width: 136rpx;
  flex-shrink: 0;
  border-radius: 18rpx;
  overflow: hidden;
}
.post-info {
  flex: 1;
  min-width: 0;
}
.post-title {
  display: block;
  color: $ink;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 1.4;
  @include ellipsis(2);
}
.post-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
  margin-top: 6rpx;
  color: $ink-2;
}
.byline {
  min-width: 0;
  font-size: 22rpx;
  @include ellipsis;
}
.like {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  gap: 8rpx;
  min-height: 60rpx;
  min-width: 76rpx;
}
.like-count {
  font-size: 22rpx;
  @include num;
}
.featured {
  display: block;
  margin-bottom: 10rpx;
  padding: 0;
  border: 0;
  border-radius: 30rpx;
  overflow: hidden;
  background: $paper;
  box-shadow: $shadow-soft;
}
.featured .post-cover {
  width: 100%;
  border-radius: 0;
}
.featured-label {
  position: absolute;
  top: 20rpx;
  left: 20rpx;
  padding: 8rpx 18rpx;
  border-radius: 10rpx;
  background: $roast;
  color: $paper;
  font-size: 22rpx;
  font-weight: 700;
}
.featured .post-info {
  padding: 22rpx 24rpx 10rpx;
}
.featured .post-title {
  font-size: 35rpx;
  font-weight: 800;
}
.post-excerpt {
  display: block;
  margin-top: 8rpx;
  color: $ink-2;
  font-size: 24rpx;
  @include ellipsis;
}
.more {
  display: block;
  padding: 28rpx 0 0;
  text-align: center;
  font-size: 22rpx;
  color: $ink-2;
}
</style>

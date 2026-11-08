<!-- 广场：问候卡（参考稿 1）+ 商家日常分享的瀑布流 -->
<template>
  <view class="view">
    <view class="topbar" :class="{ solid: scrolled }" :style="{ height: L.header + 'px', paddingTop: L.statusBar + 'px' }">
      <view class="tb-row" :style="{ height: L.navHeight + 'px' }">
        <text class="brand">苔生</text>
        <text class="brand-en">Mossy Matcha Coffee</text>
      </view>
    </view>

    <scroll-view
      scroll-y
      class="scroll"
      :lower-threshold="400"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      refresher-background="#EEF0EA"
      @scroll="onScroll"
      @scrolltolower="loadMore"
      @refresherrefresh="onRefresh"
    >
      <view :style="{ height: L.header + 'px' }" />

      <!-- 问候卡 -->
      <view class="hello">
        <view class="orb o1" />
        <view class="orb o2" />
        <view class="orb o3" />
        <view class="bell" hover-class="tap-on" @tap="toCoupons">
          <Icon name="bell" :size="46" color="#FAFBF7" :stroke="2.2" />
          <view v-if="newCouponCount > 0" class="bell-dot">
            <text class="bell-n">{{ newCouponCount }}</text>
          </view>
        </view>
        <text class="hello-t">{{ hi }}，{{ USER.name }}</text>
        <text class="hello-s">{{ slogan }}</text>
        <view class="today" hover-class="tap-on" @tap="openToday">
          <view class="today-art">
            <DrinkArt :spec="today.art" :size="58" />
          </view>
          <view class="today-info">
            <text class="today-l">今日推荐</text>
            <text class="today-n">{{ today.name }}</text>
          </view>
          <view class="today-go">
            <Icon name="arrow" :size="28" color="#2C4431" :stroke="2.4" />
          </view>
        </view>
        <text class="hello-date">{{ dateText }}</text>
      </view>

      <!-- 筛选 -->
      <view class="sec-head">
        <text class="sec-t">店里的日常</text>
        <text class="sec-s">店长和咖啡师每天更新</text>
      </view>
      <scroll-view scroll-x class="tags" :show-scrollbar="false">
        <view class="tags-in">
          <view
            v-for="t in POST_TAGS"
            :key="t"
            class="tag"
            :class="{ on: tag === t }"
            hover-class="tap-on"
            @tap="setTag(t)"
          >
            <text class="tag-t">{{ t }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- 瀑布流 -->
      <view class="masonry">
        <view v-for="(col, ci) in columns" :key="ci" class="col">
          <view v-for="p in col" :key="p.id" class="post" hover-class="tap-on" @tap="openPost(p)">
            <view class="post-cover">
              <CoverArt :cover="p.cover" :width="COVER_W" :radius="26" />
              <Notch bg="#FAFBF7" :r="22" pad="4rpx 16rpx 8rpx 20rpx">
                <text class="post-tag">{{ p.tag }}</text>
              </Notch>
            </view>
            <text class="post-title">{{ p.title }}</text>
            <view class="post-meta">
              <view class="avatar" :style="{ background: 'linear-gradient(140deg,' + p.avatar[0] + ',' + p.avatar[1] + ')' }">
                <text class="avatar-t">{{ initial(p.author) }}</text>
              </view>
              <text class="author">{{ p.author }}</text>
              <view class="like" @tap.stop="toggleLike(p.id)">
                <Icon
                  :name="state.likes[p.id] ? 'heartFill' : 'heart'"
                  :size="26"
                  :color="state.likes[p.id] ? '#B9543F' : '#97A094'"
                />
                <text class="like-n">{{ p.likes + (state.likes[p.id] ? 1 : 0) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="more">
        <text class="more-t">{{ loading ? '正在加载…' : hasMore ? '继续上滑，看看往期' : '已经看完了，明天见' }}</text>
      </view>
      <view class="tail" />
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Post } from '@/types'
import Icon from '@/components/Icon.vue'
import Notch from '@/components/Notch.vue'
import CoverArt from '@/components/CoverArt.vue'
import DrinkArt from '@/components/DrinkArt.vue'
import { fetchPosts, POST_TAGS } from '@/mock/posts'
import { getProduct } from '@/mock/products'
import { USER } from '@/mock/seed'
import { state, newCouponCount, backToTab } from '@/store'
import { getLayout } from '@/utils/layout'
import { greeting, md, weekday } from '@/utils/format'

const L = getLayout()
/** 两列：750 - 左右边距 28*2 - 列间距 18 = 676 → 每列 338，卡片内边距 10 */
const COL_W = 338
const COVER_W = COL_W - 20

const hi = greeting()
const slogan = '抹茶让人松弛，\n星冰乐让人开心，\n今天想喝哪一杯？'
const dateText = `${md(Date.now())} ${weekday()}`
const today = getProduct('s1')!

const scrolled = ref(false)
const refreshing = ref(false)
const loading = ref(false)
const hasMore = ref(true)
const tag = ref('全部')
const page = ref(0)
const posts = ref<Post[]>([])

function load(reset = false) {
  if (reset) {
    page.value = 0
    posts.value = []
    hasMore.value = true
  }
  const { list, hasMore: more } = fetchPosts(page.value, tag.value)
  posts.value = posts.value.concat(list)
  hasMore.value = more
}
load(true)

/** 按估算高度把动态分到较矮的一列 */
const columns = computed(() => {
  const cols: Post[][] = [[], []]
  const h = [0, 0]
  posts.value.forEach((p) => {
    const est = COVER_W / p.cover.ratio + (p.title.length > 11 ? 150 : 110)
    const i = h[0] <= h[1] ? 0 : 1
    cols[i].push(p)
    h[i] += est
  })
  return cols
})

function onScroll(e: any) {
  const top = e.detail.scrollTop
  const next = top > 24
  if (next !== scrolled.value) scrolled.value = next
}

function loadMore() {
  if (loading.value || !hasMore.value) return
  loading.value = true
  setTimeout(() => {
    page.value += 1
    load()
    loading.value = false
  }, 600)
}

function onRefresh() {
  refreshing.value = true
  setTimeout(() => {
    load(true)
    refreshing.value = false
  }, 800)
}

function setTag(t: string) {
  if (tag.value === t) return
  tag.value = t
  load(true)
}

function toggleLike(id: string) {
  state.likes[id] = !state.likes[id]
}

function initial(a: string) {
  if (a.startsWith('苔生')) return '苔'
  const name = a.split(' ')[1] || a
  return name.slice(0, 1)
}

function openPost(p: Post) {
  uni.navigateTo({ url: `/pages/post/index?id=${encodeURIComponent(p.id)}` })
}
function openToday() {
  backToTab('menu', today.id)
}
function toCoupons() {
  uni.navigateTo({ url: '/pages/coupons/index' })
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
  transition: background 0.2s ease, box-shadow 0.2s ease;
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
.brand {
  font-size: 38rpx;
  font-weight: 800;
  color: $forest;
  letter-spacing: 2rpx;
}
.brand-en {
  margin-left: 14rpx;
  font-size: 22rpx;
  color: $ink-3;
  font-family: $font-latin;
}
.scroll {
  height: 100vh;
}

/* ---------- 问候卡 ---------- */
.hello {
  position: relative;
  margin: 28rpx 28rpx 0;
  height: 480rpx;
  border-radius: 64rpx;
  background: $forest;
  padding: 44rpx 44rpx 0;
  box-shadow: $shadow-forest;
  display: flex;
  flex-direction: column;
}
.orb {
  position: absolute;
  border-radius: 50%;
}
.o1 {
  width: 260rpx;
  height: 260rpx;
  top: -34rpx;
  right: -18rpx;
  background: $moss;
  box-shadow: 0 20rpx 40rpx -10rpx rgba(20, 34, 24, 0.5);
}
.o2 {
  width: 220rpx;
  height: 220rpx;
  top: 74rpx;
  right: 88rpx;
  background: $sage;
}
.o3 {
  width: 160rpx;
  height: 160rpx;
  top: 34rpx;
  right: 40rpx;
  background: $forest;
  box-shadow: -10rpx 16rpx 30rpx rgba(20, 34, 24, 0.35);
}
.bell {
  position: relative;
  width: 64rpx;
  height: 64rpx;
  margin-left: -8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bell-dot {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 30rpx;
  height: 30rpx;
  padding: 0 6rpx;
  border-radius: 15rpx;
  background: #d9483b;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bell-n {
  font-size: 18rpx;
  font-weight: 800;
  color: #fff;
  @include num;
}
.hello-t {
  position: relative;
  margin-top: 18rpx;
  font-size: 50rpx;
  font-weight: 800;
  color: $paper;
  letter-spacing: -0.5rpx;
}
.hello-s {
  position: relative;
  margin-top: 10rpx;
  font-size: 25rpx;
  line-height: 1.6;
  color: rgba(250, 251, 247, 0.82);
}
.today {
  position: absolute;
  left: 32rpx;
  bottom: 32rpx;
  height: 96rpx;
  padding: 0 12rpx 0 8rpx;
  border-radius: 32rpx;
  background: rgba(250, 251, 247, 0.12);
  display: flex;
  align-items: center;
}
.today-art {
  width: 80rpx;
  height: 80rpx;
  border-radius: 26rpx;
  background: $sage;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
}
.today-info {
  margin: 0 18rpx;
  display: flex;
  flex-direction: column;
}
.today-l {
  font-size: 20rpx;
  color: $sage-soft;
}
.today-n {
  font-size: 26rpx;
  font-weight: 700;
  color: $paper;
}
.today-go {
  width: 60rpx;
  height: 60rpx;
  border-radius: 22rpx;
  background: $sage;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hello-date {
  position: absolute;
  right: 44rpx;
  bottom: 40rpx;
  font-size: 22rpx;
  color: rgba(250, 251, 247, 0.7);
}

/* ---------- 筛选 ---------- */
.sec-head {
  display: flex;
  align-items: baseline;
  padding: 56rpx 32rpx 0;
}
.sec-t {
  font-size: 38rpx;
  font-weight: 800;
}
.sec-s {
  margin-left: 16rpx;
  font-size: 23rpx;
  color: $ink-3;
}
.tags {
  margin-top: 22rpx;
  white-space: nowrap;
}
.tags-in {
  display: flex;
  padding: 0 28rpx;
}
.tag {
  flex-shrink: 0;
  margin-right: 14rpx;
  height: 64rpx;
  padding: 0 30rpx;
  border-radius: 22rpx;
  background: $mist;
  display: flex;
  align-items: center;
  &.on {
    background: $forest;
  }
}
.tag-t {
  font-size: 25rpx;
  color: $ink-2;
  font-weight: 600;
}
.tag.on .tag-t {
  color: $paper;
}

/* ---------- 瀑布流 ---------- */
.masonry {
  display: flex;
  justify-content: space-between;
  padding: 26rpx 28rpx 0;
}
.col {
  width: 338rpx;
}
.post {
  margin-bottom: 18rpx;
  padding: 10rpx 10rpx 20rpx;
  border-radius: 34rpx;
  background: $paper;
  box-shadow: $shadow-soft;
}
.post-cover {
  position: relative;
  border-radius: 26rpx;
  overflow: hidden;
}
.post-tag {
  font-size: 20rpx;
  font-weight: 700;
  color: $forest;
}
.post-title {
  display: block;
  margin: 16rpx 10rpx 0;
  font-size: 27rpx;
  line-height: 1.42;
  font-weight: 700;
  color: $ink;
  @include ellipsis(2);
}
.post-meta {
  margin: 14rpx 10rpx 0;
  display: flex;
  align-items: center;
}
.avatar {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.avatar-t {
  font-size: 18rpx;
  font-weight: 700;
  color: #fff;
}
.author {
  flex: 1;
  min-width: 0;
  margin-left: 10rpx;
  font-size: 21rpx;
  color: $ink-2;
  @include ellipsis(1);
}
.like {
  display: flex;
  align-items: center;
  padding-left: 10rpx;
}
.like-n {
  margin-left: 4rpx;
  font-size: 21rpx;
  color: $ink-3;
  @include num;
}
.more {
  padding: 24rpx 0 0;
  text-align: center;
}
.more-t {
  font-size: 23rpx;
  color: $ink-3;
}
.tail {
  height: calc(env(safe-area-inset-bottom) + 220rpx);
}
</style>

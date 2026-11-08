<template>
  <view class="page">
    <NavBar :title="post ? post.author : ''" overlay :placeholder="false" :scroll-top="scrollTop" />
    <template v-if="post">
      <CoverArt :cover="post.cover" :width="750" :radius="0" :fixed-height="coverH" />

      <view class="sheet">
        <view class="author">
          <view class="avatar" :style="{ background: 'linear-gradient(140deg,' + post.avatar[0] + ',' + post.avatar[1] + ')' }">
            <text class="avatar-t">{{ initial }}</text>
          </view>
          <view class="a-info">
            <text class="a-name">{{ post.author }}</text>
            <text class="a-time">{{ ago(post.at) }}</text>
          </view>
          <text class="role">{{ post.role }}</text>
        </view>

        <text class="title">{{ post.title }}</text>
        <text v-for="(para, i) in post.content" :key="i" class="para">{{ para }}</text>
        <view class="tags">
          <text class="tag">#{{ post.tag }}</text>
          <text class="tag">#苔生日常</text>
        </view>

        <view v-if="product" class="related">
          <text class="r-t">文中的这一杯</text>
          <ProductCard :product="product" @open="order" @add="order" />
        </view>

        <view class="comments">
          <text class="r-t">留言 {{ post.comments }}</text>
          <view v-for="c in COMMENTS" :key="c.name" class="cm">
            <view class="cm-av" :style="{ background: c.color }">
              <text class="cm-av-t">{{ c.name.slice(0, 1) }}</text>
            </view>
            <view class="cm-body">
              <text class="cm-name">{{ c.name }}</text>
              <text class="cm-text">{{ c.text }}</text>
            </view>
          </view>
        </view>
        <view class="tail" />
      </view>

      <view class="bar">
        <view class="b-act" hover-class="tap-on" @tap="toggleLike">
          <Icon :name="liked ? 'heartFill' : 'heart'" :size="40" :color="liked ? '#B9543F' : '#566156'" />
          <text class="b-n">{{ post.likes + (liked ? 1 : 0) }}</text>
        </view>
        <!-- #ifdef MP-WEIXIN -->
        <button class="b-act share" open-type="share" hover-class="tap-on">
          <Icon name="share" :size="38" color="#566156" />
          <text class="b-n">分享</text>
        </button>
        <!-- #endif -->
        <view class="b-cta" hover-class="tap-on" @tap="order">
          <Icon name="bag" :size="32" color="#FAFBF7" :stroke="2.2" />
          <text class="b-cta-t">{{ product ? '点一杯同款' : '去点单' }}</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onPageScroll, onShareAppMessage } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import Icon from '@/components/Icon.vue'
import CoverArt from '@/components/CoverArt.vue'
import ProductCard from '@/components/ProductCard.vue'
import { getPost } from '@/mock/posts'
import { getProduct } from '@/mock/products'
import { state, backToTab } from '@/store'
import { ago } from '@/utils/format'
import type { Post } from '@/types'

const COMMENTS = [
  { name: '林一', color: '#A3B48B', text: '上周喝过，第一口奶盖真的很绵。' },
  { name: 'Coco', color: '#C9A27E', text: '求周末也能保留早上那张券！' },
  { name: '阿岚', color: '#7E9BA8', text: '窗边那个位置是我的固定座位哈哈。' }
]

const post = ref<Post | null>(null)
const scrollTop = ref(0)

onLoad((q: any) => {
  post.value = getPost(decodeURIComponent(q?.id || '')) || null
})
onPageScroll((e) => {
  scrollTop.value = e.scrollTop
})
onShareAppMessage(() => ({
  title: post.value?.title || '苔生 Mossy',
  path: `/pages/post/index?id=${post.value?.id || ''}`
}))

const coverH = computed(() => (post.value ? Math.min(Math.round(750 / post.value.cover.ratio), 900) : 0))
const product = computed(() => (post.value?.productId ? getProduct(post.value.productId) : undefined))
const liked = computed(() => !!(post.value && state.likes[post.value.id]))
const initial = computed(() => {
  const a = post.value?.author || ''
  if (a.startsWith('苔生')) return '苔'
  return (a.split(' ')[1] || a).slice(0, 1)
})

function toggleLike() {
  if (!post.value) return
  state.likes[post.value.id] = !state.likes[post.value.id]
}
function order() {
  backToTab('menu', product.value?.id || '')
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: $fog;
}
.sheet {
  position: relative;
  margin-top: -56rpx;
  border-radius: 56rpx 56rpx 0 0;
  background: $fog;
  padding: 40rpx 36rpx 0;
}
.author {
  display: flex;
  align-items: center;
}
.avatar {
  width: 76rpx;
  height: 76rpx;
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-t {
  font-size: 32rpx;
  font-weight: 800;
  color: #fff;
}
.a-info {
  flex: 1;
  margin-left: 18rpx;
  display: flex;
  flex-direction: column;
}
.a-name {
  font-size: 28rpx;
  font-weight: 700;
}
.a-time {
  font-size: 22rpx;
  color: $ink-3;
}
.role {
  padding: 6rpx 18rpx;
  border-radius: 14rpx;
  background: $mist;
  font-size: 21rpx;
  color: $forest;
  font-weight: 700;
}
.title {
  display: block;
  margin-top: 34rpx;
  font-size: 44rpx;
  line-height: 1.35;
  font-weight: 800;
  letter-spacing: -0.5rpx;
}
.para {
  display: block;
  margin-top: 22rpx;
  font-size: 30rpx;
  line-height: 1.85;
  color: #34402f;
}
.tags {
  margin-top: 26rpx;
  display: flex;
  flex-wrap: wrap;
}
.tag {
  margin-right: 14rpx;
  font-size: 25rpx;
  color: $matcha;
  font-weight: 600;
}
.related {
  margin-top: 56rpx;
}
.r-t {
  display: block;
  font-size: 30rpx;
  font-weight: 800;
  margin-bottom: 18rpx;
}
.comments {
  margin-top: 40rpx;
}
.cm {
  display: flex;
  padding: 18rpx 0;
  border-bottom: 1rpx solid $line;
}
.cm-av {
  width: 60rpx;
  height: 60rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cm-av-t {
  font-size: 24rpx;
  font-weight: 700;
  color: #fff;
}
.cm-body {
  margin-left: 18rpx;
  display: flex;
  flex-direction: column;
}
.cm-name {
  font-size: 24rpx;
  color: $ink-3;
}
.cm-text {
  margin-top: 4rpx;
  font-size: 27rpx;
  line-height: 1.6;
}
.tail {
  height: calc(env(safe-area-inset-bottom) + 180rpx);
}
.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx 28rpx calc(env(safe-area-inset-bottom) + 16rpx) 36rpx;
  background: rgba(250, 251, 247, 0.96);
  box-shadow: 0 -1rpx 0 $line;
  display: flex;
  align-items: center;
  z-index: 50;
}
.b-act {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 40rpx;
}
.share {
  padding: 0;
  margin: 0 40rpx 0 0;
  background: transparent;
  line-height: 1.2;
  border-radius: 0;
}
.b-n {
  margin-top: 2rpx;
  font-size: 20rpx;
  color: $ink-2;
  @include num;
}
.b-cta {
  flex: 1;
  height: 92rpx;
  border-radius: 30rpx;
  background: $forest;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: $shadow-forest;
}
.b-cta-t {
  margin-left: 10rpx;
  font-size: 29rpx;
  font-weight: 700;
  color: $paper;
}
</style>

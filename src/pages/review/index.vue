<!-- 订单评价（v1.6.0）：completed 订单可评价；已评价只读展示 -->
<template>
  <view class="page">
    <NavBar title="订单评价" />
    <view class="wrap">
      <view v-if="loading" class="empty">
        <text class="empty-t">正在加载评价…</text>
      </view>

      <!-- 已评价：只读 -->
      <template v-else-if="review">
        <view class="box">
          <text class="box-t">我的评价</text>
          <view class="stars">
            <Icon
              v-for="i in 5"
              :key="i"
              name="star"
              :size="48"
              :color="i <= review.rating ? '#E7A43A' : '#D9CBB8'"
            />
            <text class="score">{{ review.rating.toFixed(1) }}</text>
          </view>
          <text class="content">{{ review.content || '未填写文字评价' }}</text>
          <text v-if="reviewAt" class="time">评价于 {{ reviewAt }}</text>
        </view>
        <text class="foot">每单只能评价一次，感谢你的反馈</text>
      </template>

      <!-- 未评价：表单 -->
      <template v-else>
        <view class="box">
          <text class="box-t">这次体验如何？</text>
          <view class="stars">
            <view v-for="i in 5" :key="i" class="star-btn" hover-class="tap-on" @tap="rating = i">
              <Icon name="star" :size="56" :color="i <= rating ? '#E7A43A' : '#D9CBB8'" />
            </view>
            <text class="score">{{ ratingText }}</text>
          </view>
        </view>

        <view class="box">
          <view class="box-head">
            <text class="box-t">说说你的感受</text>
            <text class="count">{{ content.length }}/500</text>
          </view>
          <textarea
            v-model="content"
            class="ta"
            maxlength="500"
            placeholder="口味、服务、环境…都可以聊聊（选填）"
            placeholder-class="ph"
          />
        </view>

        <view class="submit" :class="{ disabled: !canSubmit || busy }" hover-class="tap-on" @tap="submit">
          <text class="submit-t">{{ busy ? '提交中…' : '提交评价' }}</text>
        </view>
        <text class="foot">评价提交后不可修改，请确认内容</text>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import Icon from '@/components/Icon.vue'
import { useMock } from '@/config/env'
import { getOrderReview, submitOrderReview, type OrderReview } from '@/api'
import { getMockReview, saveMockReview } from '@/mock/reviews'
import { hm, ymd } from '@/utils/format'

const RATING_TEXT = ['', '很不满意', '不太满意', '一般', '满意', '非常满意']

const orderNo = ref('')
const loading = ref(true)
const review = ref<OrderReview | null>(null)
const rating = ref(5)
const content = ref('')
const busy = ref(false)

const ratingText = computed(() => RATING_TEXT[rating.value] || '')
const canSubmit = computed(() => rating.value >= 1 && rating.value <= 5 && content.value.length <= 500)
const reviewAt = computed(() => {
  const iso = review.value?.createdAt
  if (!iso) return ''
  const ts = Date.parse(iso)
  return Number.isFinite(ts) ? `${ymd(ts)} ${hm(ts)}` : ''
})

onLoad(async (q) => {
  orderNo.value = (q?.no as string) || ''
  if (!orderNo.value) {
    loading.value = false
    return
  }
  try {
    review.value = useMock ? getMockReview(orderNo.value) : await getOrderReview(orderNo.value)
    if (review.value) {
      rating.value = review.value.rating
      content.value = review.value.content || ''
    }
  } catch {
    review.value = null
  } finally {
    loading.value = false
  }
})

function back() {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.reLaunch({ url: '/pages/index/index' })
}

async function submit() {
  if (!canSubmit.value || busy.value || !orderNo.value || review.value) return
  busy.value = true
  try {
    if (useMock) {
      const mockReview: OrderReview = {
        id: `rv-${Date.now()}`,
        orderNo: orderNo.value,
        rating: rating.value,
        content: content.value.trim(),
        images: [],
        createdAt: new Date().toISOString()
      }
      saveMockReview(mockReview)
      review.value = mockReview
    } else {
      review.value = await submitOrderReview(orderNo.value, {
        rating: rating.value,
        content: content.value.trim() || undefined
      })
    }
    uni.showToast({ title: '评价已提交', icon: 'success' })
    setTimeout(back, 700)
  } catch {
    // 40927 订单未完成 / 40928 已评价 / 40404 等由请求层按映射表提示
  } finally {
    busy.value = false
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: $canvas;
}
.wrap {
  padding: 12rpx 28rpx 0;
}
.empty {
  padding-top: 160rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-t {
  font-size: 25rpx;
  color: $ink-3;
}
.box {
  margin-top: 22rpx;
  padding: 30rpx;
  border-radius: 40rpx;
  background: $paper;
  box-shadow: $shadow-soft;
}
.box-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.box-t {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
}
.count {
  font-size: 21rpx;
  color: $ink-3;
  @include num;
}
.stars {
  margin-top: 18rpx;
  display: flex;
  align-items: center;
}
.star-btn {
  margin-right: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.score {
  margin-left: 12rpx;
  font-size: 30rpx;
  font-weight: 800;
  color: #c68a2b;
}
.content {
  display: block;
  margin-top: 18rpx;
  font-size: 27rpx;
  line-height: 1.7;
  color: $ink-2;
}
.time {
  display: block;
  margin-top: 14rpx;
  font-size: 21rpx;
  color: $ink-3;
}
.ta {
  width: 100%;
  height: 260rpx;
  margin-top: 16rpx;
  padding: 20rpx;
  box-sizing: border-box;
  border-radius: 26rpx;
  background: $canvas;
  font-size: 26rpx;
  line-height: 1.6;
}
.ph {
  color: $ink-3;
}
.submit {
  margin-top: 40rpx;
  height: 96rpx;
  border-radius: 32rpx;
  background: $espresso;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: $shadow-coffee;
  &.disabled {
    background: $line;
    box-shadow: none;
  }
}
.submit-t {
  font-size: 30rpx;
  font-weight: 700;
  color: $paper;
}
.submit.disabled .submit-t {
  color: $ink-3;
}
.foot {
  display: block;
  margin-top: 20rpx;
  text-align: center;
  font-size: 21rpx;
  color: $ink-3;
}
</style>

<!-- 意见反馈（v1.6.0）：type / content / contact → POST /app/feedback -->
<template>
  <view class="page">
    <NavBar title="意见反馈" />
    <view class="wrap">
      <view class="box">
        <text class="box-t">反馈类型</text>
        <view class="types">
          <view
            v-for="item in TYPES"
            :key="item.value"
            class="type"
            :class="{ on: type === item.value }"
            hover-class="tap-on"
            @tap="type = item.value"
          >
            <text class="type-t">{{ item.label }}</text>
          </view>
        </view>
      </view>

      <view class="box">
        <view class="box-head">
          <text class="box-t">反馈内容</text>
          <text class="count">{{ content.length }}/1000</text>
        </view>
        <textarea
          v-model="content"
          class="ta"
          maxlength="1000"
          placeholder="请描述你遇到的问题或建议，我们会尽快跟进"
          placeholder-class="ph"
        />
      </view>

      <view class="box">
        <text class="box-t">联系方式（选填）</text>
        <input
          v-model="contact"
          class="input"
          maxlength="40"
          placeholder="手机号 / 微信号，方便我们回访"
          placeholder-class="ph"
        />
      </view>

      <view class="submit" :class="{ disabled: !canSubmit || busy }" hover-class="tap-on" @tap="submit">
        <text class="submit-t">{{ busy ? '提交中…' : '提交反馈' }}</text>
      </view>
      <text class="foot">感谢你的反馈，门店会尽快查看处理</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import NavBar from '@/components/NavBar.vue'
import { useMock } from '@/config/env'
import { submitFeedback, type FeedbackType } from '@/api'

const TYPES: Array<{ value: FeedbackType; label: string }> = [
  { value: 'product', label: '商品' },
  { value: 'service', label: '服务' },
  { value: 'other', label: '其他' }
]

const type = ref<FeedbackType>('product')
const content = ref('')
const contact = ref('')
const busy = ref(false)

const canSubmit = computed(() => content.value.trim().length > 0 && content.value.length <= 1000)

async function submit() {
  if (!canSubmit.value || busy.value) return
  busy.value = true
  try {
    if (!useMock) {
      await submitFeedback({
        type: type.value,
        content: content.value.trim(),
        contact: contact.value.trim() || undefined
      })
    }
    uni.showToast({ title: '反馈已提交，感谢你', icon: 'none', duration: 1800 })
    content.value = ''
    contact.value = ''
    setTimeout(() => {
      const pages = getCurrentPages()
      if (pages.length > 1) uni.navigateBack()
    }, 900)
  } catch {
    // 40001 / 40005 / 5xx 等由请求层按映射表提示
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
.types {
  display: flex;
  margin-top: 18rpx;
}
.type {
  flex: 1;
  height: 78rpx;
  margin-right: 16rpx;
  border-radius: 26rpx;
  background: $latte;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s ease;
  &:last-child {
    margin-right: 0;
  }
  &.on {
    background: $espresso;
  }
}
.type-t {
  font-size: 26rpx;
  font-weight: 600;
  color: $ink;
}
.type.on .type-t {
  color: $paper;
}
.ta {
  width: 100%;
  height: 300rpx;
  margin-top: 16rpx;
  padding: 20rpx;
  box-sizing: border-box;
  border-radius: 26rpx;
  background: $canvas;
  font-size: 26rpx;
  line-height: 1.6;
}
.input {
  height: 84rpx;
  margin-top: 16rpx;
  padding: 0 24rpx;
  border-radius: 26rpx;
  background: $canvas;
  font-size: 26rpx;
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

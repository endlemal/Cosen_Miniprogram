<!-- 商品图片占位：封面/相册未上传时的空态，等待真实图片出现后由外层替换 -->
<template>
  <view class="ph" :class="{ 'ph--compact': compact }">
    <view v-if="!compact" class="ph-icon">
      <view class="ph-sun" />
      <view class="ph-hill" />
    </view>
    <text v-if="!compact" class="ph-label">图片待上传</text>
  </view>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
</script>

<style lang="scss" scoped>
.ph {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  background: linear-gradient(155deg, #f7eee2 0%, #ecdcc6 100%);
  overflow: hidden;
}
.ph-icon {
  position: relative;
  width: 58rpx;
  height: 46rpx;
  box-sizing: border-box;
  border: 2rpx solid rgba(70, 39, 25, 0.26);
  border-radius: 10rpx;
  overflow: hidden;
}
.ph-sun {
  position: absolute;
  left: 9rpx;
  top: 8rpx;
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: rgba(70, 39, 25, 0.26);
}
.ph-hill {
  position: absolute;
  left: 12rpx;
  bottom: -16rpx;
  width: 32rpx;
  height: 32rpx;
  background: rgba(70, 39, 25, 0.2);
  transform: rotate(45deg);
}
.ph-label {
  font-size: 20rpx;
  line-height: 1;
  letter-spacing: 2rpx;
  color: rgba(70, 39, 25, 0.45);
}
.ph--compact .ph-icon {
  width: 34rpx;
  height: 28rpx;
  border-radius: 7rpx;
}
.ph--compact .ph-sun {
  left: 6rpx;
  top: 5rpx;
  width: 6rpx;
  height: 6rpx;
}
.ph--compact .ph-hill {
  left: 8rpx;
  bottom: -10rpx;
  width: 18rpx;
  height: 18rpx;
}
</style>

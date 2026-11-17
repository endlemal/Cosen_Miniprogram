<!-- 会员登录：微信一键登录 / 联调账号登录。请求层收到 401 时会 reLaunch 到这里 -->
<template>
  <view class="page">
    <NavBar title="会员登录" />
    <view class="wrap">
      <view class="hero">
        <view class="mark">
          <Icon name="leaf" :size="52" color="#FFF9F0" :stroke="1.8" />
        </view>
        <text class="hero-t">欢迎回到可森</text>
        <text class="hero-s">登录后查看会员储值、礼品券与点单记录</text>
      </view>

      <view class="card">
        <view class="row" hover-class="tap-on" @tap="wechatLogin">
          <view class="row-ic">
            <Icon name="chat" :size="38" color="#FFF9F0" />
          </view>
          <view class="row-txt">
            <text class="row-t">微信一键登录</text>
            <text class="row-s">使用微信授权快速进入</text>
          </view>
          <Icon name="right" :size="30" color="#856951" />
        </view>
        <view class="line" />
        <view class="row" hover-class="tap-on" @tap="mockLogin">
          <view class="row-ic sand">
            <Icon name="wallet" :size="38" color="#462719" />
          </view>
          <view class="row-txt">
            <text class="row-t">联调账号登录</text>
            <text class="row-s">仅 dev / test 环境可用</text>
          </view>
          <Icon name="right" :size="30" color="#856951" />
        </view>
      </view>

      <text class="mode">{{ useMock ? '当前为 mock 模式：点击任一入口进入演示登录' : '接口地址：' + API_BASE_URL }}</text>
      <view class="skip" hover-class="tap-on" @tap="goHome">
        <text class="skip-t">先随便逛逛</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import NavBar from '@/components/NavBar.vue'
import Icon from '@/components/Icon.vue'
import { API_BASE_URL, useMock } from '@/config/env'
import { loginByMock, loginByWechat, setToken } from '@/api'

/** 联调登录默认手机号（契约 LoginMockReq 示例） */
const DEV_PHONE = '13800000817'

const busy = ref(false)

function toast(title: string) {
  uni.showToast({ title, icon: 'none', duration: 1800 })
}

function finish(msg: string) {
  toast(msg)
  setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 400)
}

/** mock 模式不做真实登录，只写一个演示 token 让页面保持“已登录”语义 */
function demoLogin() {
  setToken('mock-demo-token')
  finish('已进入演示登录')
}

function wechatLogin() {
  if (busy.value) return
  if (useMock) return demoLogin()
  // #ifdef MP-WEIXIN
  busy.value = true
  uni.login({
    provider: 'weixin',
    success: async (res) => {
      if (!res.code) {
        busy.value = false
        toast('没有拿到微信登录 code')
        return
      }
      try {
        await loginByWechat({ code: res.code })
        finish('登录成功')
      } catch {
        // 请求层已 toast（40102/42901/50301 等）
      } finally {
        busy.value = false
      }
    },
    fail: () => {
      busy.value = false
      toast('微信登录失败，请重试')
    }
  })
  // #endif
  // #ifndef MP-WEIXIN
  toast('请在微信小程序内使用微信登录')
  // #endif
}

async function mockLogin() {
  if (busy.value) return
  if (useMock) return demoLogin()
  busy.value = true
  try {
    await loginByMock({ phone: DEV_PHONE, nickname: 'Vivian' })
    finish('登录成功')
  } catch {
    // 请求层已 toast（40302/42901/50001 等）
  } finally {
    busy.value = false
  }
}

function goHome() {
  uni.reLaunch({ url: '/pages/index/index' })
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
.hero {
  margin-top: 60rpx;
  padding: 60rpx 44rpx;
  border-radius: 52rpx;
  background: $espresso;
  box-shadow: $shadow-coffee;
  display: flex;
  flex-direction: column;
}
.mark {
  width: 104rpx;
  height: 104rpx;
  border-radius: 34rpx;
  background: rgba($paper, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-t {
  margin-top: 30rpx;
  font-size: 46rpx;
  font-weight: 800;
  color: $paper;
}
.hero-s {
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: $cream;
}
.card {
  margin-top: 26rpx;
  padding: 8rpx 30rpx;
  border-radius: 40rpx;
  background: $paper;
  box-shadow: $shadow-soft;
}
.row {
  display: flex;
  align-items: center;
  padding: 26rpx 0;
}
.row-ic {
  width: 78rpx;
  height: 78rpx;
  border-radius: 26rpx;
  background: $espresso;
  display: flex;
  align-items: center;
  justify-content: center;
  &.sand {
    background: $caramel;
  }
}
.row-txt {
  flex: 1;
  min-width: 0;
  margin: 0 18rpx 0 22rpx;
  display: flex;
  flex-direction: column;
}
.row-t {
  font-size: 29rpx;
  font-weight: 700;
}
.row-s {
  margin-top: 2rpx;
  font-size: 22rpx;
  color: $ink-3;
}
.line {
  height: 1rpx;
  margin-left: 100rpx;
  background: $line;
}
.mode {
  display: block;
  margin: 26rpx 8rpx 0;
  font-size: 21rpx;
  line-height: 1.6;
  color: $ink-3;
  word-break: break-all;
}
.skip {
  margin: 50rpx auto 0;
  width: 260rpx;
  height: 68rpx;
  border-radius: 24rpx;
  background: $latte;
  display: flex;
  align-items: center;
  justify-content: center;
}
.skip-t {
  font-size: 24rpx;
  font-weight: 600;
  color: $ink-2;
}
</style>

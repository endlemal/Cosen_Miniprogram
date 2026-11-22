<!-- 门店信息（v1.6.0）：GET /app/store，营业时间 / 地址 / 电话 / 公告 / 客服 -->
<template>
  <view class="page">
    <NavBar title="门店信息" />
    <view class="wrap">
      <view v-if="loading" class="empty">
        <text class="empty-t">正在加载门店信息…</text>
      </view>
      <view v-else-if="!store" class="empty">
        <text class="empty-t">门店信息暂时取不到</text>
        <view class="retry" hover-class="tap-on" @tap="load">
          <text class="retry-t">重新加载</text>
        </view>
      </view>
      <template v-else>
        <view class="hero">
          <view class="hero-top">
            <view class="hero-mark">
              <Icon name="store" :size="42" color="#FFF9F0" :stroke="2" />
            </view>
            <view class="hero-txt">
              <text class="hero-name">{{ store.name }}</text>
              <view class="hero-tag" :class="{ on: store.openNow }">
                <text class="hero-tag-t">{{ store.openNow ? '营业中' : '休息中' }}</text>
              </view>
            </view>
          </view>
          <view v-if="store.address" class="hero-row" hover-class="tap-on" @tap="copyText(store.address, '地址已复制')">
            <Icon name="pin" :size="30" color="#EDD3AE" />
            <text class="hero-s">{{ store.address }}</text>
            <text class="hero-copy">复制</text>
          </view>
          <view v-if="store.phone" class="hero-row" hover-class="tap-on" @tap="call">
            <Icon name="phone" :size="30" color="#EDD3AE" />
            <text class="hero-s">{{ store.phone }}</text>
            <text class="hero-copy">拨打</text>
          </view>
        </view>

        <view class="box">
          <text class="box-t">营业时间</text>
          <view v-for="row in hourRows" :key="row.days + row.time" class="kv">
            <text class="k">{{ row.days }}</text>
            <text class="v">{{ row.time }}</text>
          </view>
          <text v-if="!hourRows.length" class="hint">营业时间待补充</text>
          <text v-if="closedText" class="hint">{{ closedText }}</text>
        </view>

        <view v-if="announcements.length" class="box">
          <text class="box-t">门店公告</text>
          <view v-for="(item, i) in announcements" :key="i" class="notice">
            <view class="notice-dot" />
            <text class="notice-t">{{ item }}</text>
          </view>
        </view>

        <view v-if="customerService" class="box">
          <text class="box-t">客服</text>
          <view class="kv" hover-class="tap-on" @tap="onCustomerService">
            <text class="k">{{ customerService.type === 'phone' ? '客服电话' : '客服微信' }}</text>
            <text class="v">{{ customerService.value }}</text>
          </view>
          <text class="hint">{{ customerService.type === 'phone' ? '点击拨打客服电话' : '点击复制客服微信号' }}</text>
        </view>
        <view class="tail" />
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import NavBar from '@/components/NavBar.vue'
import Icon from '@/components/Icon.vue'
import { useMock } from '@/config/env'
import { getStoreInfo, type StoreInfo, type StoreCustomerService } from '@/api'
import { STORE } from '@/mock/products'

const loading = ref(true)
const store = ref<StoreInfo | null>(null)

/** mock 门店数据：沿用 src/mock/products 的 STORE，补齐 v1.6.0 门店字段 */
function mockStore(): StoreInfo {
  return {
    storeId: '1',
    name: STORE.name,
    address: STORE.address,
    phone: STORE.phone,
    businessHours: [{ days: 'mon-sun', open: '08:00', close: '21:30' }],
    closedDays: [],
    announcements: ['到店自取免排队，报取餐号即可', '工作日 8:00–10:00 早安券可用'],
    openNow: true,
    customerService: { type: 'wechat', value: 'cosen_service' }
  }
}

const DAYS_TEXT: Record<string, string> = {
  'mon-sun': '每天',
  'mon-fri': '工作日',
  'sat-sun': '周末',
  'mon-sat': '周一至周六',
  'mon-thu': '周一至周四'
}

const hourRows = computed(() =>
  (store.value?.businessHours ?? []).map((item) => ({
    days: DAYS_TEXT[item.days] || item.days,
    time: `${item.open} – ${item.close}`
  }))
)
const announcements = computed(() => (store.value?.announcements ?? []).filter((item) => !!item))
const closedText = computed(() => {
  const days = store.value?.closedDays ?? []
  return days.length ? `休息日：${days.join('、')}` : ''
})
const customerService = computed<StoreCustomerService | null>(() => store.value?.customerService ?? null)

async function load() {
  loading.value = true
  if (useMock) {
    store.value = mockStore()
    loading.value = false
    return
  }
  try {
    store.value = await getStoreInfo()
  } catch {
    // 50302 等请求层已提示；页面给空态 + 重试
    store.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)

function copyText(text: string, tip: string) {
  uni.setClipboardData({
    data: text,
    success: () => uni.showToast({ title: tip, icon: 'none', duration: 1500 })
  })
}

function call() {
  const phone = (store.value?.phone || '').replace(/[^\d+]/g, '')
  if (!phone) return
  uni.makePhoneCall({ phoneNumber: phone, fail: () => {} })
}

function onCustomerService() {
  const cs = customerService.value
  if (!cs) return
  if (cs.type === 'phone') {
    uni.makePhoneCall({ phoneNumber: cs.value.replace(/[^\d+]/g, ''), fail: () => {} })
    return
  }
  copyText(cs.value, '客服微信已复制')
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
  flex-direction: column;
  align-items: center;
}
.empty-t {
  font-size: 25rpx;
  color: $ink-3;
}
.retry {
  margin-top: 24rpx;
  height: 72rpx;
  padding: 0 44rpx;
  border-radius: 24rpx;
  background: $latte;
  display: flex;
  align-items: center;
}
.retry-t {
  font-size: 25rpx;
  font-weight: 700;
  color: $espresso;
}
.hero {
  position: relative;
  padding: 40rpx 40rpx 34rpx;
  border-radius: 52rpx;
  background: $espresso;
  box-shadow: $shadow-coffee;
  display: flex;
  flex-direction: column;
}
.hero-top {
  display: flex;
  align-items: center;
}
.hero-mark {
  width: 88rpx;
  height: 88rpx;
  border-radius: 28rpx;
  background: $toffee;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.hero-txt {
  margin-left: 22rpx;
  display: flex;
  flex-direction: column;
}
.hero-name {
  font-size: 40rpx;
  font-weight: 800;
  color: $paper;
  letter-spacing: -0.5rpx;
}
.hero-tag {
  margin-top: 8rpx;
  align-self: flex-start;
  padding: 2rpx 14rpx;
  border-radius: 12rpx;
  background: rgba($paper, 0.16);
  &.on {
    background: $caramel;
  }
}
.hero-tag-t {
  font-size: 21rpx;
  font-weight: 700;
  color: $roast;
}
.hero-row {
  display: flex;
  align-items: center;
  margin-top: 24rpx;
}
.hero-s {
  flex: 1;
  min-width: 0;
  margin-left: 12rpx;
  font-size: 25rpx;
  color: rgba($paper, 0.86);
  @include ellipsis(1);
}
.hero-copy {
  margin-left: 12rpx;
  font-size: 21rpx;
  color: $caramel;
  font-weight: 700;
}
.box {
  margin-top: 22rpx;
  padding: 28rpx 30rpx;
  border-radius: 40rpx;
  background: $paper;
  box-shadow: $shadow-soft;
}
.box-t {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
}
.kv {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 12rpx 0;
}
.k {
  font-size: 25rpx;
  color: $ink-2;
}
.v {
  font-size: 26rpx;
  color: $ink;
  @include num;
}
.hint {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: $ink-3;
}
.notice {
  display: flex;
  align-items: flex-start;
  padding: 10rpx 0;
}
.notice-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: $caramel;
  margin: 12rpx 14rpx 0 4rpx;
  flex-shrink: 0;
}
.notice-t {
  flex: 1;
  font-size: 25rpx;
  line-height: 1.6;
  color: $ink-2;
}
.tail {
  height: calc(env(safe-area-inset-bottom) + 60rpx);
}
</style>

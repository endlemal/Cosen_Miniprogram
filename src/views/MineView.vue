<!-- 我的：会员储值卡、充值入口、礼品券、订单 -->
<template>
  <view class="view">
    <view class="topbar" :class="{ solid: scrolled }" :style="{ height: L.header + 'px', paddingTop: L.statusBar + 'px' }">
      <view class="tb-row" :style="{ height: L.navHeight + 'px' }">
        <text class="tb-title" :style="{ opacity: scrolled ? 1 : 0 }">我的</text>
      </view>
    </view>

    <scroll-view scroll-y class="scroll" @scroll="onScroll">
      <view :style="{ height: L.header + L.topGap + 'px' }" />

      <!-- 个人信息 -->
      <view class="me" hover-class="tap-on" @tap="openProfileEditor">
        <view class="avatar">
          <image v-if="profile?.avatarUrl" class="avatar-img" :src="profile.avatarUrl" mode="aspectFill" />
          <text v-else class="avatar-t">{{ displayName.slice(0, 1) }}</text>
        </view>
        <view class="me-info">
          <text class="me-name">{{ displayName }}</text>
          <view class="me-row">
            <view class="level">
              <Icon name="crown" :size="22" color="#462719" :stroke="2.2" />
              <text class="level-t">{{ displayLevel }}</text>
            </view>
            <text class="me-phone">{{ displayPhone || '未绑定手机号' }}</text>
          </view>
        </view>
        <view class="me-edit">
          <text class="me-edit-t">{{ !profile?.phoneBound && !useMock ? '编辑 / 绑手机' : '编辑资料' }}</text>
        </view>
      </view>

      <!-- 储值卡 -->
      <view class="card">
        <image class="card-pattern" src="/static/coffee-splash.svg" mode="aspectFill" />
        <text class="card-l">储值余额</text>
        <view v-if="!useMock && !profile?.phoneBound" class="bal" hover-class="tap-on" @tap="goToPhoneLogin"><text>点击登录查看余额 ›</text></view>
        <view v-else class="bal">
          <text class="bal-c">¥</text>
          <text class="bal-n">{{ money2(displayBalance) }}</text>
        </view>
        <text v-if="useMock || profile?.phoneBound" class="card-sub">{{ profile ? '其中赠送余额 ¥' + money2(centToYuan(profile.giftBalanceCent || 0)) : '累计充值 ' + state.rechargeTotal + ' 元，已获赠 ' + state.bonusTotal + ' 元' }}</text>
        <view class="card-foot">
          <view class="stat" hover-class="tap-on" @tap="toast('积分商城下个月开放')">
            <text class="stat-n">{{ useMock || profile?.phoneBound ? thousands(displayPoints) : '—' }}</text>
            <text class="stat-l">积分</text>
          </view>
          <view class="stat" hover-class="tap-on" @tap="go('/pages/coupons/index')">
            <text class="stat-n">{{ useMock ? availableCouponCount : profile?.phoneBound ? realCouponCount : '—' }}</text>
            <text class="stat-l">礼品券</text>
          </view>
          <view class="topup" hover-class="tap-on" @tap="go('/pages/recharge/index')">
            <Icon name="plus" :size="28" color="#462719" :stroke="2.8" />
            <text class="topup-t">充值</text>
          </view>
        </view>
      </view>

      <!-- 商家礼赠提醒 -->
      <view v-if="useMock && newest" class="gift" hover-class="tap-on" @tap="go('/pages/coupons/index')">
        <view class="gift-ic">
          <Icon name="gift" :size="36" color="#FFF9F0" :stroke="2.1" />
        </view>
        <view class="gift-txt">
          <text class="gift-t">{{ newest.issuer }}送你一张「{{ newest.title }}」</text>
          <text class="gift-s">{{ newest.reason }}，{{ newCouponCount > 1 ? '还有 ' + (newCouponCount - 1) + ' 张新券待查看' : '点开查看' }}</text>
        </view>
        <Icon name="right" :size="30" color="#856951" />
      </view>

      <!-- 快捷入口 -->
      <view class="grid">
        <view class="cell" hover-class="tap-on" @tap="go('/pages/coupons/index')">
          <view class="cell-ic">
            <Icon name="ticket" :size="40" color="#663A24" />
            <view v-if="useMock && newCouponCount" class="cell-dot" />
          </view>
          <text class="cell-t">礼品券</text>
        </view>
        <view class="cell" hover-class="tap-on" @tap="go('/pages/recharge/index')">
          <view class="cell-ic">
            <Icon name="wallet" :size="40" color="#663A24" />
          </view>
          <text class="cell-t">会员储值</text>
        </view>
        <view class="cell" hover-class="tap-on" @tap="toMenu">
          <view class="cell-ic">
            <Icon name="bag" :size="40" color="#663A24" />
          </view>
          <text class="cell-t">继续点单</text>
        </view>
        <view class="cell" hover-class="tap-on" @tap="go('/pages/store/index')">
          <view class="cell-ic">
            <Icon name="store" :size="40" color="#663A24" />
          </view>
          <text class="cell-t">门店信息</text>
        </view>
      </view>

      <!-- 最近订单 -->
      <view class="sec-head">
        <text class="sec-t">最近订单</text>
        <text class="sec-s">共 {{ orderTotalCount }} 单</text>
        <text class="sec-more" hover-class="tap-on" @tap="go('/pages/order/index')">全部订单 ›</text>
      </view>
      <view v-if="!recentList.length" class="empty">
        <text class="empty-t">{{ ordersLoading ? '正在加载订单…' : '还没有订单，去点一杯吧' }}</text>
      </view>
      <view
        v-for="o in recentList"
        :key="o.key"
        class="order"
        hover-class="tap-on"
        @tap="go(o.url)"
      >
        <view class="o-arts">
          <view
            v-for="k in o.thumbCount"
            :key="k"
            class="o-thumb"
            :style="{ marginLeft: k > 1 ? '-28rpx' : '0' }"
          >
            <ProductImagePlaceholder :product-key="o.key + '-' + k" />
          </view>
        </view>
        <view class="o-info">
          <view class="o-top">
            <text class="o-code">{{ o.code }}</text>
            <text class="o-stage" :class="{ live: o.live }">{{ o.statusText }}</text>
          </view>
          <text class="o-items">{{ o.itemsDesc }}</text>
          <text class="o-time">{{ o.timeDesc }}</text>
        </view>
        <text class="o-total">¥{{ money(o.total) }}</text>
      </view>

      <!-- 设置与服务 -->
      <view class="settings">
        <view class="set-row" hover-class="tap-on" @tap="openProfileEditor">
          <view class="set-ic">
            <Icon name="user" :size="34" color="#663A24" />
          </view>
          <text class="set-t">个人信息与手机号绑定</text>
          <Icon name="right" :size="28" color="#856951" />
        </view>
        <view class="set-line" />
        <view class="set-row" hover-class="tap-on" @tap="onToggleSubscribeNotify">
          <view class="set-ic">
            <Icon name="bell" :size="34" color="#663A24" />
          </view>
          <text class="set-t">消费小票通知</text>
          <text class="set-tag" :class="{ on: alwaysNotifyOn }">
            {{ notifyBusy ? '授权中…' : alwaysNotifyOn ? '已开启' : '去开启' }}
          </text>
          <Icon name="right" :size="28" color="#856951" />
        </view>
        <view class="set-line" />
        <view class="set-row" hover-class="tap-on" @tap="go('/pages/feedback/index')">
          <view class="set-ic">
            <Icon name="chat" :size="34" color="#663A24" />
          </view>
          <text class="set-t">意见反馈</text>
          <Icon name="right" :size="28" color="#856951" />
        </view>
        <view class="set-line" />
        <view v-if="hasToken()" class="set-row" hover-class="tap-on" @tap="onLogout">
          <view class="set-ic"><Icon name="user" :size="34" color="#663A24" /></view>
          <text class="set-t">{{ signingOut ? '正在退出…' : '退出登录' }}</text>
          <Icon name="right" :size="28" color="#856951" />
        </view>
        <view v-if="hasToken()" class="set-line" />
        <view class="set-row" hover-class="tap-on" @tap="onCloseAccount">
          <view class="set-ic">
            <Icon name="trash" :size="34" color="#9C8574" />
          </view>
          <text class="set-t danger">注销账号</text>
          <Icon name="right" :size="28" color="#856951" />
        </view>
      </view>

      <view v-if="useMock" class="reset" hover-class="tap-on" @tap="onReset">
        <Icon name="refresh" :size="24" color="#856951" />
        <text class="reset-t">重置演示数据</text>
      </view>
      <text class="foot">{{ useMock ? '可森 COSEN · 商品、订单与支付均为演示数据' : '可森 COSEN · 会员数据来自线上接口' }}</text>
      <view class="tail" />
    </scroll-view>

    <Sheet v-model:show="profileOpen" title="编辑个人资料" bg="#FFF9F0" max-height="84vh">
      <view class="pf-sheet">
        <view class="pf-av-row">
          <view class="pf-av-preview">
            <image v-if="editAvatarUrl" class="avatar-img" :src="editAvatarUrl" mode="aspectFill" />
            <text v-else class="pf-av-ch">{{ (editNickname || displayName).slice(0, 1) }}</text>
          </view>
          <view class="pf-av-actions">
            <!-- #ifdef MP-WEIXIN -->
            <button class="pf-wx-sm" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">获取微信头像</button>
            <!-- #endif -->
            <input v-model="editAvatarUrl" class="pf-in pf-in-sm" placeholder="或填入头像图片链接（选填）" />
          </view>
        </view>
        <view class="pf-field">
          <text class="pf-label">昵称</text>
          <input v-model="editNickname" type="nickname" class="pf-in" maxlength="24" placeholder="请输入会员昵称" />
        </view>
        <view class="pf-field">
          <view class="pf-label-row">
            <text class="pf-label">手机号绑定</text>
            <text class="pf-cur">当前：{{ profile?.phoneMasked || '未绑定' }}</text>
          </view>
          <!-- #ifdef MP-WEIXIN -->
          <button v-if="!profile?.phoneBound && !useMock" class="pf-wx-btn" @tap="goToPhoneLogin">
            前往微信登录并授权手机号
          </button>
          <!-- #endif -->
        </view>
        <view class="pf-save" :class="{ busy: profileSaving }" hover-class="tap-on" @tap="saveProfile">
          <text class="pf-save-t">{{ profileSaving ? '保存中…' : '保存个人资料' }}</text>
        </view>
      </view>
    </Sheet>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Order } from '@/types'
import Icon from '@/components/Icon.vue'
import Sheet from '@/components/Sheet.vue'
import ProductImagePlaceholder from '@/components/ProductImagePlaceholder.vue'
import { USER } from '@/mock/seed'
import { memberProfile, setMemberProfile, syncMemberProfile } from '@/store/member'
import { LOGIN_PAGE, useMock } from '@/config/env'
import {
  centToYuan,
  checkAlwaysAcceptedTemplates,
  clearToken,
  closeAccount,
  hasToken,
  isSignedOut,
  logout,
  listMyOrders,
  listMyCoupons,
  orderStatusText,
  requestMemberSubscribe,
  silentRefillSubscribe,
  toOrderListItem,
  updateMemberProfile,
  type OrderListItem
} from '@/api'
import {
  state,
  memberLevel,
  availableCouponCount,
  newCouponCount,
  couponState,
  clearLocalCache,
  mockOrderStatus,
  resetDemo,
  switchTab
} from '@/store'
import { getLayout } from '@/utils/layout'
import { ago, money, money2 } from '@/utils/format'

const L = getLayout()
const scrolled = ref(false)

/* ---- 真实环境分支：useMock=false 时用会员接口覆盖展示（mock 默认不请求） ---- */
const profile = memberProfile
const LEVEL_NAMES: Record<number, string> = { 1: '可森会员', 2: '醇香会员', 3: '深焙会员' }
const displayName = computed(() => profile.value?.nickname || (useMock ? USER.name : '可森会员'))
const displayPhone = computed(() => profile.value?.phoneMasked || (useMock ? USER.phone : ''))
const displayBalance = computed(() => (profile.value ? centToYuan(profile.value.balanceCent ?? 0) : state.balance))
const displayPoints = computed(() => (profile.value ? profile.value.points ?? 0 : state.points))
const displayLevel = computed(() =>
  profile.value?.level ? LEVEL_NAMES[profile.value.level] || memberLevel.value.name : memberLevel.value.name
)

const realOrders = ref<OrderListItem[]>([])
const realOrderTotal = ref(0)
const ordersLoading = ref(false)
const realCouponCount = ref(0)
const alwaysNotifyOn = ref(false)
const notifyBusy = ref(false)

async function refreshSubscribeState() {
  if (useMock) return
  const ids = await checkAlwaysAcceptedTemplates()
  alwaysNotifyOn.value = ids.length > 0
}

function onToggleSubscribeNotify() {
  if (notifyBusy.value) return
  if (useMock) {
    toast('演示模式下仅展示效果')
    return
  }
  if (isSignedOut()) return goToPhoneLogin()
  notifyBusy.value = true
  // 必须在点击手势内同步发起微信订阅授权
  void requestMemberSubscribe('member_center')
    .then((res) => {
      alwaysNotifyOn.value = res.alwaysAccepted
      if (!res.configured) {
        toast('门店暂未配置订阅消息模板')
      } else if (res.ok && res.alwaysAccepted) {
        toast('已开启，后续自动补充小票通知次数')
      } else if (res.ok) {
        toast('已补充 1 次小票通知（建议勾选「总是保持」）')
      } else {
        toast('未授权通知，可在右上角设置随时开启')
      }
    })
    .finally(() => {
      notifyBusy.value = false
    })
}

async function refreshMembership() {
  const member = await syncMemberProfile()
  if (member?.phoneBound) {
    try { realCouponCount.value = (await listMyCoupons('unused')).length } catch { realCouponCount.value = 0 }
  } else realCouponCount.value = 0
}
async function loadRecentOrders() {
  if (useMock || isSignedOut() || ordersLoading.value) return
  ordersLoading.value = true
  try {
    const res = await listMyOrders({ pageNum: 1, pageSize: 4 })
    realOrders.value = res.rows.map(toOrderListItem)
    realOrderTotal.value = res.total
  } catch {
    /* keep existing */
  } finally {
    ordersLoading.value = false
  }
}

onMounted(() => {
  if (!useMock) {
    void refreshMembership()
    void loadRecentOrders()
    void refreshSubscribeState()
  }
})
watch(() => state.ui.tab, (tab) => {
  if (!useMock && tab === 'mine') {
    void loadRecentOrders()
    void refreshMembership()
    void refreshSubscribeState()
  }
})

const orderTotalCount = computed(() => (useMock ? state.orders.length : realOrderTotal.value))
const recentList = computed(() => {
  if (!useMock) {
    return realOrders.value.map((o) => ({
      key: o.no,
      url: '/pages/order/index?no=' + encodeURIComponent(o.no),
      thumbCount: Math.max(1, Math.min(2, o.itemCount || 1)),
      code: o.code || o.no,
      live: o.orderStatus === 'paid' || o.orderStatus === 'refund_pending',
      statusText: orderStatusText(o.orderStatus),
      itemsDesc: (o.tableNo ? `桌号 ${o.tableNo} · ` : '') + (o.itemCount ? `共 ${o.itemCount} 件商品` : '到店点单'),
      timeDesc: ago(o.createdAt) + (o.tableNo ? `，${o.tableNo} 号桌` : '，到店自取'),
      total: o.total
    }))
  }
  return state.orders.slice(0, 4).map((o) => {
    const st = statusOf(o)
    return {
      key: o.id,
      url: '/pages/order/index?id=' + o.id,
      thumbCount: Math.max(1, Math.min(2, o.items.length || 1)),
      code: o.code,
      live: st === 'paid',
      statusText: statusTextOf(o),
      itemsDesc: itemsText(o),
      timeDesc: `${ago(o.createdAt)}，${o.mode === 'pickup' ? '到店自取' : '外送'}`,
      total: o.total
    }
  })
})
const newest = computed(() => state.coupons.find((c) => c.isNew && couponState(c) === 'available'))

const profileOpen = ref(false)
const profileSaving = ref(false)
const editNickname = ref('')
const editAvatarUrl = ref('')

function openProfileEditor() {
  if (isSignedOut()) return goToPhoneLogin()
  editNickname.value = profile.value?.nickname || (useMock ? USER.name : '')
  editAvatarUrl.value = profile.value?.avatarUrl || ''
  profileOpen.value = true
}

function onChooseAvatar(e: any) {
  const url = e?.detail?.avatarUrl
  if (typeof url === 'string' && url) editAvatarUrl.value = url
}

function goToPhoneLogin() {
  profileOpen.value = false
  uni.navigateTo({ url: LOGIN_PAGE })
}

async function saveProfile() {
  const nickname = editNickname.value.trim()
  const avatarUrl = editAvatarUrl.value.trim()
  if (!nickname && !avatarUrl) {
    uni.showToast({ title: '请填写要修改的内容', icon: 'none' })
    return
  }
  if (useMock) {
    profileOpen.value = false
    uni.showToast({ title: '演示模式下仅展示效果', icon: 'none' })
    return
  }
  if (profileSaving.value) return
  profileSaving.value = true
  try {
    const updated = await updateMemberProfile({
      nickname: nickname || undefined,
      avatarUrl: avatarUrl || undefined
    })
    setMemberProfile(updated)
    profileOpen.value = false
    uni.showToast({ title: '资料已更新', icon: 'success' })
  } catch {
    /* 请求层已提示 */
  } finally {
    profileSaving.value = false
  }
}

function onScroll(e: any) {
  const next = e.detail.scrollTop > 40
  if (next !== scrolled.value) scrolled.value = next
}
/** mock 订单 → 契约 4 态（未归档 = 已支付，归档 = 已完成） */
function statusOf(o: Order) {
  return mockOrderStatus(o)
}
function statusTextOf(o: Order) {
  return orderStatusText(statusOf(o))
}
function itemsText(o: Order) {
  return o.items.map((i) => i.name + (i.qty > 1 ? ' ×' + i.qty : '')).join('，')
}
function thousands(n: number) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
function go(url: string) {
  if (!useMock) silentRefillSubscribe('silent_refill')
  if (!useMock && !profile.value?.phoneBound && ['/pages/coupons/index','/pages/recharge/index'].includes(url)) return goToPhoneLogin()
  uni.navigateTo({ url })
}
function toMenu() {
  if (!useMock) silentRefillSubscribe('silent_refill')
  switchTab('menu')
}
function toast(title: string) {
  uni.showToast({ title, icon: 'none' })
}
const signingOut = ref(false)
async function onLogout() {
  if (signingOut.value) return
  signingOut.value = true
  try {
    await logout()
    setMemberProfile(null)
    realOrders.value = []
    realOrderTotal.value = 0
    realCouponCount.value = 0
    switchTab('menu')
    uni.reLaunch({ url: LOGIN_PAGE })
  } catch {
    // 请求失败时保留登录态，错误由请求层提示。
  } finally {
    signingOut.value = false
  }
}

/** 注销账号：二次确认 → /app/account/close → 清 token/缓存 → 跳登录 */
function onCloseAccount() {
  uni.showModal({
    title: '注销账号？',
    content: '注销会解除当前微信与会员的绑定。如果这是最后一个绑定的微信，会员账户也会注销。',
    confirmText: '继续',
    confirmColor: '#D9483B',
    success: (first) => {
      if (!first.confirm) return
      uni.showModal({
        title: '再次确认注销',
        content: '确认后账号立即失效且不可恢复，确定注销吗？',
        confirmText: '确认注销',
        confirmColor: '#D9483B',
        success: (second) => {
          if (second.confirm) void doCloseAccount()
        }
      })
    }
  })
}

const closing = ref(false)
async function doCloseAccount() {
  if (closing.value) return
  closing.value = true
  uni.showLoading({ title: '正在注销', mask: true })
  try {
    // mock 模式没有后端，仅清本地登录态，保持纯 mock 可演示
    if (!useMock) await closeAccount({})
    setMemberProfile(null)
    clearToken()
    clearLocalCache()
    uni.hideLoading()
    uni.showToast({ title: '账号已注销', icon: 'none', duration: 1600 })
    setTimeout(() => uni.reLaunch({ url: LOGIN_PAGE }), 700)
  } catch {
    // 40108 / 5xx 等由请求层提示；失败保留登录态，避免「注销失败却丢登录」
    uni.hideLoading()
  } finally {
    closing.value = false
  }
}
function onReset() {
  uni.showModal({
    title: '重置演示数据？',
    content: '余额、礼品券、订单和购物车会恢复到初始状态',
    confirmText: '重置',
    confirmColor: '#663A24',
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
    background: rgba($canvas, 0.94);
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
  background: linear-gradient(140deg, $caramel 0%, $mocha 100%);
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
  background: $caramel;
  display: flex;
  align-items: center;
}
.level-t {
  margin-left: 6rpx;
  font-size: 21rpx;
  font-weight: 700;
  color: $roast;
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
  background: $espresso;
  padding: 44rpx 44rpx 0;
  overflow: hidden;
  box-shadow: $shadow-coffee;
  display: flex;
  flex-direction: column;
}
.card-pattern {
  position: absolute;
  top: 0;
  right: 0;
  width: 56%;
  height: 100%;
  opacity: 0.5;
}
.card-l {
  position: relative;
  font-size: 24rpx;
  color: $cream;
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
  color: rgba($paper, 0.7);
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
  color: $cream;
}
.topup {
  margin-left: auto;
  height: 80rpx;
  padding: 0 36rpx 0 28rpx;
  border-radius: 28rpx;
  background: $caramel;
  display: flex;
  align-items: center;
}
.topup-t {
  margin-left: 8rpx;
  font-size: 28rpx;
  font-weight: 800;
  color: $roast;
}

/* ---------- 礼赠提醒 ---------- */
.gift {
  margin: 22rpx 28rpx 0;
  padding: 22rpx 24rpx;
  border-radius: 36rpx;
  background: $latte;
  display: flex;
  align-items: center;
}
.gift-ic {
  width: 76rpx;
  height: 76rpx;
  border-radius: 26rpx;
  background: $toffee;
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
  background: $latte;
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
  border: 3rpx solid $latte;
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
.sec-more {
  margin-left: auto;
  font-size: 23rpx;
  color: $toffee;
  font-weight: 600;
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
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: $latte;
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
  background: $canvas;
  &.live {
    color: $paper;
    background: $toffee;
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
/* ---------- 设置区 ---------- */
.settings {
  margin: 22rpx 28rpx 0;
  padding: 6rpx 30rpx;
  border-radius: 40rpx;
  background: $paper;
  box-shadow: $shadow-soft;
}
.set-row {
  display: flex;
  align-items: center;
  padding: 26rpx 0;
}
.set-ic {
  width: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.set-t {
  flex: 1;
  margin-left: 12rpx;
  font-size: 27rpx;
  color: $ink;
  &.danger {
    color: $danger;
  }
}
.set-line {
  height: 1rpx;
  background: $line;
  margin-left: 68rpx;
}
.set-tag {
  margin-right: 12rpx;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  font-size: 21rpx;
  color: $ink-2;
  background: rgba(133, 105, 81, 0.12);
  &.on {
    color: #3B6A4A;
    background: rgba(59, 106, 74, 0.12);
    font-weight: 600;
  }
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
.avatar {
  overflow: hidden;
}
.avatar-img {
  width: 100%;
  height: 100%;
  display: block;
}
.me-info {
  flex: 1;
  min-width: 0;
}
.me-edit {
  margin-left: 16rpx;
  padding: 10rpx 20rpx;
  border-radius: 999rpx;
  background: #EFE4D2;
  flex-shrink: 0;
}
.me-edit-t {
  font-size: 22rpx;
  font-weight: 600;
  color: $espresso;
}
.pf-sheet {
  padding: 20rpx 36rpx calc(env(safe-area-inset-bottom) + 32rpx);
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
.pf-av-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.pf-av-preview {
  width: 96rpx;
  height: 96rpx;
  border-radius: 32rpx;
  overflow: hidden;
  background: linear-gradient(140deg, $caramel 0%, $mocha 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pf-av-ch {
  font-size: 40rpx;
  font-weight: 800;
  color: $paper;
}
.pf-av-actions {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}
.pf-field {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.pf-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.pf-label {
  font-size: 25rpx;
  font-weight: 700;
  color: $espresso;
}
.pf-cur {
  font-size: 23rpx;
  color: $ink-3;
}
.pf-in {
  height: 84rpx;
  padding: 0 24rpx;
  border-radius: 24rpx;
  background: #fff;
  font-size: 26rpx;
  color: $ink;
}
.pf-in-sm {
  height: 70rpx;
  font-size: 23rpx;
}
.pf-wx-sm,
.pf-wx-btn {
  margin: 0;
  border-radius: 22rpx;
  background: #EFE4D2;
  color: $espresso;
  font-weight: 600;
  line-height: 1.4;
}
.pf-wx-sm {
  padding: 12rpx 20rpx;
  font-size: 23rpx;
  align-self: flex-start;
}
.pf-wx-btn {
  padding: 18rpx 24rpx;
  font-size: 25rpx;
}
.pf-save {
  margin-top: 8rpx;
  height: 92rpx;
  border-radius: 30rpx;
  background: $espresso;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pf-save.busy {
  opacity: 0.7;
}
.pf-save-t {
  font-size: 28rpx;
  font-weight: 700;
  color: $paper;
}
</style>

<template>
  <view class="page">
    <NavBar :title="fromCart ? '储值结算' : '会员储值'" />
    <view class="wrap">
      <view class="now">
        <view class="now-l">
          <text class="now-k">当前余额</text>
          <view class="now-v">
            <text class="now-c">¥</text>
            <text class="now-n">{{ money2(currentBalance) }}</text>
          </view>
        </view>
        <view class="level">
          <Icon name="crown" :size="22" color="#462719" :stroke="2.2" />
          <text class="level-t">{{ levelName }}</text>
        </view>
      </view>

      <view v-if="!fromCart" class="head">
        <text class="head-t">选择储值金额</text>
        <text class="head-s">赠送金额和本金同时到账</text>
      </view>

      <view v-if="!fromCart && !tiers.length" class="empty-selection">档位加载中或暂不可用</view>
      <view v-if="!fromCart" class="tiers">
        <view
          v-for="(t, i) in tiers"
          :key="t.tierCode"
          class="tier"
          :class="{ on: pick === i, off: !t.available }"
          @tap="selectTier(i)"
        >
          <view class="pic" :class="'p' + (i % 2)">
            <view class="pic-orb a" />
            <view class="pic-orb b" />
            <view class="amt">
              <text class="amt-n">{{ t.amount }}</text>
              <text class="amt-u">元</text>
            </view>
            <Notch bg="#FFF9F0" :r="28" pad="8rpx 22rpx 14rpx 26rpx">
              <view class="bonus">
                <text class="bonus-k">送</text>
                <text class="bonus-n">{{ t.bonus }}</text>
              </view>
            </Notch>
            <view class="band">
              <text class="band-t">到账 {{ t.amount + t.bonus }} 元</text>
            </view>
          </view>
          <view class="t-foot">
            <text class="t-name">{{ t.name }}</text>
            <view class="t-check" :class="{ on: pick === i }">
              <Icon v-if="pick === i" name="check" :size="22" color="#FFF9F0" :stroke="3.2" />
            </view>
          </view>
          <view class="chips">
            <text class="chip">{{ t.note }}</text>
            <text v-if="t.hot && t.available" class="chip strong">更划算</text>
            <text v-if="!t.available" class="chip ended">活动已结束</text>
          </view>
        </view>
      </view>

      <view v-else class="records">
        <text class="rules-t">已选储值</text>
        <text v-if="!rechargeCart.length" class="empty-selection">购物车里暂无储值商品</text>
        <view v-for="item in rechargeCart" :key="item.amount" class="rec">
          <view class="rec-l">
            <text class="rec-t">{{ item.name }} ×{{ item.qty }}</text>
            <text class="rec-s">每份充 {{ item.amount }} 元，赠 {{ item.bonus }} 元</text>
          </view>
          <text class="rec-v">¥{{ item.amount * item.qty }}</text>
        </view>
      </view>

      <view class="rules">
        <text class="rules-t">储值说明</text>
        <text class="rule">赠送金额与本金一起到账，可用于点单时的余额支付。</text>
        <text class="rule">储值余额长期有效，不可提现，不可转赠。</text>
        <text class="rule">累计储值满 2000 元升级为 深焙会员。</text>
        <text class="rule">{{ useMock ? '当前为演示环境，支付为模拟流程，不会产生真实扣款。' : '支付由微信支付完成，储值到账后可在会员储值查看余额。' }}</text>
      </view>

      <view v-if="useMock && state.recharges.length" class="records">
        <text class="rules-t">储值记录</text>
        <view v-for="r in state.recharges" :key="r.id" class="rec">
          <view class="rec-l">
            <text class="rec-t">储值 {{ r.amount }} 元，赠送 {{ r.bonus }} 元</text>
            <text class="rec-s">{{ ymd(r.at) }} {{ hm(r.at) }}</text>
          </view>
          <text class="rec-v">+{{ r.amount + r.bonus }}</text>
        </view>
      </view>
      <view class="tail" />
    </view>

    <view v-if="payment.amount" class="paybar">
      <view class="pb-l">
        <view class="pb-total">
          <text class="pb-k">实付</text>
          <text class="pb-c">¥</text>
          <text class="pb-n">{{ payment.amount }}</text>
        </view>
        <text class="pb-s">到账 {{ payment.amount + payment.bonus }} 元</text>
      </view>
      <view class="pb-btn" :class="{ busy, off: !payment.available }" hover-class="tap-on" @tap="submit">
        <text class="pb-btn-t">{{ busy ? '支付中…' : fromCart ? '模拟微信支付' : '立即充值' }}</text>
      </view>
    </view>

    <!-- 成功 -->
    <view v-if="done" class="done" :class="{ on: doneOn }">
      <view class="done-card">
        <view class="done-ic">
          <Icon name="check" :size="64" color="#462719" :stroke="3" />
        </view>
        <text class="done-t">充值成功</text>
        <view class="done-v">
          <text class="done-c">+¥</text>
          <text class="done-n">{{ done.amount + done.bonus }}</text>
        </view>
        <text class="done-s">含赠送 {{ done.bonus }} 元，当前余额 ¥{{ money2(currentBalance) }}</text>
        <view class="done-btns">
          <view class="d-btn ghost" hover-class="tap-on" @tap="closeDone">
            <text class="d-btn-t ink">完成</text>
          </view>
          <view class="d-btn" hover-class="tap-on" @tap="toMenu">
            <text class="d-btn-t">去点单</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import Icon from '@/components/Icon.vue'
import Notch from '@/components/Notch.vue'
import { RECHARGE_TIERS } from '@/mock/seed'
import { useMock } from '@/config/env'
import {
  ApiError,
  centToYuan,
  createRecharge,
  getMemberProfile,
  getRecharge,
  listRechargeTiers,
  newRechargeIdempotencyKey,
  toRechargeTiers,
  type MemberProfile,
  type RechargeOrderDto,
  type RechargeTierView
} from '@/api'
import { state, memberLevel, recharge, backToTab, rechargeCart, rechargeCartTotal, changeRechargeQty } from '@/store'
import { hm, money2, ymd } from '@/utils/format'

const LEVEL_NAMES: Record<number, string> = { 1: '可森会员', 2: '醇香会员', 3: '深焙会员' }

const pick = ref(1)
const fromCart = ref(false)
const busy = ref(false)
const done = ref<{ amount: number; bonus: number } | null>(null)
const doneOn = ref(false)

/* ---- 数据源：mock 默认；useMock=false 时拉档位 + 会员资料 ---- */
const realTiers = ref<RechargeTierView[]>([])
const userProfile = ref<MemberProfile | null>(null)
const realBalance = ref<number | null>(null)

// mock 档位保持原演示数据（RECHARGE_TIERS），统一成 RechargeTierView 供模板复用
const mockTiers = computed<RechargeTierView[]>(() =>
  RECHARGE_TIERS.map((tier) => ({
    tierCode: `MOCK_TIER_${tier.amount}`,
    name: tier.name,
    amount: tier.amount,
    bonus: tier.bonus,
    total: tier.amount + tier.bonus,
    note: tier.note,
    hot: tier.hot === true,
    available: true
  }))
)
const tiers = computed<RechargeTierView[]>(() => (useMock ? mockTiers.value : realTiers.value))
const currentBalance = computed(() => (useMock ? state.balance : realBalance.value ?? 0))
const levelName = computed(() => {
  if (useMock) return memberLevel.value.name
  const level = userProfile.value?.level
  return level ? LEVEL_NAMES[level] || '可森会员' : '可森会员'
})

onLoad((q) => {
  // 真实模式暂不支持购物车多档位结算，按单档位选择处理（MenuView 本轮仍 mock）
  fromCart.value = (q?.cart as string) === '1' && useMock
  if (useMock) {
    const i = Number(q?.tier)
    if (i === 0 || i === 1) pick.value = i
  }
})

onMounted(async () => {
  if (useMock) return
  await Promise.all([loadTiers(), loadProfile()])
})

async function loadTiers() {
  try {
    realTiers.value = toRechargeTiers(await listRechargeTiers())
  } catch {
    // 档位接口公开无鉴权；50001/50302 请求层已 toast
    realTiers.value = []
  }
  pickFirstAvailable()
}

async function loadProfile() {
  try {
    userProfile.value = await getMemberProfile()
    realBalance.value = centToYuan(userProfile.value.balanceCent ?? 0)
  } catch {
    // 余额展示失败不阻断充值，成功后会按充值单的 balanceAfterCent 刷新
  }
}

function pickFirstAvailable() {
  const hot = tiers.value.findIndex((tier) => tier.available && tier.hot)
  const any = tiers.value.findIndex((tier) => tier.available)
  pick.value = hot >= 0 ? hot : any >= 0 ? any : 0
}

function selectTier(index: number) {
  const tier = tiers.value[index]
  if (!tier) return
  if (!tier.available) {
    uni.showToast({ title: '该档位活动已结束', icon: 'none' })
    return
  }
  pick.value = index
}

const payment = computed(() => {
  if (fromCart.value) {
    return {
      amount: rechargeCartTotal.value,
      bonus: rechargeCart.value.reduce((sum, item) => sum + item.bonus * item.qty, 0),
      tierCode: '',
      available: rechargeCart.value.length > 0
    }
  }
  const tier = tiers.value[pick.value]
  return tier
    ? { amount: tier.amount, bonus: tier.bonus, tierCode: tier.tierCode, available: tier.available }
    : { amount: 0, bonus: 0, tierCode: '', available: false }
})

/* ---- mock 演示支付 ---- */
let paymentTimer: ReturnType<typeof setTimeout> | undefined

function submitMock() {
  const { amount, bonus } = payment.value
  const paidItems = fromCart.value ? rechargeCart.value : []
  uni.showLoading({ title: '正在调起支付', mask: true })
  paymentTimer = setTimeout(() => {
    paymentTimer = undefined
    recharge(amount, bonus)
    paidItems.forEach((item) => changeRechargeQty(item.amount, -item.qty))
    uni.hideLoading()
    busy.value = false
    done.value = { amount, bonus }
    setTimeout(() => (doneOn.value = true), 30)
  }, 1200)
}

/* ---- 真实充值：独立幂等键（cosen-recharge:），与下单 key 分开 ---- */
let pendingRechargeKey = ''
let pendingRechargeSignature = ''

function clearPendingRechargeKey() {
  pendingRechargeKey = ''
  pendingRechargeSignature = ''
}

function rechargeIdempotencyKeyFor(signature: string): string {
  if (!pendingRechargeKey || pendingRechargeSignature !== signature) {
    pendingRechargeKey = newRechargeIdempotencyKey()
    pendingRechargeSignature = signature
  }
  return pendingRechargeKey
}

let pollCancelled = false
let pollTimer: ReturnType<typeof setTimeout> | undefined

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    pollTimer = setTimeout(resolve, ms)
  })
}

/** pending 轮询：1s / 2s / 3s 退避，之后每 3s 一次，最多 60s */
async function pollRecharge(order: RechargeOrderDto): Promise<RechargeOrderDto | null> {
  const started = Date.now()
  const delays = [1000, 2000, 3000]
  let attempt = 0
  while (!pollCancelled && Date.now() - started < 60000) {
    const delay = delays[Math.min(attempt, delays.length - 1)]
    attempt += 1
    await sleep(delay)
    if (pollCancelled) return null
    try {
      const latest = await getRecharge(order.rechargeNo)
      if (latest.status !== 'pending') return latest
    } catch {
      // 40407 / 401xx / 5xx 等请求层已提示，停止轮询
      return null
    }
  }
  return null
}

/** 到账：优先用充值单余额；缺省时回查会员资料 */
async function applyPaid(order: RechargeOrderDto) {
  if (order.balanceAfterCent != null) {
    realBalance.value = centToYuan(order.balanceAfterCent)
  } else {
    try {
      const profile = await getMemberProfile()
      userProfile.value = profile
      realBalance.value = centToYuan(profile.balanceCent ?? 0)
    } catch {
      // 忽略，成功弹层仍可展示本次到账金额
    }
  }
  uni.hideLoading()
  busy.value = false
  done.value = { amount: centToYuan(order.amountCent), bonus: centToYuan(order.bonusCent) }
  setTimeout(() => (doneOn.value = true), 30)
  // 成功后刷新会员资料：余额以接口为准，同时同步可能升级的会员等级
  void loadProfile()
}

function finishFailed(order: RechargeOrderDto) {
  uni.hideLoading()
  busy.value = false
  const title = order.status === 'failed' ? order.failMsg || '支付失败，请重试' : '支付已关闭'
  uni.showToast({ title, icon: 'none', duration: 2400 })
}

async function submitReal() {
  const { tierCode } = payment.value
  const signature = `${tierCode}|wechat`
  uni.showLoading({ title: '正在拉起支付', mask: true })
  try {
    const order = await createRecharge({ tierCode, payMode: 'wechat' }, rechargeIdempotencyKeyFor(signature))
    clearPendingRechargeKey()
    if (order.status === 'paid') {
      await applyPaid(order)
      return
    }
    if (order.status === 'failed' || order.status === 'closed') {
      finishFailed(order)
      return
    }
    // TODO(wxpay): pending 时真实微信需先 uni.requestPayment(order.wx)；
    // 当前 dev mock 渠道通常直接返回 paid，这里先按契约轮询兜底。
    const settled = await pollRecharge(order)
    if (pollCancelled) return
    if (!settled) {
      uni.hideLoading()
      busy.value = false
      uni.showToast({ title: '支付结果确认中，请稍后查看余额', icon: 'none', duration: 2400 })
      return
    }
    if (settled.status === 'paid') await applyPaid(settled)
    else finishFailed(settled)
  } catch (e) {
    uni.hideLoading()
    busy.value = false
    // 40007 = 同 key 不同 payload，丢弃旧 key；其余错误（40905/40904/40003/40922/50301）请求层已提示
    if (e instanceof ApiError && e.code === 40007) clearPendingRechargeKey()
  }
}

function submit() {
  const { amount, available } = payment.value
  if (busy.value || done.value || !amount) return
  if (!available) {
    uni.showToast({ title: '该档位活动已结束', icon: 'none' })
    return
  }
  busy.value = true
  if (useMock) {
    submitMock()
    return
  }
  void submitReal()
}

onUnload(() => {
  pollCancelled = true
  if (pollTimer !== undefined) {
    clearTimeout(pollTimer)
    pollTimer = undefined
  }
  if (paymentTimer !== undefined) {
    clearTimeout(paymentTimer)
    paymentTimer = undefined
  }
  uni.hideLoading()
})

function closeDone() {
  doneOn.value = false
  setTimeout(() => {
    done.value = null
    const pages = getCurrentPages()
    if (pages.length > 1) uni.navigateBack()
  }, 220)
}
function toMenu() {
  backToTab('menu')
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
.now {
  padding: 30rpx 34rpx;
  border-radius: 40rpx;
  background: $espresso;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: $shadow-coffee;
}
.now-l {
  display: flex;
  flex-direction: column;
}
.now-k {
  font-size: 23rpx;
  color: $cream;
}
.now-v {
  display: flex;
  align-items: baseline;
  color: $paper;
}
.now-c {
  font-size: 28rpx;
  font-weight: 700;
  margin-right: 4rpx;
}
.now-n {
  font-size: 56rpx;
  font-weight: 800;
  @include num;
}
.level {
  height: 48rpx;
  padding: 0 18rpx 0 14rpx;
  border-radius: 16rpx;
  background: $caramel;
  display: flex;
  align-items: center;
}
.level-t {
  margin-left: 6rpx;
  font-size: 22rpx;
  font-weight: 700;
  color: $roast;
}
.head {
  padding: 48rpx 8rpx 20rpx;
  display: flex;
  align-items: baseline;
}
.head-t {
  font-size: 36rpx;
  font-weight: 800;
}
.head-s {
  margin-left: 14rpx;
  font-size: 23rpx;
  color: $ink-3;
}
.tiers {
  display: flex;
  justify-content: space-between;
}
.tier {
  width: 338rpx;
  padding: 12rpx 12rpx 22rpx;
  border-radius: 44rpx;
  background: $paper;
  box-shadow: $shadow-soft;
  border: 4rpx solid transparent;
  transition: border-color 0.2s ease;
  &.on {
    border-color: $espresso;
  }
  &.off {
    opacity: 0.5;
    border-color: transparent;
    box-shadow: none;
  }
}
.pic {
  position: relative;
  height: 300rpx;
  border-radius: 34rpx;
  overflow: hidden;
  &.p0 {
    background: linear-gradient(160deg, #c9d6b4 0%, #9db27f 100%);
  }
  &.p1 {
    background: linear-gradient(160deg, #905D3B 0%, #462719 100%);
  }
}
.pic-orb {
  position: absolute;
  border-radius: 50%;
  &.a {
    width: 200rpx;
    height: 200rpx;
    left: -60rpx;
    bottom: 10rpx;
    background: rgba(255, 255, 255, 0.16);
  }
  &.b {
    width: 110rpx;
    height: 110rpx;
    left: 80rpx;
    bottom: 120rpx;
    background: rgba(0, 0, 0, 0.1);
  }
}
.amt {
  position: absolute;
  left: 28rpx;
  bottom: 84rpx;
  display: flex;
  align-items: baseline;
}
.amt-n {
  font-size: 84rpx;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -3rpx;
  color: $roast;
  @include num;
}
.amt-u {
  margin-left: 6rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: $roast;
}
.p1 .amt-n,
.p1 .amt-u {
  color: $paper;
}
.bonus {
  display: flex;
  align-items: baseline;
  color: $toffee;
}
.bonus-k {
  font-size: 22rpx;
  font-weight: 700;
  margin-right: 2rpx;
}
.bonus-n {
  font-size: 40rpx;
  font-weight: 800;
  @include num;
}
.band {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 60rpx;
  background: $toffee;
  display: flex;
  align-items: center;
  justify-content: center;
}
.p1 .band {
  background: $caramel;
}
.band-t {
  font-size: 22rpx;
  font-weight: 600;
  color: $paper;
}
.p1 .band-t {
  color: $roast;
}
.t-foot {
  margin-top: 18rpx;
  padding: 0 10rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.t-name {
  font-size: 30rpx;
  font-weight: 700;
}
.t-check {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 3rpx solid rgba($ink, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  &.on {
    background: $espresso;
    border-color: $espresso;
  }
}
.chips {
  margin-top: 12rpx;
  padding: 0 4rpx;
  display: flex;
  flex-wrap: wrap;
}
.chip {
  margin: 0 6rpx 6rpx;
  padding: 6rpx 18rpx;
  border-radius: 999rpx;
  background: $latte;
  font-size: 21rpx;
  color: $ink-2;
  &.strong {
    background: $caramel;
    color: $roast;
    font-weight: 700;
  }
  &.ended {
    background: #d8d8d0;
    color: $ink-3;
  }
}
.rules,
.records {
  margin-top: 26rpx;
  padding: 30rpx 32rpx;
  border-radius: 40rpx;
  background: $paper;
  display: flex;
  flex-direction: column;
}
.rules-t {
  font-size: 28rpx;
  font-weight: 700;
  margin-bottom: 10rpx;
}
.empty-selection {
  font-size: 24rpx;
  color: $ink-2;
}
.rule {
  position: relative;
  padding-left: 24rpx;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: $ink-2;
}
.rule::before {
  content: '';
  position: absolute;
  left: 0;
  top: 16rpx;
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: $caramel;
}
.rec {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx 0;
  border-bottom: 1rpx solid $line;
}
.rec-l {
  display: flex;
  flex-direction: column;
}
.rec-t {
  font-size: 26rpx;
  font-weight: 600;
}
.rec-s {
  font-size: 22rpx;
  color: $ink-3;
  @include num;
}
.rec-v {
  font-size: 32rpx;
  font-weight: 800;
  color: $toffee;
  @include num;
}
.tail {
  height: calc(env(safe-area-inset-bottom) + 200rpx);
}
.paybar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 28rpx calc(env(safe-area-inset-bottom) + 20rpx) 40rpx;
  background: rgba($paper, 0.96);
  box-shadow: 0 -1rpx 0 $line;
  display: flex;
  align-items: center;
  z-index: 50;
}
.pb-l {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.pb-total {
  display: flex;
  align-items: baseline;
}
.pb-k {
  font-size: 24rpx;
  color: $ink-2;
  margin-right: 10rpx;
}
.pb-c {
  font-size: 26rpx;
  font-weight: 700;
}
.pb-n {
  font-size: 50rpx;
  font-weight: 800;
  @include num;
}
.pb-s {
  font-size: 22rpx;
  color: $toffee;
  font-weight: 600;
}
.pb-btn {
  height: 96rpx;
  padding: 0 60rpx;
  border-radius: 32rpx;
  background: $espresso;
  display: flex;
  align-items: center;
  box-shadow: $shadow-coffee;
  &.busy,
  &.off {
    opacity: 0.5;
  }
}
.pb-btn-t {
  font-size: 30rpx;
  font-weight: 700;
  color: $paper;
}

/* 成功弹层 */
.done {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 300;
  background: rgba(22, 33, 25, 0);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.25s ease;
  &.on {
    background: rgba(22, 33, 25, 0.5);
  }
}
.done-card {
  width: 600rpx;
  padding: 56rpx 40rpx 40rpx;
  border-radius: 56rpx;
  background: $paper;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: scale(0.9);
  opacity: 0;
  transition: transform 0.28s cubic-bezier(0.22, 0.8, 0.26, 1), opacity 0.2s ease;
}
.done.on .done-card {
  transform: scale(1);
  opacity: 1;
}
.done-ic {
  width: 120rpx;
  height: 120rpx;
  border-radius: 44rpx;
  background: $caramel;
  display: flex;
  align-items: center;
  justify-content: center;
}
.done-t {
  margin-top: 26rpx;
  font-size: 34rpx;
  font-weight: 800;
}
.done-v {
  margin-top: 6rpx;
  display: flex;
  align-items: baseline;
  color: $toffee;
}
.done-c {
  font-size: 32rpx;
  font-weight: 800;
}
.done-n {
  font-size: 84rpx;
  font-weight: 800;
  @include num;
}
.done-s {
  font-size: 24rpx;
  color: $ink-2;
}
.done-btns {
  margin-top: 40rpx;
  width: 100%;
  display: flex;
}
.d-btn {
  flex: 1;
  height: 92rpx;
  border-radius: 30rpx;
  background: $espresso;
  display: flex;
  align-items: center;
  justify-content: center;
  &.ghost {
    margin-right: 18rpx;
    background: $latte;
  }
}
.d-btn-t {
  font-size: 28rpx;
  font-weight: 700;
  color: $paper;
  &.ink {
    color: $espresso;
  }
}
</style>

<template>
  <view class="screen">
    <text class="merchant">可森 COSEN</text>
    <text class="heading">{{ orderLocked ? '订单付款' : '门店付款' }}</text>
    <view class="panel">
      <view v-if="orderLocked" class="order-lock-meta">
        <view class="order-lock-head">
          <text class="order-lock-badge">代客点单 · 订单金额已锁定</text>
          <text v-if="pickupCode" class="order-lock-pickup">取餐号 {{ pickupCode }}</text>
        </view>
        <text v-if="orderSummary" class="order-lock-summary">{{ orderSummary }}</text>
        <text v-if="lockedOrderNo" class="order-lock-no">订单号 #{{ lockedOrderNo }}</text>
      </view>
      <text class="label">{{ orderLocked ? '应付金额（固定不可修改）' : '付款金额' }}</text>
      <view v-if="orderLocked" class="amount locked-amount">
        <text>¥</text>
        <text class="locked-amount-val">{{ amount || '0.00' }}</text>
      </view>
      <view v-else class="amount"><text>¥</text><input v-model="amount" type="digit" placeholder="0.00" maxlength="9" :disabled="locked || busy || !validEntry" /></view>
      <text v-if="message" class="message" aria-live="polite">{{ message }}</text>
      <button v-if="paid && !orderLocked" class="primary" @tap="reset">再付一笔</button>
      <button v-else-if="paid && orderLocked" class="primary" disabled>订单已完成支付</button>
      <button v-else-if="checking" class="primary" :disabled="busy" @tap="refresh">查询到账结果</button>
      <button v-else class="primary" :disabled="busy || !validEntry || !cents" @tap="submit">{{ busy ? '正在处理…' : orderLocked ? `微信支付 ¥${amount}` : '微信支付' }}</button>
      <button v-if="checking && validEntry" class="link" :disabled="busy" @tap="submit">继续支付同一笔</button>
      <button v-if="canRestart && !orderLocked" class="link" @tap="reset">重新输入金额</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { request, genIdempotencyKey } from '@/api/request'
import { requestWechatPayment, WechatPayError } from '@/api/payment'
import type { WechatPayParams } from '@/api/types'

type Draft = { intent: string; cents: number; no?: string; key?: string; waiting?: boolean }
type Receipt = { status: string; amountCent: number; orderNo?: string; locked?: boolean }
type Prepay = Receipt & { payNo: string; receiptKey: string; wechatPayParams?: WechatPayParams }
type CollectionEntry = { title?: string; mode?: string; locked?: boolean; orderNo?: string; pickupCode?: string; amountCent?: number; status?: string; summary?: string }
const amount = ref(''), scene = ref(''), message = ref(''), busy = ref(false), paid = ref(false)
const validEntry = ref(false), checking = ref(false), canRestart = ref(false), draft = ref<Draft | null>(null)
const orderLocked = ref(false), lockedOrderNo = ref(''), pickupCode = ref(''), orderSummary = ref('')
const locked = computed(() => orderLocked.value || !!draft.value)
const cents = computed(() => {
  if (!/^\d{1,6}(?:\.\d{0,2})?$/.test(amount.value)) return 0
  const [whole, part = ''] = amount.value.split('.')
  const n = Number(whole) * 100 + Number(part.padEnd(2, '0'))
  return n > 0 && n <= 10000000 ? n : 0
})
const storage = () => 'cosen-collection:' + scene.value
function save(d: Draft) { draft.value = d; uni.setStorageSync(storage(), d) }
async function reset() {
  if (busy.value || orderLocked.value) return
  uni.removeStorageSync(storage())
  draft.value = null; amount.value = ''; checking.value = false; paid.value = false; canRestart.value = false; message.value = ''
  await validateEntry()
}
function done() {
  checking.value = false; paid.value = true; canRestart.value = false
  message.value = orderLocked.value ? '订单付款成功，门店正在为您制作。' : '付款成功，门店已收到。'
  uni.removeStorageSync(storage())
}
async function status() {
  const d = draft.value
  if (!d?.no || !d?.key) return false
  const r = await request<Receipt>('/app/store/collection/receipts/' + d.no,
    { auth: false, silent: true, headers: { 'X-Receipt-Key': d.key } })
  if (r.status === 'paid') { done(); return true }
  if (r.status === 'closed') {
    checking.value = false; canRestart.value = !orderLocked.value
    message.value = orderLocked.value ? '该订单已关闭，请联系店员重新发起。' : '这笔付款已关闭，请重新输入金额。'
    return true
  }
  return false
}
async function refresh() {
  if (busy.value) return
  busy.value = true
  try { if (!(await status())) message.value = '等待微信确认到账，请稍后查询。' }
  catch { message.value = '暂时无法查询，请稍后重试。' }
  finally { busy.value = false }
}
async function validateEntry() {
  try {
    const info = await request<CollectionEntry>('/app/store/collection', { auth: false, silent: true, query: { scene: scene.value } })
    validEntry.value = true
    if (info && info.locked) {
      orderLocked.value = true
      lockedOrderNo.value = String(info.orderNo || '')
      pickupCode.value = String(info.pickupCode || '')
      orderSummary.value = String(info.summary || '')
      if (Number(info.amountCent) > 0) {
        amount.value = (Number(info.amountCent) / 100).toFixed(2)
      }
      if (info.status === 'paid') {
        done()
      }
    } else {
      orderLocked.value = false
    }
  } catch (e: any) { validEntry.value = false; message.value = e.message || '请重扫门店收款码。' }
}
function extractCollectionScene(query?: Record<string, any> | null): string {
  if (!query || typeof query !== 'object') return ''
  if (query.scene) {
    let raw = String(query.scene)
    try { raw = decodeURIComponent(raw) } catch { /* keep raw */ }
    if (/^p_[0-9a-f]{28}$/.test(raw)) return raw
  }
  if (query.q) {
    let url = String(query.q)
    try { url = decodeURIComponent(url) } catch { /* keep raw */ }
    const pathMatch = url.match(/\/pay\/(p_[0-9a-f]{28})(?:[/?#]|$)/)
    if (pathMatch) return pathMatch[1]
    const paramMatch = url.match(/[?&]scene=(p_[0-9a-f]{28})(?:[&#]|$)/)
    if (paramMatch) return paramMatch[1]
  }
  return ''
}
onLoad(async (query) => {
  try {
    scene.value = extractCollectionScene(query as Record<string, any>)
    if (!/^p_[0-9a-f]{28}$/.test(scene.value)) throw new Error('请扫描门店收款码。')
    const saved = uni.getStorageSync(storage()) as Draft | undefined
    if (saved?.intent && saved.cents) {
      draft.value = saved; amount.value = (saved.cents / 100).toFixed(2)
      checking.value = !!saved.waiting
      try { if (await status()) return }
      catch { message.value = '上次付款状态待查询。' }
    }
    await validateEntry()
    if (orderLocked.value && validEntry.value && !paid.value && !checking.value && cents.value > 0) {
      void submit()
    }
  } catch (e: any) { message.value = e.message || '收款码暂不可用，请重扫门店收款码。' }
})
async function submit() {
  if (busy.value || !validEntry.value || !cents.value || paid.value) return
  busy.value = true; message.value = ''; canRestart.value = false
  try {
    const d = draft.value || { intent: genIdempotencyKey(), cents: cents.value }
    save(d)
    const login = await uni.login({ provider: 'weixin' })
    const res = await request<Prepay>('/app/store/collection/prepay', {
      auth: false, silent: true, method: 'POST',
      data: { code: login.code, intent: d.intent, amountCent: d.cents, scene: scene.value }
    })
    if (res.status === 'paid') { done(); return }
    if (!res.wechatPayParams) throw new Error('微信支付参数缺失，请重试。')
    save({ ...d, no: res.payNo, key: res.receiptKey, waiting: true })
    checking.value = true
    await requestWechatPayment(res.wechatPayParams)
    message.value = '正在确认到账…'
    for (let i = 0; i < 6; i++) {
      if (await status()) return
      await new Promise(resolve => setTimeout(resolve, 1100))
    }
    message.value = '支付结果确认中，请稍后查询。'
  } catch (e: any) {
    message.value = e.message || '暂时无法付款，请重试。'
    if (e instanceof WechatPayError && e.cancelled && draft.value) {
      save({ ...draft.value, waiting: false }); checking.value = false; canRestart.value = !orderLocked.value
    } else if (e.code === 40929) {
      checking.value = false; canRestart.value = !orderLocked.value
    } else if (!checking.value) canRestart.value = !orderLocked.value
  } finally { busy.value = false }
}
</script>
<style scoped>
.screen{min-height:100vh;box-sizing:border-box;padding:90rpx 40rpx;background:#f7f1e8;color:#422e24}
.merchant,.heading,.label,.message{display:block}.merchant{font-size:25rpx;color:#715640}.heading{margin:18rpx 0 48rpx;font-size:54rpx;font-weight:600}
.panel{background:#fffcf8;border:1px solid #e6d9c9;padding:36rpx;border-radius:32rpx}.label{font-size:28rpx;color:#715640}
.order-lock-meta{margin-bottom:28rpx;padding:24rpx 26rpx;border-radius:22rpx;background:#f5ece0;border:1px solid #e2d2be}
.order-lock-head{display:flex;align-items:center;justify-content:space-between;gap:16rpx;margin-bottom:10rpx}
.order-lock-badge{font-size:24rpx;font-weight:600;color:#2e5e3e;background:rgba(46,94,62,0.1);padding:6rpx 16rpx;border-radius:999rpx}
.order-lock-pickup{font-size:26rpx;font-weight:700;color:#462719}
.order-lock-summary{display:block;font-size:28rpx;font-weight:600;color:#38251a;margin-top:6rpx}
.order-lock-no{display:block;font-size:22rpx;color:#856951;margin-top:6rpx}
.amount{display:flex;align-items:center;gap:18rpx;padding:28rpx 0;border-bottom:1px solid #dccdbf;font-size:56rpx}
.amount input{flex:1;height:90rpx;font-size:70rpx}
.locked-amount-val{font-size:72rpx;font-weight:700;color:#38251a;line-height:90rpx}
.message{margin-top:24rpx;font-size:26rpx;line-height:1.6}
.primary{margin-top:36rpx;background:#52392b;color:#fff;border-radius:24rpx;font-size:32rpx}.link{background:transparent;margin-top:14rpx;font-size:26rpx;color:#765642}
</style>

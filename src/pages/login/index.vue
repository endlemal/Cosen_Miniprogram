<template>
  <view class="login-page">
    <view class="poster-frame" aria-hidden="true">
      <image class="poster" src="/static/member-login.jpg" mode="scaleToFill" :style="posterStyle" />
    </view>
    <NavBar title="会员登录" overlay :placeholder="false" />
    <view class="actions">
      <view class="welcome" :style="shiftStyle">
        <!-- 未绑定手机号：只给一条绿色胶囊登录条，不展示头像/昵称 -->
        <view v-if="!ready" class="phone-gate">
          <!-- #ifdef MP-WEIXIN -->
          <button v-if="useMock" class="wx-pill" :disabled="busy || checking" hover-class="wx-pill-hover" @tap="onLoginTap">
            <Icon name="chat" :size="36" color="#ffffff" /><text class="wx-pill-t">{{ pillLabel }}</text>
          </button>
          <button v-else class="wx-pill" open-type="getPhoneNumber" :disabled="busy || checking" hover-class="wx-pill-hover" @getphonenumber="wechatLogin">
            <Icon name="chat" :size="36" color="#ffffff" /><text class="wx-pill-t">{{ pillLabel }}</text>
          </button>
          <!-- #endif -->
          <!-- #ifndef MP-WEIXIN -->
          <button class="wx-pill" :disabled="busy || checking" hover-class="wx-pill-hover" @tap="onLoginTap">
            <Icon name="chat" :size="36" color="#ffffff" /><text class="wx-pill-t">{{ pillLabel }}</text>
          </button>
          <!-- #endif -->
        </view>
        <!-- 绑定后才出现头像与昵称，点击可改，再滑动进入 -->
        <view v-if="ready" class="identity reveal">
          <view class="avatar">
            <image v-if="avatarUrl && failedAvatar !== avatarUrl" :key="avatarUrl" class="portrait" :src="avatarUrl" mode="aspectFill" @error="failedAvatar = avatarUrl" />
            <image v-else class="cat-sheet" src="/static/member-cats.png" :style="catPosition" mode="scaleToFill" aria-label="咖啡猫头像" />
            <view class="avatar-mask" :class="{ saving: savingAvatar }">
              <text v-if="savingAvatar" class="avatar-saving">…</text>
              <Icon v-else name="camera" :size="40" color="#fff4e1" />
            </view>
            <!-- #ifdef MP-WEIXIN -->
            <button class="avatar-picker" open-type="chooseAvatar" hover-class="none" aria-label="更换头像" @chooseavatar="onChooseAvatar" />
            <!-- #endif -->
            <!-- #ifndef MP-WEIXIN -->
            <view class="avatar-picker" role="button" aria-label="更换头像" @tap="onAvatarTap" />
            <!-- #endif -->
          </view>
          <view v-if="!editingName" class="name-hit" role="button" :aria-label="'昵称 ' + displayName + '，点击修改'" @tap="startEditName">
            <text class="nickname">{{ displayName }}</text>
            <Icon class="name-edit" name="edit" :size="30" color="#f8e3c6" />
          </view>
          <view v-else class="name-editor">
            <input
              v-model="draftName" class="name-input" type="nickname" maxlength="24" aria-label="会员昵称"
              placeholder="输入新昵称" placeholder-style="color:#a4886f" confirm-type="done"
              :focus="editingName" :adjust-position="false" :cursor-spacing="16"
              @confirm="commitName" @blur="commitName"
            />
            <text class="name-hint">完成或点击空白处保存</text>
          </view>
        </view>
        <CoffeeLoginSlider v-if="ready" :authorize="false" :phone-authorization="false" :disabled="busy"
          label="向右滑动进入" @confirm="enter" />
        <view class="below-action" :class="{ concealed: ready }" :aria-hidden="ready">
          <!-- #ifdef H5 -->
          <text v-if="!useMock" class="note">请在微信小程序内完成手机号授权</text>
          <!-- #endif -->
          <view class="secondary">
            <button :disabled="busy || ready" @tap="goHome">先随便逛逛</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CoffeeLoginSlider from '@/components/CoffeeLoginSlider.vue'
import Icon from '@/components/Icon.vue'
import { catIndex } from '@/utils/cat-cover'
import { mediaUrl } from '@/utils/media'
import type { MemberProfile } from '@/api/types'
import { setMemberProfile } from '@/store/member'
import NavBar from '@/components/NavBar.vue'
import { useMock } from '@/config/env'
import { getMemberProfile, hasToken, isLocalTempAvatar, isSignedOut, loginByWechat, setToken, updateMemberProfile, uploadMemberAvatar } from '@/api'

const instance = getCurrentInstance()

const draftName = ref('')
const editingName = ref(false)
const pendingName = ref('')
const pendingAvatar = ref('')
const localNickname = ref('')
const localAvatar = ref('')
const savingName = ref(false)
const savingAvatar = ref(false)
const busy = ref(false)

const profile = ref<MemberProfile | null>(null)
const checking = ref(false)
const demoReady = ref(useMock && hasToken())
const ready = computed(() => useMock ? demoReady.value : profile.value?.phoneBound === true)
const signedIn = computed(() => hasToken() && !!profile.value)
const pillLabel = computed(() => {
  if (checking.value) return '正在读取会员资料…'
  if (busy.value) return '正在授权…'
  return useMock ? '进入演示登录' : '微信手机号一键登录'
})
const failedAvatar = ref('')

/** 键盘弹起时上移的距离（px）；只作用于头像/昵称 + 滑动条所在的 .welcome */
const keyboard = ref(0)
const shift = ref(0)
const shiftStyle = computed(() => shift.value > 0 ? { transform: `translate3d(0, -${shift.value}px, 0)` } : {})

/** 背景原图 1440 × 2560；等比覆盖，按屏幕比例调整裁切位置，不拉伸、不模糊。 */
const POSTER_RATIO = 1440 / 2560

function windowSize() {
  const api = uni as unknown as { getWindowInfo?: () => { windowWidth?: number; windowHeight?: number } }
  const info = typeof api.getWindowInfo === 'function' ? api.getWindowInfo() : uni.getSystemInfoSync()
  return { width: info.windowWidth || 375, height: info.windowHeight || 667 }
}

const viewport = ref(windowSize())

/**
 * 背景铺法：
 *  - 手机/竖屏：按高度铺满（左右裁切），保证纵向完整；
 *  - 宽屏：只铺左侧海报栏（与 .actions 的宽屏布局对齐），栏内再等比覆盖；
 *  - 需要竖直裁切时，把裁切锚点放在图内 10%–45% 的字标+消息卡片区域（中心约 28%），
 *    避免把「可森 COSEN」和消息框裁掉，也不额外加任何模糊/整层压暗。
 */
const posterStyle = computed(() => {
  const vw = viewport.value.width
  const vh = viewport.value.height
  if (!vw || !vh) return {}
  const wide = vw >= vh
  const boxW = wide ? Math.min(vw * 0.49, vh * 0.5628) : vw
  const boxH = vh
  let w = boxW
  let h = boxH
  if (boxW / boxH <= POSTER_RATIO) {
    h = boxH
    w = h * POSTER_RATIO
  } else {
    w = boxW
    h = w / POSTER_RATIO
  }
  let left = wide ? (boxW - w) / 2 : (vw - w) / 2
  let top = 0
  if (h > boxH) {
    top = boxH / 2 - h * 0.28
    top = Math.min(0, Math.max(boxH - h, top))
  }
  // 竖屏底部还有图片自带的「COFFEE · LIGHT · MOMENTS」装饰字，会和真实按钮/协议文字重叠。
  // 多放 8% 的高度（仍等比、不拉伸）把装饰字裁到屏幕外，给底部控件留出干净区域。
  if (!wide) {
    w *= 1.08
    h *= 1.08
    left = (vw - w) / 2
    top = 0
  }
  return {
    width: `${Math.round(w)}px`,
    height: `${Math.round(h)}px`,
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`
  }
})

function onViewportResize() {
  viewport.value = windowSize()
}

function visitorNumber(): string {
  const key = 'cosen:login-visitor-number'
  const generated = String(Math.floor(100000 + Math.random() * 900000))
  try {
    const stored = uni.getStorageSync(key)
    if (typeof stored === 'string' && /^\d{6}$/.test(stored)) return stored
    uni.setStorageSync(key, generated)
  } catch { /* 存储不可用时，本次页面仍使用同一编号。 */ }
  return generated
}

const visitor = visitorNumber()
/** 当前可展示的昵称：已保存昵称 > 登录前暂存 > 演示本地修改 */
const currentNickname = computed(() => {
  const saved = profile.value?.nickname?.trim()
  return saved || pendingName.value.trim() || localNickname.value.trim()
})
const displayName = computed(() => {
  const name = currentNickname.value
  if (name && name !== '微信用户') return name
  return '可森' + (profile.value?.id ? String(profile.value.id).padStart(6, '0') : visitor)
})
const avatarUrl = computed(() => {
  const pending = pendingAvatar.value.trim()
  if (pending) return isLocalTempAvatar(pending) || /^(data:|\/static\/)/.test(pending) ? pending : mediaUrl(pending)
  const local = localAvatar.value.trim()
  if (local) return isLocalTempAvatar(local) || /^(data:|\/static\/)/.test(local) ? local : mediaUrl(local)
  const saved = profile.value?.avatarUrl?.trim() || ''
  if (!saved || isLocalTempAvatar(saved)) return ''
  return /^(data:|\/static\/)/.test(saved) ? saved : mediaUrl(saved)
})
const catPosition = computed(() => {
  const index = catIndex(profile.value?.memberNo || String(profile.value?.id || visitor))
  return { left: -(index % 5) * 100 + '%', top: -Math.floor(index / 5) * 100 + '%' }
})

function applyProfile(member: MemberProfile) {
  profile.value = member
  setMemberProfile(member)
  failedAvatar.value = ''
}

let revision = 0
onShow(async () => {
  if (useMock || busy.value) return
  if (isSignedOut()) { profile.value = null; return }
  // #ifndef MP-WEIXIN
  if (!hasToken()) { profile.value = null; return }
  // #endif
  const current = ++revision
  checking.value = true
  try {
    const member = await getMemberProfile()
    if (current === revision) applyProfile(member)
  } catch {
    if (current === revision) profile.value = null
  } finally {
    if (current === revision) checking.value = false
  }
})

function toast(title: string) {
  uni.showToast({ title, icon: 'none', duration: 1800 })
}

/* ---------------- 头像：遮罩层 + 编辑图标，点击换头像 ---------------- */

function onAvatarTap() {
  if (busy.value || savingAvatar.value) return
  // #ifdef MP-WEIXIN
  toast('请点击头像选择微信头像')
  // #endif
  // #ifndef MP-WEIXIN
  toast('请在微信小程序内更换头像')
  // #endif
}

function onChooseAvatar(event: { detail?: { avatarUrl?: string } }) {
  if (busy.value || savingAvatar.value) return
  const url = event?.detail?.avatarUrl
  if (!url) return
  pendingAvatar.value = url
  failedAvatar.value = ''
  if (useMock) {
    localAvatar.value = url
    pendingAvatar.value = ''
    toast('演示模式：头像仅本次演示生效')
    return
  }
  // 未登录时先暂存，微信手机号登录成功后再提交，避免无 token 请求。
  if (!signedIn.value) return
  persistAvatar(url)
}

async function persistAvatar(url: string) {
  if (savingAvatar.value) return
  savingAvatar.value = true
  try {
    const updated = isLocalTempAvatar(url)
      ? await uploadMemberAvatar(url)
      : await updateMemberProfile({ avatarUrl: url })
    applyProfile(updated)
    pendingAvatar.value = ''
    toast('头像已更新')
  } catch {
    // 请求层已提示错误；保留本地预览，可再次点击重试。
  } finally {
    savingAvatar.value = false
  }
}

/* ---------------- 昵称：点击编号进入内联编辑 ---------------- */

function startEditName() {
  if (busy.value || checking.value || editingName.value) return
  draftName.value = currentNickname.value
  editingName.value = true
  // 记录未上移位形，键盘弹起时才能算出滑块底部到窗口底的距离。
  nextTick(() => { baseReady = false; captureBase() })
}

async function commitName() {
  if (!editingName.value) return
  const name = draftName.value.trim().slice(0, 24)
  editingName.value = false
  baseReady = false
  keyboard.value = 0
  shift.value = 0
  if (!name) { toast('昵称不能为空'); return }
  if (name === currentNickname.value) return
  pendingName.value = name
  if (useMock) {
    localNickname.value = name
    pendingName.value = ''
    toast('演示模式：昵称仅本次演示生效')
    return
  }
  if (!signedIn.value) { toast('昵称将在微信登录后保存'); return }
  if (savingName.value) return
  savingName.value = true
  try {
    const updated = await updateMemberProfile({ nickname: name })
    applyProfile(updated)
    pendingName.value = ''
    toast('昵称已更新')
  } catch {
    // 请求层已提示错误；draft 内容保留在 pendingName 里，下次登录仍会带上。
  } finally {
    savingName.value = false
  }
}

/* ---------------- 键盘弹起：头像昵称 + 滑动条整体上移 ---------------- */

let baseGap = 0
let baseTop = 0
let baseReady = false
let capturing = false

function windowHeight(): number {
  const api = uni as unknown as { getWindowInfo?: () => { windowHeight?: number } }
  if (typeof api.getWindowInfo === 'function') return api.getWindowInfo().windowHeight || 0
  return uni.getSystemInfoSync().windowHeight || 0
}

/**
 * 记录未上移位形：below-action 顶部 = 滑动条底部，identity 顶部用于避免上移顶到导航栏。
 * 注意不能直接选 .slide-track：它在 CoffeeLoginSlider 子组件内，小程序页面查询不到子组件节点。
 */
function captureBase(): Promise<void> {
  if (capturing) return Promise.resolve()
  capturing = true
  return new Promise<void>((resolve) => {
    const finish = () => { capturing = false; resolve() }
    try {
      uni.createSelectorQuery().in(instance?.proxy)
        .select('.below-action').boundingClientRect()
        .select('.identity').boundingClientRect()
        .exec((res: Array<{ top?: number; bottom?: number } | null>) => {
          const below = res?.[0]
          const identity = res?.[1]
          if (below?.top != null && identity?.top != null) {
            baseGap = Math.max(0, windowHeight() - below.top)
            baseTop = identity.top
            baseReady = true
          }
          finish()
        })
    } catch { finish() }
  })
}

function applyShift() {
  // 只有正在编辑昵称时才上移，避免其他场景的键盘事件把登录区顶走。
  if (!keyboard.value || !editingName.value) { shift.value = 0; return }
  if (!baseReady) {
    captureBase().then(() => { if (keyboard.value) applyShift() })
    return
  }
  const needed = Math.max(0, keyboard.value - baseGap + 12)
  // 不要顶到导航栏，至少给顶部留 88px。
  const room = Math.max(0, baseTop - 88)
  shift.value = Math.round(Math.min(needed, room))
}

function onKeyboardHeight(event: { height?: number }) {
  keyboard.value = Math.max(0, Math.round(event?.height || 0))
  applyShift()
}

function resetKeyboard() {
  keyboard.value = 0
  shift.value = 0
  baseReady = false
}

onMounted(() => {
  nextTick(() => { if (editingName.value) captureBase() })
  uni.onWindowResize(onViewportResize)
  // #ifdef MP-WEIXIN
  try { uni.onKeyboardHeightChange(onKeyboardHeight) } catch { /* 低版本基础库没有该事件 */ }
  // #endif
  // #ifdef H5
  const vv = window.visualViewport
  if (vv) {
    vv.addEventListener('resize', onViewportChange)
    vv.addEventListener('scroll', onViewportChange)
  }
  // #endif
})

onUnmounted(() => {
  uni.offWindowResize(onViewportResize)
  // #ifdef MP-WEIXIN
  try { uni.offKeyboardHeightChange(onKeyboardHeight) } catch { /* ignore */ }
  // #endif
  // #ifdef H5
  const vv = window.visualViewport
  if (vv) {
    vv.removeEventListener('resize', onViewportChange)
    vv.removeEventListener('scroll', onViewportChange)
  }
  // #endif
})

// #ifdef H5
/** H5 没有键盘高度事件，用 visualViewport 收缩量近似（真机浏览器调试用）。 */
function onViewportChange() {
  if (!editingName.value) return
  const vv = window.visualViewport
  if (!vv) return
  const height = Math.max(0, Math.round(window.innerHeight - vv.height))
  const next = height > 80 ? height : 0
  if (next !== keyboard.value) {
    keyboard.value = next
    applyShift()
  }
}
// #endif

/* ---------------- 登录进入 ---------------- */

function enter() {
  if (busy.value || checking.value || !ready.value || !hasToken()) return
  busy.value = true
  uni.reLaunch({ url: '/pages/index/index', fail: () => { busy.value = false } })
}

function onLoginTap() {
  if (busy.value) return
  if (useMock) {
    setToken('mock-demo-token')
    demoReady.value = true
    return
  }
  // #ifndef MP-WEIXIN
  toast('请在微信小程序内完成手机号授权')
  // #endif
}

function wechatLogin(event: { detail?: { code?: string } }) {
  if (busy.value || useMock || ready.value) return
  resetKeyboard()
  const phoneCode = event.detail?.code
  if (!phoneCode) return toast('请授权微信手机号后登录')
  // #ifdef MP-WEIXIN
  revision++
  checking.value = false
  busy.value = true
  uni.login({
    provider: 'weixin',
    success: async (res) => {
      if (!res.code) {
        busy.value = false
        toast('微信登录失败，请重试')
        return
      }
      try {
        const session = await loginByWechat({
          code: res.code,
          phoneCode,
          nickname: pendingName.value.trim() || undefined
        })
        applyProfile(session.member)
        pendingName.value = ''
        editingName.value = false
        if (pendingAvatar.value) await persistAvatar(pendingAvatar.value)
        if (!session.member.phoneBound) toast('手机号未绑定，请重试')
      } catch {
        // 请求层已提示错误，允许重新授权。
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

function goHome() {
  uni.reLaunch({ url: '/pages/index/index' })
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh; min-height: 100dvh; position: relative; isolation: isolate;
  display: flex; flex-direction: column; justify-content: flex-end;
  background: #352016; color: #fff7e8;
}
/* 背景层：只做等比覆盖裁切，不加模糊、拉伸或整层透明度 */
.poster-frame { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
.poster { position: absolute; max-width: none; max-height: none; display: block; }
.actions {
  position: relative; padding: 90px 26px calc(22px + env(safe-area-inset-bottom));
  width: 100%; max-width: 440px; align-self: center;
}
.welcome { transition: transform .22s ease-out; will-change: transform; }
.identity { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 22px; }
/* 未绑定手机号：绿色胶囊登录条，替代此前的咖啡杯滑动条 */
.phone-gate { width: 100%; }
.wx-pill {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  width: 100%; height: 64px; margin: 0; padding: 0 24px; box-sizing: border-box;
  border: 0; border-radius: 40px; color: #fff;
  background: linear-gradient(180deg, #35d87c 0%, #07c160 52%, #06ad56 100%);
  font: 600 17px/1.2 $font-display; letter-spacing: 1px;
  box-shadow: 0 10px 24px rgba(6,193,96,.30), inset 0 1px 0 rgba(255,255,255,.38);
  transition: transform .16s ease, box-shadow .16s ease;
}
.wx-pill::after { border: 0; }
.wx-pill-hover { transform: translateY(1px) scale(.995); box-shadow: 0 4px 14px rgba(6,193,96,.24), inset 0 1px 0 rgba(255,255,255,.3); }
.wx-pill[disabled] { opacity: .62; box-shadow: none; }
.wx-pill-t { font: inherit; letter-spacing: inherit; }
/* 手机号绑定成功后，头像与昵称淡入上浮出现 */
.reveal { animation: identity-in .34s ease-out both; }
@keyframes identity-in {
  from { opacity: 0; transform: translateY(12px) scale(.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.avatar { width: 68px; height: 68px; overflow: hidden; position: relative; border-radius: 50%; background: #f4e8d7; box-shadow: 0 0 0 2px #fff3da, 0 4px 16px #26170f55; }
.portrait { display: block; width: 100%; height: 100%; }
.cat-sheet { position: absolute; width: 500%; height: 400%; max-width: none; }
/* 头像遮罩层：常驻一层半透明遮罩 + 相机图标，表示可更换头像 */
.avatar-mask {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  border-radius: 50%; background: rgba(40,24,15,.34); transition: background .18s ease;
}
.avatar:active .avatar-mask, .avatar-mask.saving { background: rgba(40,24,15,.58); }
.avatar-saving { font: 600 13px/1 $font-display; color: #fff4e1; }
/* 覆盖在头像上的取像按钮（微信 chooseAvatar）或 H5 占位热区 */
.avatar-picker {
  position: absolute; inset: 0; width: 100%; height: 100%; min-height: 0; margin: 0; padding: 0;
  border: 0; border-radius: 50%; background: transparent; opacity: 0; z-index: 3;
}
.avatar-picker::after { border: 0; }
.name-hit {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  max-width: 100%; padding: 2px 10px; border-radius: 999px;
}
.name-hit:active { background: rgba(255,247,232,.14); }
.nickname { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 600 23px/1.35 $font-display; text-shadow: 0 1px 7px #432617; }
.name-edit { opacity: .85; margin-top: 4px; }
.name-editor { width: min(100%, 250px); display: flex; flex-direction: column; align-items: center; gap: 6px; }
.name-input {
  width: 100%; height: 38px; box-sizing: border-box; padding: 0 16px;
  border-radius: 999px; background: rgba(255,247,232,.96); color: #472b1a;
  font: 600 17px/1.2 $font-display; text-align: center;
  box-shadow: 0 2px 10px rgba(38,23,15,.28);
}
.name-hint { font-size: 11px; color: #ecdbc2; opacity: .85; text-shadow: 0 1px 4px #432617; }
button { line-height: 1.3; }
button::after { border: 0; }
.concealed { visibility: hidden; pointer-events: none; }
.note { display: block; margin-top: 12px; text-align: center; color: #efdbbf; font-size: 12px; }
.secondary { display: flex; justify-content: center; gap: 12px; margin-top: 8px; }
.secondary button { margin: 0; padding: 10px 8px; background: transparent; color: #fff6e7; font-size: 14px; }
/* 横屏/宽屏：左海报右操作，避免操作区压到图内字标与消息卡片 */
@media (min-aspect-ratio: 1/1) {
  .login-page {
    flex-direction: row; align-items: center;
    background: radial-gradient(ellipse at 54% 35%,#653d26,#382117 55%,#281a14 100%);
  }
  .actions { width: calc(100% - min(49%, 56.28vh)); max-width: none; padding: 24px 6vw; }
  .welcome { max-width: 370px; margin: 0 auto; }
  .identity { margin-bottom: 20px; }
}
@media (min-width: 720px) and (min-aspect-ratio: 1/1) {
  .actions { padding: 88px 6vw; }
}
</style>

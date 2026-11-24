/**
 * 会员 token 存取。
 *
 * 存放位置：uni storage（H5 落在 localStorage，小程序落在 wx storage），
 * key 固定为 `cosen:member-token`。不放 Pinia / 内存，保证冷启动仍可恢复登录态。
 *
 * 服务端契约：Authorization: Bearer <token>，UUID 不透明串，7 天有效。
 */

export const TOKEN_KEY = 'cosen:member-token'

// 与 token 共用一个存储槽，退出标记与清除凭据一次写入。
const SIGNED_OUT = '!signed-out'
let cachedToken = ''
let loaded = false
// 让退出前发起的异步请求即使在下一次登录后返回，也无法影响新会话。
export let logoutGeneration = 0

function readSession(): string {
  if (!loaded) {
    loaded = true
    try {
      const raw = uni.getStorageSync(TOKEN_KEY)
      cachedToken = typeof raw === 'string' ? raw : raw ? String(raw) : ''
    } catch (e) {
      // storage 不可用时按未登录处理
      cachedToken = ''
    }
  }
  return cachedToken
}

export function isSignedOut(): boolean {
  return readSession() === SIGNED_OUT
}

export function getToken(): string {
  return isSignedOut() ? '' : cachedToken
}

/**
 * 登录态变化订阅。
 *
 * 为什么需要：会员资料（余额 / 券 / phoneBound）缓存在 store 里，登录态被清空
 * （退出、401 过期、扫码代客订单重置会话）时必须一起清掉，否则游客会继续看到
 * 只有登录会员才有的余额支付 / 礼品券入口，点开才提示「请先登录」。
 */
export interface SessionSnapshot {
  token: string
  signedOut: boolean
}
type SessionListener = (snapshot: SessionSnapshot) => void
const sessionListeners = new Set<SessionListener>()

export function onSessionChange(listener: SessionListener): () => void {
  sessionListeners.add(listener)
  return () => {
    sessionListeners.delete(listener)
  }
}

function notifySessionChange(): void {
  const snapshot: SessionSnapshot = { token: cachedToken, signedOut: cachedToken === SIGNED_OUT }
  for (const listener of [...sessionListeners]) {
    try {
      listener(snapshot)
    } catch (e) {
      // 订阅方异常不能影响登录态写入
    }
  }
}

function writeSession(token: string): void {
  cachedToken = token || ''
  loaded = true
  try {
    if (cachedToken) uni.setStorageSync(TOKEN_KEY, cachedToken)
    else uni.removeStorageSync(TOKEN_KEY)
  } catch (e) {
    // 写入失败不阻断请求，内存里仍保留本次会话的 token
  }
  notifySessionChange()
}

export function setToken(token: string): void {
  writeSession(token)
}

export function markSignedOut(): void {
  logoutGeneration++
  writeSession(SIGNED_OUT)
}

export function clearToken(): void {
  if (!isSignedOut()) writeSession('')
}

export function hasToken(): boolean {
  return !!getToken()
}

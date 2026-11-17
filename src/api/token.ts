/**
 * 会员 token 存取。
 *
 * 存放位置：uni storage（H5 落在 localStorage，小程序落在 wx storage），
 * key 固定为 `cosen:member-token`。不放 Pinia / 内存，保证冷启动仍可恢复登录态。
 *
 * 服务端契约：Authorization: Bearer <token>，UUID 不透明串，7 天有效。
 */

export const TOKEN_KEY = 'cosen:member-token'

let cachedToken = ''
let loaded = false

export function getToken(): string {
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

export function setToken(token: string): void {
  cachedToken = token || ''
  loaded = true
  try {
    if (cachedToken) uni.setStorageSync(TOKEN_KEY, cachedToken)
    else uni.removeStorageSync(TOKEN_KEY)
  } catch (e) {
    // 写入失败不阻断请求，内存里仍保留本次会话的 token
  }
}

export function clearToken(): void {
  cachedToken = ''
  loaded = true
  try {
    uni.removeStorageSync(TOKEN_KEY)
  } catch (e) {
    /* noop */
  }
}

export function hasToken(): boolean {
  return !!getToken()
}

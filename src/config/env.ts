/**
 * 运行环境开关。
 *
 * 默认值保证「纯 mock 版」照常可跑：
 *   - VITE_COSEN_USE_MOCK 缺省 / 空串 → true；
 *   - 只有显式 'false' / '0' / 'off' 才切到真实接口。
 *
 * 切真实环境的方式见 src/api/README.md（.env.local 或 shell 环境变量）。
 */

const rawBaseUrl = import.meta.env.VITE_COSEN_API_BASE_URL
const rawUseMock = import.meta.env.VITE_COSEN_USE_MOCK

/** 契约 servers[0] 是 http://127.0.0.1:8080；真实后端换端口时用环境变量覆盖。 */
export const API_BASE_URL = (rawBaseUrl && rawBaseUrl.trim()) || 'http://127.0.0.1:8080'

/** true = 继续使用 src/mock/*；false = 页面走 src/api/* */
export const useMock = rawUseMock === undefined || rawUseMock.trim() === ''
  ? true
  : !['false', '0', 'off'].includes(rawUseMock.trim().toLowerCase())

/** 401 等登录态失效时的跳转目标（小程序非 tabBar 页面） */
export const LOGIN_PAGE = '/pages/login/index'

export const env = {
  /** 接口根地址，不含 /app 前缀 */
  apiBaseUrl: API_BASE_URL,
  /** 是否使用本地 mock 数据 */
  useMock,
  /** Vite 的 dev / build 标记 */
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD
}

export default env

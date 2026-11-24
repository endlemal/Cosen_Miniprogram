/**
 * 统一请求层（小程序端 /app/** 接口）。
 *
 * 约定（见 reference/cosen-api-v1.openapi.yaml v1.3.0 与 docs/error-codes.md）：
 *   1. /app/** 返回真实 HTTP 状态码（401/403/404/409/429/500/503），body 内再带 5 位业务码；
 *   2. 成功：HTTP 2xx + body.code = 200（40925/40926 是幂等成功，也放行）；
 *   3. 失败：以 body.code 为主，HTTP 状态码只作兜底；
 *   4. token 放 uni storage（见 ./token.ts），请求头注入 Authorization: Bearer <token>；
 *   5. 401xx 登录态失效：清 token、toast、reLaunch 到登录页；
 *   6. 业务码 → 文案 / 动作的映射见下方 ERROR_RULES（与 error-codes.md「前端处理」列一致）。
 */
import { API_BASE_URL, LOGIN_PAGE } from '@/config/env'
import { clearToken, getToken, isSignedOut, logoutGeneration, setToken } from './token'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export type QueryValue = string | number | boolean | undefined | null

export type Query = Record<string, QueryValue>

export interface RequestOptions {
  method?: HttpMethod
  /** JSON body；GET 时忽略 */
  data?: unknown
  query?: Query
  /** 是否注入会员 token，默认 true；登录接口传 false */
  auth?: boolean
  /** true 时不自动 toast（页面想自己处理提示） */
  silent?: boolean
  /** 额外请求头，如 Idempotency-Key */
  headers?: Record<string, string>
  timeout?: number
}

/* ---------------- 错误动作与文案 ---------------- */

/**
 * 前端动作：
 *   relogin  清 token，跳登录
 *   retry    提示后允许重试
 *   refresh  刷新当前资源（券/订单/余额）
 *   toast    只提示
 *   contact  提示联系门店
 *   report   提示并上报（console + traceId）
 *   hide     隐藏入口 / 功能未开放
 *   none     无需处理（幂等成功等）
 */
export type ErrorAction = 'relogin' | 'retry' | 'refresh' | 'toast' | 'contact' | 'report' | 'hide' | 'none'

export interface ErrorRule {
  action: ErrorAction
  /** 面向用户的 toast 文案（优先于服务端 msg） */
  message: string
}

/** 业务码 → 动作 + 文案（error-codes.md v1.0.0 / 充值收口 3.8 节） */
export const ERROR_RULES: Record<number, ErrorRule> = {
  // 参数 / 请求
  40001: { action: 'toast', message: '请补全必填信息' },
  40002: { action: 'toast', message: '参数格式不正确' },
  40003: { action: 'report', message: '参数取值不合法' },
  40004: { action: 'refresh', message: '分页参数超出范围' },
  40005: { action: 'toast', message: '内容过大，请精简后重试' },
  40006: { action: 'report', message: '请求格式不支持' },
  40007: { action: 'retry', message: '请求已失效，请重试' },
  // 认证
  40101: { action: 'relogin', message: '请先登录' },
  40102: { action: 'toast', message: '微信登录失败，请重试' },
  40103: { action: 'toast', message: '手机号获取失败，请重新授权' },
  40104: { action: 'relogin', message: '登录已过期，请重新登录' },
  40105: { action: 'relogin', message: '登录信息已失效，请重新登录' },
  40106: { action: 'relogin', message: '登录状态已失效，请重新登录' },
  40107: { action: 'refresh', message: '验证码错误或已过期' },
  // v1.6.0：账号已注销（注销后再次登录）
  40108: { action: 'relogin', message: '账号已注销，请重新登录' },
  // 权限 / 功能开关
  40301: { action: 'report', message: '没有权限查看该内容' },
  40302: { action: 'toast', message: '当前环境未开放演示登录' },
  40303: { action: 'contact', message: '账号已被限制，请联系门店' },
  40310: { action: 'toast', message: '请先使用微信验证手机号' },
  40304: { action: 'hide', message: '该功能暂未开放' },
  // 资源不存在
  40401: { action: 'refresh', message: '商品不存在或已下架' },
  40402: { action: 'refresh', message: '分类不存在' },
  40403: { action: 'refresh', message: '券不存在或不属于你' },
  40404: { action: 'refresh', message: '订单不存在' },
  40405: { action: 'relogin', message: '会员信息不存在，请重新登录' },
  40406: { action: 'refresh', message: '充值档位不存在' },
  40407: { action: 'refresh', message: '充值单不存在' },
  // v1.6.0
  40408: { action: 'refresh', message: '门店信息不存在' },
  40409: { action: 'refresh', message: '评价不存在' },
  // 会员 / 储值 / 券
  40901: { action: 'contact', message: '会员已停用，请联系门店' },
  40902: { action: 'contact', message: '手机号已绑定其他会员' },
  40903: { action: 'toast', message: '余额不足，请充值或更换支付方式' },
  40904: { action: 'toast', message: '充值金额或档位不合法' },
  40905: { action: 'refresh', message: '充值活动已结束' },
  40906: { action: 'retry', message: '储值扣减失败，请重试' },
  40907: { action: 'refresh', message: '券状态已变化，请刷新' },
  40908: { action: 'refresh', message: '券已过期' },
  40909: { action: 'toast', message: '未达到券使用门槛' },
  40910: { action: 'toast', message: '该券不适用于当前订单' },
  40911: { action: 'refresh', message: '券已被核销，请刷新' },
  40912: { action: 'retry', message: '券转赠失败，请重试' },
  // 商品 / 库存
  40913: { action: 'refresh', message: '商品已下架' },
  40914: { action: 'refresh', message: '商品售罄或库存不足' },
  40915: { action: 'retry', message: '库存更新冲突，请重试' },
  // 订单 / 支付
  40916: { action: 'refresh', message: '订单状态已变化，请刷新' },
  40917: { action: 'refresh', message: '订单已支付' },
  40918: { action: 'refresh', message: '订单已取消或已完成' },
  40919: { action: 'refresh', message: '价格校验失败，请刷新' },
  40920: { action: 'toast', message: '支付金额拆分不一致' },
  40921: { action: 'toast', message: '支付方式不支持' },
  40922: { action: 'retry', message: '微信支付失败，请重试' },
  40923: { action: 'contact', message: '退款失败，请联系门店' },
  40924: { action: 'retry', message: '取餐码生成失败，请重试' },
  40925: { action: 'none', message: '订单已提交' },
  40926: { action: 'none', message: '支付已处理' },
  // v1.6.0：评价约束
  40927: { action: 'refresh', message: '订单未完成，暂不能评价' },
  40928: { action: 'refresh', message: '该订单已评价' },
  // 限流
  42901: { action: 'toast', message: '操作太频繁，请稍后再试' },
  42902: { action: 'toast', message: '下单太频繁，请稍后再试' },
  42903: { action: 'toast', message: '验证码请求太频繁' },
  42904: { action: 'toast', message: '操作太频繁，请稍后再试' },
  // 服务端 / 依赖
  50001: { action: 'retry', message: '服务开小差了，请稍后重试' },
  50002: { action: 'report', message: '数据校验异常，请联系门店' },
  50301: { action: 'retry', message: '微信服务暂不可用' },
  50302: { action: 'retry', message: '服务暂不可用，请稍后重试' },
  50303: { action: 'retry', message: '支付通道维护中' },
  50304: { action: 'retry', message: '系统维护中' },
  // v1.6.0：微信支付配置缺失 / 渠道维护
  50305: { action: 'retry', message: '微信支付暂不可用，请稍后再试' }
}

/** 请求层抛出的统一错误 */
export class ApiError extends Error {
  /** 业务码；0 表示网络错误 / 无业务码 */
  readonly code: number
  readonly httpStatus: number
  readonly traceId: string
  readonly action: ErrorAction

  constructor(code: number, message: string, action: ErrorAction, httpStatus = 0, traceId = '') {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.action = action
    this.httpStatus = httpStatus
    this.traceId = traceId
  }
}

function fallbackAction(code: number, httpStatus: number): ErrorAction {
  if (code >= 40100 && code < 40200) return 'relogin'
  if (httpStatus === 401) return 'relogin'
  if (httpStatus === 403) return 'toast'
  if (httpStatus === 404) return 'refresh'
  if (httpStatus >= 500) return 'retry'
  return 'toast'
}

function statusToCode(httpStatus: number, withToken: boolean): number {
  if (httpStatus === 400) return 40001
  if (httpStatus === 401) return withToken ? 40101 : 40102
  if (httpStatus === 403) return 40301
  if (httpStatus === 413) return 40005
  if (httpStatus === 415) return 40006
  if (httpStatus === 429) return 42904
  if (httpStatus === 500) return 50001
  if (httpStatus === 502) return 50301
  if (httpStatus === 503) return 50304
  return 0
}

function makeError(code: number, serverMsg: string, httpStatus: number, traceId: string): ApiError {
  const rule = ERROR_RULES[code]
  const action = rule ? rule.action : fallbackAction(code, httpStatus)
  const message = code === 40902 && serverMsg ? serverMsg : rule ? rule.message : serverMsg || '请求失败，请稍后重试'
  return new ApiError(code, message, action, httpStatus, traceId)
}

/* ---------------- 提示与登录跳转 ---------------- */

let lastToastKey = ''
let lastToastAt = 0
function toast(message: string): void {
  const key = message
  const now = Date.now()
  if (key === lastToastKey && now - lastToastAt < 1200) return
  lastToastKey = key
  lastToastAt = now
  uni.showToast({ title: message, icon: 'none', duration: 2200 })
}

let redirecting = false
function redirectToLogin(): void {
  if (redirecting) return
  const pages = getCurrentPages()
  const current = pages[pages.length - 1] as unknown as { route?: string } | undefined
  // 已经在登录页就不再 reLaunch
  if (current?.route === LOGIN_PAGE.replace(/^\//, '')) return
  redirecting = true
  setTimeout(() => (redirecting = false), 3000)
  uni.reLaunch({
    url: LOGIN_PAGE,
    fail: () => {
      redirecting = false
    }
  })
}

function handleError(err: ApiError, silent: boolean, suppressAuthRedirect: boolean): void {
  if (err.action === 'report') {
    console.error(`[api] code=${err.code} http=${err.httpStatus} traceId=${err.traceId || '-'} ${err.message}`)
  }
  if (err.action === 'relogin') {
    clearToken()
    if (!silent) toast(err.message)
    if (!suppressAuthRedirect) redirectToLogin()
    return
  }
  if (err.action === 'none') return
  if (!silent) toast(err.message)
}

/* ---------------- 底层 HTTP ---------------- */

function buildUrl(path: string, query?: Query): string {
  const base = API_BASE_URL.replace(/\/+$/, '')
  const suffix = path.startsWith('/') ? path : `/${path}`
  if (!query) return `${base}${suffix}`
  const pairs: string[] = []
  Object.keys(query).forEach((key) => {
    const value = query[key]
    if (value === undefined || value === null || value === '') return
    pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
  })
  return pairs.length ? `${base}${suffix}?${pairs.join('&')}` : `${base}${suffix}`
}

interface RawResponse {
  statusCode: number
  data: unknown
}

function send(url: string, method: HttpMethod, data: unknown, header: Record<string, string>, timeout: number): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method,
      data: data as Record<string, unknown> | string | ArrayBuffer | undefined,
      header,
      timeout,
      success: (res) => resolve({ statusCode: res.statusCode, data: res.data }),
      fail: () => reject(new Error('network-error'))
    })
  })
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

/**
 * 发请求并做统一的 HTTP / 业务码判定；成功时返回原始 body（不拆 data）。
 */
let sessionPending: Promise<void> | null = null
function silentWechatSession(): Promise<void> {
  if (sessionPending) return sessionPending
  const before = getToken()
  sessionPending = (async () => {
    const code = await new Promise<string>((resolve, reject) =>
      uni.login({ provider: 'weixin', success: r => r.code ? resolve(r.code) : reject(new Error('微信登录失败')), fail: reject }))
    const session = await request<{token:string}>('/app/auth/login/wechat', { method:'POST', auth:false, data:{code} })
    if (!isSignedOut() && getToken() === before) setToken(session.token)
  })().finally(() => { sessionPending = null })
  return sessionPending
}

async function execute(path: string, options: RequestOptions = {}, renewed = false): Promise<unknown> {
  const generation = logoutGeneration
  const method = options.method || 'GET'
  const auth = options.auth !== false
  const silent = options.silent === true
  const suppressAuthRedirect = path.startsWith('/app/auth/login')
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {})
  }
  const privateApi = auth && path !== '/app/auth/logout' && !path.startsWith('/app/catalog/') && !path.startsWith('/app/store') && path !== '/app/recharge/tiers'
  if (privateApi && isSignedOut()) {
    redirectToLogin()
    throw makeError(40101, '', 401, '')
  }
  // #ifdef MP-WEIXIN
  if (privateApi && !getToken()) {
    await silentWechatSession()
    if (generation !== logoutGeneration) throw makeError(40101, '', 401, '')
  }
  // #endif
  const token = auth ? getToken() : ''
  if (token) header.Authorization = `Bearer ${token}`

  let response: RawResponse
  try {
    response = await send(
      buildUrl(path, options.query),
      method,
      method === 'GET' ? undefined : options.data,
      header,
      options.timeout ?? 15000
    )
  } catch (e) {
    const err = new ApiError(0, '网络异常，请检查网络后重试', 'retry')
    if (!silent) toast(err.message)
    throw err
  }

  if (generation !== logoutGeneration && (privateApi || suppressAuthRedirect)) throw makeError(40101, '', 401, '')
  const body = asRecord(response.data)
  const rawCode = body?.code
  const code = typeof rawCode === 'number' ? rawCode : undefined
  const serverMsg = typeof body?.msg === 'string' ? body.msg : ''
  const traceId = typeof body?.traceId === 'string' ? body.traceId : ''
  const httpOk = response.statusCode >= 200 && response.statusCode < 300

  // 契约成功：HTTP 2xx + code=200；40925/40926 是幂等成功（下单/回调），同样放行
  if (httpOk && (code === undefined || code === 200 || code === 40925 || code === 40926)) {
    return response.data
  }

  const err = makeError(code ?? statusToCode(response.statusCode, !!token), serverMsg, response.statusCode, traceId)
  if (path === '/app/auth/logout' && [40101, 40104, 40105, 40106].includes(err.code)) return null
  // 券详情 40403 = 不存在/非本人，页面按空状态处理，不弹错（error-codes.md §5.2）
  // #ifdef MP-WEIXIN
  if (privateApi && !renewed && [40101, 40104, 40106].includes(err.code)) {
    if (token === getToken()) await silentWechatSession()
    return execute(path, options, true)
  }
  // #endif
  const quietCouponMiss = !silent && path.startsWith('/app/coupons') && err.code === 40403
  handleError(err, silent || quietCouponMiss, suppressAuthRedirect)
  throw err
}

/* ---------------- 对外入口 ---------------- */

/**
 * 业务接口：返回 body.data（数组或对象）。
 * 用法：`const member = await request<MemberProfile>('/app/member/profile')`
 */
export async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const body = await execute(path, options)
  const record = asRecord(body)
  if (record && 'data' in record) return (record.data ?? null) as T
  return body as T
}

function sendUpload(
  url: string,
  filePath: string,
  name: string,
  header: Record<string, string>,
  timeout: number
): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url,
      filePath,
      name,
      header,
      timeout,
      success: (res) => {
        let parsed: unknown = res.data
        if (typeof res.data === 'string' && res.data.trim()) {
          try { parsed = JSON.parse(res.data) } catch { parsed = res.data }
        }
        resolve({ statusCode: res.statusCode, data: parsed })
      },
      fail: () => reject(new Error('network-error'))
    })
  })
}

async function executeUpload(
  path: string,
  filePath: string,
  name: string,
  options: { silent?: boolean; timeout?: number } = {},
  renewed = false
): Promise<unknown> {
  const generation = logoutGeneration
  const silent = options.silent === true
  if (isSignedOut()) {
    redirectToLogin()
    throw makeError(40101, '', 401, '')
  }
  // #ifdef MP-WEIXIN
  if (!getToken()) {
    await silentWechatSession()
    if (generation !== logoutGeneration) throw makeError(40101, '', 401, '')
  }
  // #endif
  const token = getToken()
  const header: Record<string, string> = { Accept: 'application/json' }
  if (token) header.Authorization = `Bearer ${token}`

  let response: RawResponse
  try {
    response = await sendUpload(buildUrl(path), filePath, name, header, options.timeout ?? 20000)
  } catch {
    const err = new ApiError(0, '头像上传失败，请检查网络后重试', 'retry')
    if (!silent) toast(err.message)
    throw err
  }

  if (generation !== logoutGeneration) throw makeError(40101, '', 401, '')
  const body = asRecord(response.data)
  const rawCode = body?.code
  const code = typeof rawCode === 'number' ? rawCode : undefined
  const serverMsg = typeof body?.msg === 'string' ? body.msg : ''
  const traceId = typeof body?.traceId === 'string' ? body.traceId : ''
  const httpOk = response.statusCode >= 200 && response.statusCode < 300

  if (httpOk && (code === undefined || code === 200)) {
    return response.data
  }

  const err = makeError(code ?? statusToCode(response.statusCode, !!token), serverMsg, response.statusCode, traceId)
  // #ifdef MP-WEIXIN
  if (!renewed && [40101, 40104, 40106].includes(err.code)) {
    if (token === getToken()) await silentWechatSession()
    return executeUpload(path, filePath, name, options, true)
  }
  // #endif
  handleError(err, silent, false)
  throw err
}

/**
 * 文件上传接口（multipart/form-data）：返回 body.data。
 */
export async function uploadFile<T = unknown>(
  path: string,
  filePath: string,
  name = 'file',
  options: { silent?: boolean; timeout?: number } = {}
): Promise<T> {
  const body = await executeUpload(path, filePath, name, options)
  const record = asRecord(body)
  if (record && 'data' in record) return (record.data ?? null) as T
  return body as T
}

/**
 * 分页接口：返回 { total, rows }（PageResult 的 total/rows 在顶层，不在 data 里）。
 */
export async function requestPage<T>(path: string, options: RequestOptions = {}): Promise<import('./types').PageData<T>> {
  const body = await execute(path, options)
  const record = asRecord(body)
  const rows = Array.isArray(record?.rows) ? (record?.rows as T[]) : []
  const rawTotal = record?.total
  const total = typeof rawTotal === 'number' ? rawTotal : Number(rawTotal)
  return { total: Number.isFinite(total) ? total : rows.length, rows }
}

/**
 * 幂等键：下单 / 创建充值单等接口的 Header Idempotency-Key 必填（契约 40007）。
 * 本轮只提供工具，订单接口接入时使用。
 */
export function genIdempotencyKey(): string {
  const cryptoObj = typeof crypto !== 'undefined'
    ? (crypto as Crypto & { randomUUID?: () => string })
    : undefined
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') return cryptoObj.randomUUID()
  const rand = () => Math.random().toString(16).slice(2, 10)
  return `${Date.now().toString(16)}-${rand()}-${rand()}`
}

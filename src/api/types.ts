/**
 * 小程序端 API 类型（手写自契约 `reference/cosen-api-v1.openapi.yaml` v1.3.0）。
 *
 * 原则：
 *   - 字段名与契约逐字一致（含 Cent / Json 后缀），不在这里做展示态裁剪；
 *   - 契约 required 才标必填，其余可选；
 *   - 金额一律是「分」（integer），展示前用 ./money.ts 的 centToYuan / centText；
 *   - 时间字段是后端 ISO-8601 字符串（如 2026-11-07T15:30:22+08:00），页面再转时间戳。
 */

/* ---------------- 响应信封 ---------------- */

/** AppResult：单对象 / 数组接口的统一信封 */
export interface AppResult<T> {
  code: number
  msg: string
  data?: T | null
  traceId?: string
}

/** PageResult：分页接口信封（total + rows） */
export interface PageResult<T> {
  code: number
  msg: string
  /** 后端 bigint 可能序列化成字符串 */
  total: number | string
  rows: T[]
  traceId?: string
}

/** 前端统一使用的分页结构（total 已转成 number） */
export interface PageData<T> {
  total: number
  rows: T[]
}

/** ErrorResult：/app/** 错误响应（真实 HTTP 状态码 + body.code） */
export interface ErrorResult {
  code: number
  msg: string
  data: null
  traceId?: string
}

/* ---------------- 认证与会员 ---------------- */

/** 契约 MemberProfile：对外脱敏模型（10 字段） */
export interface MemberProfile {
  /** bigint 字符串 */
  id: string
  memberNo: string
  nickname?: string
  avatarUrl?: string
  /** 1 可森 / 2 醇香 / 3 深焙 */
  level?: 1 | 2 | 3
  points?: number
  /** 可用储值余额（分，含赠送） */
  balanceCent?: number
  /** 其中赠送部分（分） */
  giftBalanceCent?: number
  phoneBound: boolean
  /** 138****0817；未绑定为空串 */
  phoneMasked?: string
}

export interface LoginWechatReq {
  /** wx.login 返回的 code */
  code: string
  /** 可选：getPhoneNumber 返回的 code */
  phoneCode?: string
}

export interface LoginMockReq {
  /** 大陆手机号（11 位） */
  phone: string
  nickname?: string
}

export interface BindPhoneReq {
  /** getPhoneNumber 返回的一次性 code */
  phoneCode: string
}

export interface LoginResp {
  token: string
  /** 秒，默认 604800（7 天） */
  expiresIn: number
  member: MemberProfile
}

/** 储值账本流水（契约 MemberBalanceFlow） */
export interface MemberBalanceFlow {
  id?: string
  flowNo: string
  memberId: string
  bizType: 'RECHARGE' | 'REWARD' | 'CONSUME' | 'REFUND' | 'ADJUST' | 'TRANSFER_IN' | 'TRANSFER_OUT'
  /** 1 入账 / -1 出账 */
  direction: number
  /** 变动金额（分，带符号） */
  amountCent: number
  balanceBeforeCent: number
  balanceAfterCent: number
  relatedType?: 'ORDER' | 'RECHARGE' | 'COUPON' | 'ADJUST'
  relatedId?: string
  remark?: string
  /** ISO-8601 */
  createTime?: string
}

/* ---------------- 商品目录 ---------------- */

/** 分类（契约 Category）；code 与 mock 的 cat 对齐 */
export interface CategoryDto {
  id?: string
  code: string
  name: string
  nameEn?: string
  description?: string
  domain?: 'coffee' | 'bar' | 'other'
  sortNo?: number
}

/** 商品角标（契约枚举：招牌/人气/限定/新品/可森特调） */
export type ProductBadge = '招牌' | '人气' | '限定' | '新品' | '可森特调'

/** 商品（契约 Product） */
export interface ProductDto {
  id?: string
  code: string
  categoryId: string
  name: string
  nameEn?: string
  description?: string
  /** 基础价（分） */
  priceCent?: number
  rating?: number
  soldCount?: number
  /** v1.1.0 起为多选数组；无角标是空数组 */
  badge?: ProductBadge[] | null
  ingredientsJson?: string[]
  /** 规格组 key 数组（size/ice/sugar/milk/extra） */
  specGroupsJson?: string[]
  /** CSS 插画参数 DrinkArtSpec */
  artJson?: Record<string, unknown>
  tileColorStart?: string
  tileColorEnd?: string
  /** -1 不限库存 */
  stock?: number
  /** 1 上架 / 0 下架 */
  status?: 0 | 1
  sortNo?: number
}

export interface ProductListQuery {
  pageNum?: number
  pageSize?: number
  /** 分类 code，如 matcha；未知编码返回空列表 */
  category?: string
}

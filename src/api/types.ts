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
  /**
   * v1.5.0 商品封面图（相册第一张），相对 API 根的路径
   * （如 /images/products/m1-0-3f2a1c9d.png）；未上传图片为空串。
   * 展示前用 @/utils/media 的 mediaUrl() 拼 API base。
   */
  coverUrl?: string
  /** v1.5.0 商品相册（轮播图组，按展示顺序，第一张即封面）；未上传图片为空数组 */
  gallery?: string[]
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

/* ---------------- 优惠券（第二组） ---------------- */

/** 券状态（契约 CouponUser.status 五态） */
export type CouponUserStatus = 'unused' | 'used' | 'expired' | 'transferred' | 'frozen'

/** 券发放来源：grant 后台发放 / redeem 积分或活动兑换 / transfer 好友转赠 */
export type CouponSource = 'grant' | 'redeem' | 'transfer'

/** 券背包 / 券详情（契约 CouponUser） */
export interface CouponUserDto {
  id?: string
  couponNo: string
  title: string
  type: 'cash' | 'discount' | 'gift'
  /** cash/gift 面额（分）；discount 时为 null */
  valueCent?: number | null
  /** 折扣率，如 0.85（仅 discount） */
  discountRate?: number | null
  /** 门槛（分），0 无门槛 */
  thresholdCent?: number
  /** 折扣券最高减（分） */
  maxOffCent?: number | null
  issuer?: string
  reason?: string
  /** ISO-8601 */
  startAt: string
  /** ISO-8601 */
  endAt: string
  status: CouponUserStatus
  usedAt?: string | null
  orderId?: string | null
  source?: CouponSource
  transferNo?: string | null
  transferAt?: string | null
  acceptAt?: string | null
  createTime?: string
  updateTime?: string
}

/* ---------------- 订单 / 支付（第二组） ---------------- */

export type OrderPayMode = 'balance' | 'wechat' | 'mixed'
export type OrderPayStatus = 'unpaid' | 'paid' | 'refunded' | 'closed'
export type OrderStatus = 'created' | 'paid' | 'making' | 'ready' | 'completed' | 'cancelled'

/** 订单列表模型（契约 Order，脱敏；不含 items） */
export interface OrderDto {
  id: string
  orderNo: string
  pickupCode?: string
  storeId?: string
  /** 契约仅 pickup */
  fulfillType: 'pickup'
  itemCount?: number
  subtotalCent?: number
  couponOffCent?: number
  payableCent?: number
  balancePayCent?: number
  wechatPayCent?: number
  /** 使用的用户券 ID（bigint 字符串），未用券为 null；不是 couponNo */
  couponId?: string | null
  payMode: OrderPayMode
  payStatus: OrderPayStatus
  orderStatus: OrderStatus
  remark?: string
  createTime: string
  paidAt?: string | null
  finishedAt?: string | null
  cancelledAt?: string | null
}

/** 订单明细快照（契约 OrderItem） */
export interface OrderItemDto {
  id?: string
  productCode: string
  productName: string
  productNameEn?: string
  specText?: string
  specJson?: Record<string, string>
  unitPriceCent: number
  qty: number
  amountCent: number
  /** CSS 插画快照 */
  artJson?: Record<string, unknown>
}

/** 订单详情（契约 OrderDetail = Order + items） */
export interface OrderDetailDto extends OrderDto {
  items: OrderItemDto[]
}

/** 下单明细（契约 CreateOrderItemReq） */
export interface CreateOrderItemReq {
  productCode: string
  /** 1..99 */
  qty: number
  /** 规格选择，如 { size: '大杯', temp: '少冰' }；当前购物车只有 specText，暂不传 */
  spec?: Record<string, string>
}

/** 下单请求（契约 CreateOrderReq；幂等键 Header 或 body 二选一必填） */
export interface CreateOrderReq {
  /** 1..50 项 */
  items: CreateOrderItemReq[]
  /** 使用的用户券 couponNo（不是券 ID） */
  couponId?: string
  payMode?: OrderPayMode
  remark?: string
  /** 与 Header Idempotency-Key 二选一；前端两者都带同一个值 */
  idempotencyKey?: string
}

/** 支付请求（契约 PayOrderReq；mixed 时两个金额列均须 > 0） */
export interface PayOrderReq {
  payMode: OrderPayMode
  balancePayCent?: number
  wechatPayCent?: number
}

export interface OrderListQuery {
  pageNum?: number
  pageSize?: number
  orderStatus?: OrderStatus
}

/* ---------------- 充值（第三组） ---------------- */

/** 充值档位（契约 RechargeTier；金额单位分） */
export interface RechargeTierDto {
  /** 档位编码，如 TIER_500_100 */
  tierCode: string
  name: string
  /** 实充金额（分） */
  amountCent: number
  /** 赠送金额（分） */
  bonusCent: number
  /** 到账合计（分） */
  totalCent: number
  /** 展示文案，如「相当于 8.3 折」 */
  note?: string
  /** 是否推荐档位 */
  hot?: boolean
  campaignId?: string
  /** 当前是否可购买；false 时前端置灰但保留展示 */
  available: boolean
}

export type RechargeStatus = 'pending' | 'paid' | 'closed' | 'failed'

/** 微信小程序支付拉起参数（仅创建充值单响应返回，勿缓存） */
export interface WxPayParamsDto {
  prepayId: string
  /** 秒级时间戳（字符串） */
  timeStamp: string
  nonceStr: string
  package: string
  signType: 'RSA' | 'HMAC-SHA256'
  paySign: string
}

/** 充值单（契约 RechargeOrder） */
export interface RechargeOrderDto {
  /** 充值单号，同时是微信 out_trade_no */
  rechargeNo: string
  tierCode: string
  campaignId?: string
  amountCent: number
  bonusCent: number
  totalCent: number
  /** 第一切片固定 wechat */
  payMode: 'wechat'
  status: RechargeStatus
  /** 仅 status=failed 时有值（如 40922） */
  failCode?: number | null
  /** 仅 status=failed 时有值 */
  failMsg?: string | null
  /** ISO-8601，仅 pending 有意义 */
  expireAt?: string
  paidAt?: string
  flowNo?: string
  /** 到账后可用余额（分） */
  balanceAfterCent?: number
  /** 到账后赠送余额（分） */
  giftBalanceAfterCent?: number
  wx?: WxPayParamsDto
}

/** 创建充值单请求（契约 body；幂等键走 Header） */
export interface CreateRechargeReq {
  tierCode: string
  payMode?: 'wechat'
}

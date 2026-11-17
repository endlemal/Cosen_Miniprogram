/**
 * 小程序 API 层统一出口。
 *
 * 第一组 9 个接口（契约 v1.3.0）：
 *   auth    微信登录 / 联调登录 / 绑定手机号 / 注销
 *   member  会员资料 / 储值流水
 *   catalog 分类 / 商品列表 / 商品详情
 *
 * 未来（本轮只留位，不接）：
 *   - GET  /app/coupons、GET /app/coupons/{couponNo}
 *   - POST /app/orders、GET /app/orders、GET /app/orders/{orderNo}、pay、cancel
 *   - 充值三接口（见 docs/recharge-api-draft.md）：GET /app/recharge/tiers、
 *     POST /app/recharges、GET /app/recharges/{rechargeNo}
 */
export * from './request'
export * from './types'
export * from './money'
export * from './token'
export * from './auth'
export * from './member'
export * from './catalog'

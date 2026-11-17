/**
 * 小程序 API 层统一出口。
 *
 * 第一组 9 个接口（契约 v1.4.0）：
 *   auth    微信登录 / 联调登录 / 绑定手机号 / 注销
 *   member  会员资料 / 储值流水
 *   catalog 分类 / 商品列表 / 商品详情
 *
 * 第二组 7 个接口：
 *   coupon  我的券背包 / 券详情
 *   order   创建订单 / 订单列表 / 订单详情 / 支付 / 取消
 *
 * 第三组 3 个接口（本轮）：
 *   recharge 档位列表 / 创建充值单 / 充值状态查询
 */
export * from './request'
export * from './types'
export * from './money'
export * from './token'
export * from './auth'
export * from './member'
export * from './catalog'
export * from './coupon'
export * from './order'
export * from './recharge'

/**
 * 认证接口（契约 v1.3.0 第一组 4 个）：
 *   POST /app/auth/login/wechat  微信静默登录
 *   POST /app/auth/login/mock    联调一键登录（dev/test）
 *   POST /app/auth/phone/bind    绑定手机号
 *   POST /app/auth/logout        注销 token（幂等）
 *
 * 登录成功会顺手把 token 写进 storage，页面不需要自己 setToken。
 */
import { useMock } from '@/config/env'
import { request } from './request'
import { getToken, markSignedOut, setToken } from './token'
import type { BindPhoneReq, LoginMockReq, LoginResp, LoginWechatReq, MemberProfile } from './types'

/** 微信静默登录；成功返回 token + 会员资料 */
export async function loginByWechat(payload: LoginWechatReq): Promise<LoginResp> {
  const resp = await request<LoginResp>('/app/auth/login/wechat', {
    method: 'POST',
    data: payload,
    auth: false
  })
  setToken(resp.token)
  return resp
}

/** 联调账号登录（仅 dev/test；phone 必填，会定位或自动建档） */
export async function loginByMock(payload: LoginMockReq): Promise<LoginResp> {
  const resp = await request<LoginResp>('/app/auth/login/mock', {
    method: 'POST',
    data: payload,
    auth: false
  })
  setToken(resp.token)
  return resp
}

/** 绑定手机号；成功返回最新会员资料（token 不变） */
export function bindPhone(payload: BindPhoneReq): Promise<MemberProfile> {
  return request<MemberProfile>('/app/auth/phone/bind', {
    method: 'POST',
    data: payload
  })
}

/**
 * 注销 token。接口本身幂等（过期/已注销也返回 200），
 * 成功后清本地 token；失败时保留，避免「注销失败却丢失登录态」。
 */
export async function logout(): Promise<void> {
  if (getToken() && !useMock) await request<void>('/app/auth/logout', { method: 'POST' })
  markSignedOut()
}

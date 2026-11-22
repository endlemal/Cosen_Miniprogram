/**
 * 真实模式下的会员资料同步（储值余额 / 积分 / 等级的唯一前端来源）。
 *
 * 为什么需要：结算页、储值页、「我的」原先各自读 mock 的 state.balance 或各自拉一次 profile，
 * 余额在充值 / 余额支付 / 退款后互相不同步。现在统一走 syncMemberProfile()：
 *   - 拉 GET /app/member/profile，写回 state.balance（元）/ state.points，并更新共享的 memberProfile；
 *   - 在 首页显示 / 结算页进入 / 支付完成 / 充值到账 等时机调用；
 *   - mock 模式不请求，直接视为已同步。
 */
import { ref } from 'vue'
import { useMock } from '@/config/env'
import { isSignedOut } from '@/api/token'
import { getMemberProfile } from '@/api/member'
import { centToYuan } from '@/api/money'
import type { MemberProfile } from '@/api/types'
import { state } from './index'

/** 最近一次从后端拿到的会员资料（真实模式）；mock 模式恒为 null */
export const memberProfile = ref<MemberProfile | null>(null)
/** 真实模式下余额是否已经从后端同步过（未同步前不要展示 / 判断 mock 余额） */
export const balanceSynced = ref(useMock)

export function setMemberProfile(profile: MemberProfile | null) {
  memberProfile.value = profile
  if (!profile) { balanceSynced.value = useMock; if (!useMock) { state.balance = 0; state.points = 0 }; return }
  state.balance = centToYuan(profile.balanceCent ?? 0)
  if (profile.points != null) state.points = profile.points
  balanceSynced.value = true
}

export async function syncMemberProfile(): Promise<MemberProfile | null> {
  if (useMock || isSignedOut()) return null
  try {
    const profile = await getMemberProfile()
    setMemberProfile(profile)
    return profile
  } catch {
    // 401 等由请求层处理；其余失败保持旧值，调用方不阻断
    return null
  }
}

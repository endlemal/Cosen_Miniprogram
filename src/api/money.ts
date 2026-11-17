/**
 * 金额工具：服务端一律用「分」（integer），前端展示用「元」。
 *
 * 浮点注意：不要直接 cent / 100 后做多次运算；用 centToYuan 只做展示，
 * 参与计算时保留分、或 yuanToCent 回整。
 */
import { money, money2 } from '@/utils/format'

/** 分 → 元（保留两位精度，返回 number） */
export function centToYuan(cent: number): number {
  if (!Number.isFinite(cent)) return 0
  return Math.round(cent) / 100
}

/** 元 → 分（四舍五入到整数分） */
export function yuanToCent(yuan: number): number {
  if (!Number.isFinite(yuan)) return 0
  return Math.round(yuan * 100)
}

/** 分 → 展示文案：3200 → "32"，3150 → "31.5" */
export function centText(cent: number): string {
  return money(centToYuan(cent))
}

/** 分 → 展示文案（固定两位）：3200 → "32.00"（余额、对账用） */
export function centText2(cent: number): string {
  return money2(centToYuan(cent))
}

/** 分 → "¥32" / "¥31.5" */
export function centMoney(cent: number): string {
  return `¥${centText(cent)}`
}

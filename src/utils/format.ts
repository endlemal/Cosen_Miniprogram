/** 金额：去掉多余的 0，32 → "32"，31.5 → "31.5"，31.25 → "31.25" */
export function money(n: number): string {
  const s = (Math.round(n * 100) / 100).toFixed(2)
  return s.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}

/** 余额等需要固定两位小数的场景 */
export function money2(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2)
}

export const pad = (n: number, len = 2) => String(n).padStart(len, '0')

export function md(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export function ymd(ts: number, sep = '.'): string {
  const d = new Date(ts)
  return [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join(sep)
}

export function hm(ts: number): string {
  const d = new Date(ts)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ago(ts: number, now = Date.now()): string {
  const s = Math.max(0, Math.floor((now - ts) / 1000))
  if (s < 60) return '刚刚'
  if (s < 3600) return `${Math.floor(s / 60)} 分钟前`
  if (s < 86400) return `${Math.floor(s / 3600)} 小时前`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} 天前`
  return md(ts)
}

const WEEK = ['日', '一', '二', '三', '四', '五', '六']
export function weekday(ts = Date.now()) {
  return `星期${WEEK[new Date(ts).getDay()]}`
}

export function greeting(ts = Date.now()) {
  const h = new Date(ts).getHours()
  if (h < 5) return '夜深了'
  if (h < 11) return '早安'
  if (h < 14) return '午安'
  if (h < 18) return '下午好'
  return '晚上好'
}

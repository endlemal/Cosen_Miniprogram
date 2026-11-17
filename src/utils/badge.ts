/**
 * 商品角标归一化。
 *
 * 契约 v1.1.0 起 `Product.badge` 是 `array<string>`（招牌/人气/限定/新品/可森特调），
 * 而旧 mock 数据是单个字符串。所有展示入口都先过 normalizeBadges，
 * 保证「数组」与「旧字符串」两种来源都能正常渲染。
 */

export type BadgeInput = string | string[] | null | undefined

/** 归一化为去空、去重、保持顺序的字符串数组 */
export function normalizeBadges(input: BadgeInput): string[] {
  if (!input) return []
  const list = Array.isArray(input) ? input : [input]
  const out: string[] = []
  list.forEach((item) => {
    if (typeof item !== 'string') return
    const label = item.trim()
    if (label && !out.includes(label)) out.push(label)
  })
  return out
}

/** 角标展示文案：单个直接展示，多个展示「首个 +N」以免撑破商品卡 */
export function badgeText(badges: string[]): string {
  if (!badges.length) return ''
  return badges.length > 1 ? `${badges[0]} +${badges.length - 1}` : badges[0]
}

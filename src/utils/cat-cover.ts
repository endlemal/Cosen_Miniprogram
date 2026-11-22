/** 与管理后台使用同一组图片和商品编码，跨端刷新时保持一致。 */
export function catIndex(key: string): number {
  let hash = 2166136261
  for (const character of key) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)
  }
  return (hash >>> 0) % 19
}

export function catCover(productKey: string): string {
  const index = catIndex(productKey) + 1
  return '/static/product-cats/cat-' + String(index).padStart(2, '0') + '.webp'
}

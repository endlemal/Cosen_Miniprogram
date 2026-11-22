/**
 * 真实模式下用 /app/catalog/** 的数据替换 src/mock/products 里的 CATEGORIES / PRODUCTS。
 *
 * 菜单、广场、帖子页都直接读这两个模块级数组，所以这里「原地替换」（splice）而不是新建数组：
 * 调用方必须在这些页面创建之前 await 本函数（见 pages/index/index.vue）。
 * 后端是价格与上下架的唯一真源；mock 数据只在 useMock=true 时使用。
 */
import { listCategories, listProducts, toCategory, toProduct } from './catalog'
import { state } from '@/store'
import { CATEGORIES, PRODUCTS } from '@/mock/products'
import type { ProductDto } from './types'

const PAGE_SIZE = 100

export async function hydrateCatalogFromApi(): Promise<void> {
  const categoryDtos = await listCategories()
  const rows: ProductDto[] = []
  for (let pageNum = 1; pageNum <= 20; pageNum += 1) {
    const page = await listProducts({ pageNum, pageSize: PAGE_SIZE })
    rows.push(...page.rows)
    if (rows.length >= page.total || page.rows.length < PAGE_SIZE) break
  }
  const codeById: Record<string, string> = {}
  categoryDtos.forEach((c) => {
    if (c.id != null) codeById[String(c.id)] = c.code
  })
  const products = rows.map((p) => toProduct(p, codeById[String(p.categoryId)]))
  // 只保留有商品的分类，避免菜单出现空分区
  const used = new Set(products.map((p) => p.cat))
  const categories = categoryDtos.map(toCategory).filter((c) => used.has(c.id))
  CATEGORIES.splice(0, CATEGORIES.length, ...categories)
  PRODUCTS.splice(0, PRODUCTS.length, ...products)
  const available = new Set(products.map(p => p.id))
  state.cart = state.cart.filter(item => available.has(item.productId))
}

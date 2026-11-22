/**
 * 商品目录接口（契约 v1.3.0 第一组 3 个）：
 *   GET /app/catalog/categories        分类列表（公开）
 *   GET /app/catalog/products          商品列表（分页，可按分类 code 过滤）
 *   GET /app/catalog/products/{code}   商品详情
 *
 * 同时提供契约 DTO → 页面展示模型（src/types 的 Category / Product）的适配函数：
 *   - 金额：priceCent（分）→ price（元）
 *   - 角标：array<string> / 旧字符串 → string[]（normalizeBadges）
 *   - 插画、渐变、规格组等展示字段做安全兜底
 */
import { request, requestPage } from './request'
import { centToYuan } from './money'
import { normalizeBadges } from '@/utils/badge'
import type { Category, DrinkArtSpec, Product } from '@/types'
import type { CategoryDto, PageData, ProductDto, ProductListQuery } from './types'

/** 分类列表（公开接口，未登录也能取） */
export function listCategories(): Promise<CategoryDto[]> {
  return request<CategoryDto[]>('/app/catalog/categories', { auth: false })
}

/** 商品列表；未知分类 code 返回空列表（不是错误） */
export function listProducts(query: ProductListQuery = {}): Promise<PageData<ProductDto>> {
  return requestPage<ProductDto>('/app/catalog/products', {
    query: {
      pageNum: query.pageNum ?? 1,
      pageSize: query.pageSize ?? 10,
      category: query.category
    }
  })
}

/** 商品详情；不存在或已下架统一 40401 */
export function getProductByCode(code: string): Promise<ProductDto> {
  return request<ProductDto>(`/app/catalog/products/${encodeURIComponent(code)}`)
}

/* ---------------- DTO → 展示模型 ---------------- */

const FALLBACK_ART: DrinkArtSpec = { cup: 'tall', liquid: ['#EED6B5', '#C5976B'] }
const FALLBACK_TILE: [string, string] = ['#EED6B5', '#C5976B']

export function toCategory(dto: CategoryDto): Category {
  return {
    id: dto.code,
    name: dto.name,
    en: dto.nameEn ?? '',
    desc: dto.description ?? ''
  }
}

/** artJson 是契约里的自由对象；字段不全时回退到默认插画，避免页面崩 */
export function toArtSpec(raw: Record<string, unknown> | undefined): DrinkArtSpec {
  if (!raw) return FALLBACK_ART
  const liquid = Array.isArray(raw.liquid)
    ? raw.liquid.filter((item): item is string => typeof item === 'string')
    : []
  const cup = typeof raw.cup === 'string' ? raw.cup : ''
  if (!cup || liquid.length < 2) return FALLBACK_ART
  return { ...raw, cup, liquid: [liquid[0], liquid[1]] } as unknown as DrinkArtSpec
}

function toTile(start?: string, end?: string): [string, string] {
  return [start || FALLBACK_TILE[0], end || FALLBACK_TILE[1]]
}

/** v1.5.0 相册：只保留非空字符串路径（防御后端返回 null / 脏数据） */
function toGallery(raw?: string[] | null): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is string => typeof item === 'string' && item.length > 0)
}

/**
 * 契约商品 → 页面商品。
 * @param dto 契约 Product
 * @param categoryCode 所属分类 code（分类接口返回后按 categoryId 映射；缺省用 categoryId）
 */
export function toProduct(dto: ProductDto, categoryCode?: string): Product {
  return {
    id: dto.code,
    cat: categoryCode || dto.categoryId,
    name: dto.name,
    en: dto.nameEn ?? '',
    desc: dto.description ?? '',
    price: centToYuan(dto.priceCent ?? 0),
    rating: dto.rating ?? 0,
    cornerText: dto.cornerText?.trim() ?? '',
    sold: dto.soldCount ?? 0,
    ingredients: dto.ingredientsJson ?? [],
    specs: dto.specGroupsJson ?? [],
    art: toArtSpec(dto.artJson),
    tile: toTile(dto.tileColorStart, dto.tileColorEnd),
    badge: normalizeBadges(dto.badge),
    // v1.5.0：保留后端相对路径，组件用 @/utils/media 的 mediaUrl() 统一拼 base
    coverUrl: dto.coverUrl ?? '',
    gallery: toGallery(dto.gallery),
    // v1.6.0：stock == 0 由后端折算成 soldOut，前端只负责置灰 / 禁加购
    soldOut: dto.soldOut === true
  }
}

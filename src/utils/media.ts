/**
 * 商品图片 URL 归一化（契约 v1.5.0：Product.coverUrl / Product.gallery）。
 *
 * 后端只存相对路径（如 `/images/products/m1-0-3f2a1c9d.png`），域名由前端拼：
 *   1. undefined / null / '' → ''（页面回退「图片待上传」空占位）；
 *   2. 绝对 http(s) URL 原样返回（将来换 CDN 时不用改调用方）；
 *   3. 相对路径拼现有 API base（与 request.ts 的 buildUrl 同口径，避免双斜杠）；
 *   4. mock 模式（useMock=true）一律返回 ''，保证纯 mock 版外观与现在完全一致。
 */
import { API_BASE_URL, useMock } from '@/config/env'

const ABSOLUTE_URL = /^https?:\/\//i
const INLINE_URL = /^(data|blob):/i

/** 相对路径 → 可直接给 `<image src>` 的完整 URL；无图 / mock 模式返回 '' */
export function mediaUrl(path?: string | null): string {
  if (useMock) return ''
  const raw = typeof path === 'string' ? path.trim() : ''
  if (!raw) return ''
  if (ABSOLUTE_URL.test(raw)) return raw
  // 协议相对地址（//cdn.example.com/x.png）按 https 处理
  if (raw.startsWith('//')) return `https:${raw}`
  // data: / blob: 本身已是完整 URL，原样保留
  if (INLINE_URL.test(raw)) return raw
  const base = API_BASE_URL.replace(/\/+$/, '')
  const suffix = raw.replace(/^\/+/, '')
  if (!suffix) return ''
  return base ? `${base}/${suffix}` : `/${suffix}`
}

/** 相册批量归一化：过滤空值、保持后端给的展示顺序 */
export function mediaUrls(paths?: readonly (string | null | undefined)[] | null): string[] {
  if (!Array.isArray(paths)) return []
  const urls: string[] = []
  paths.forEach((path) => {
    const url = mediaUrl(path)
    if (url) urls.push(url)
  })
  return urls
}

/** 封面归一化：优先 coverUrl，缺省回退相册第一张（契约：第一张即封面） */
export function mediaCover(
  coverUrl?: string | null,
  gallery?: readonly (string | null | undefined)[] | null
): string {
  const cover = mediaUrl(coverUrl)
  if (cover) return cover
  return Array.isArray(gallery) && gallery.length ? mediaUrl(gallery[0]) : ''
}

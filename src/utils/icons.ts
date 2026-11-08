/**
 * 线性图标（24×24，描边风格），运行时拼成 SVG data URI 给 <image> 使用。
 * 小程序不能直接内联 <svg>，所以转成 base64。
 */
type IconDef = { body: string; fill?: boolean }

const ICONS: Record<string, IconDef> = {
  square: {
    body: '<rect x="3" y="3" width="7.5" height="10" rx="2"/><rect x="13.5" y="3" width="7.5" height="6" rx="2"/><rect x="3" y="16" width="7.5" height="5" rx="2"/><rect x="13.5" y="12" width="7.5" height="9" rx="2"/>'
  },
  bag: { body: '<path d="M5 8h14l-1.1 12.1a1 1 0 0 1-1 .9H7.1a1 1 0 0 1-1-.9z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>' },
  user: { body: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>' },
  bell: { body: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>' },
  plus: { body: '<path d="M12 5v14M5 12h14"/>' },
  minus: { body: '<path d="M5 12h14"/>' },
  star: { body: '<path d="M12 2.8l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3-4.6-4.5 6.4-.9z"/>', fill: true },
  back: { body: '<path d="M15 18l-6-6 6-6"/>' },
  right: { body: '<path d="M9 18l6-6-6-6"/>' },
  down: { body: '<path d="M6 9l6 6 6-6"/>' },
  arrow: { body: '<path d="M7 17 17 7M8 7h9v9"/>' },
  heart: { body: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>' },
  heartFill: {
    body: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
    fill: true
  },
  pin: { body: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>' },
  ticket: {
    body: '<path d="M2 9a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 0 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v2M13 11v2M13 17v2"/>'
  },
  wallet: {
    body: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>'
  },
  gift: {
    body: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>'
  },
  receipt: {
    body: '<path d="M5 2v20l2-1.3 2 1.3 2-1.3 2 1.3 2-1.3 2 1.3 2-1.3V2l-2 1.3L15 2l-2 1.3L11 2 9 3.3 7 2z"/><path d="M9 8h6M9 12h6M9 16h4"/>'
  },
  close: { body: '<path d="M18 6 6 18M6 6l12 12"/>' },
  check: { body: '<path d="M20 6 9 17l-5-5"/>' },
  clock: { body: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' },
  leaf: {
    body: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.4 5.1-6C9.5 14.5 12 13 13 12"/>'
  },
  sparkle: { body: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 17v4M17 19h4"/>' },
  share: { body: '<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M16 6l-4-4-4 4M12 2v13"/>' },
  store: {
    body: '<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v8h14v-8"/><path d="M10 20v-5h4v5"/>'
  },
  scooter: {
    body: '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M9 17h6l-2-8h3M13 9H9.5"/><path d="M18 17l-2-8"/>'
  },
  trash: { body: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>' },
  crown: { body: '<path d="M3 18h18l-1.6-10-4.9 4.5L12 5l-2.5 7.5L4.6 8z"/>' },
  chat: { body: '<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/>' },
  phone: {
    body: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'
  },
  refresh: { body: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>' }
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function base64(str: string): string {
  let out = ''
  let i = 0
  while (i < str.length) {
    const a = str.charCodeAt(i++)
    const b = str.charCodeAt(i++)
    const c = str.charCodeAt(i++)
    const t = (a << 16) | ((b || 0) << 8) | (c || 0)
    out += B64[(t >> 18) & 63] + B64[(t >> 12) & 63]
    out += isNaN(b) ? '=' : B64[(t >> 6) & 63]
    out += isNaN(c) ? '=' : B64[t & 63]
  }
  return out
}

const cache = new Map<string, string>()

export function iconUri(name: string, color: string, stroke = 2): string {
  const key = `${name}|${color}|${stroke}`
  const hit = cache.get(key)
  if (hit) return hit
  const def = ICONS[name] || ICONS.leaf
  const paint = def.fill
    ? `fill="${color}" stroke="${color}" stroke-width="1"`
    : `fill="none" stroke="${color}" stroke-width="${stroke}"`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ${paint} stroke-linecap="round" stroke-linejoin="round">${def.body}</svg>`
  const uri = `data:image/svg+xml;base64,${base64(svg)}`
  cache.set(key, uri)
  return uri
}

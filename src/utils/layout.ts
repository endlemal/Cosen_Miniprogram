export interface Layout {
  statusBar: number
  navHeight: number
  /** 状态栏 + 导航栏，单位 px */
  header: number
  /** 内容距状态栏下方的额外留白，单位 px，三个 tab 统一使用 */
  topGap: number
  windowWidth: number
  windowHeight: number
  /** 小程序胶囊按钮占据的右侧宽度（px），H5 为 0 */
  capsule: number
  /** 1rpx 对应多少 px */
  rpx: number
}

/** 顶部留白的唯一配置：想更空就调大，想更紧凑就调小 */
const TOP_GAP = 24

let cached: Layout | null = null

export function getLayout(): Layout {
  if (cached) return cached
  let statusBar = 20
  let windowWidth = 375
  let windowHeight = 667
  try {
    const u = uni as any
    const info = typeof u.getWindowInfo === 'function' ? u.getWindowInfo() : uni.getSystemInfoSync()
    statusBar = info.statusBarHeight ?? 20
    windowWidth = info.windowWidth || 375
    windowHeight = info.windowHeight || 667
  } catch (e) {
    /* noop */
  }
  let navHeight = 44
  let capsule = 0
  // #ifdef MP
  try {
    const m = uni.getMenuButtonBoundingClientRect()
    if (m && m.height) {
      navHeight = (m.top - statusBar) * 2 + m.height
      capsule = windowWidth - m.left + 8
    }
  } catch (e) {
    /* noop */
  }
  // #endif
  // #ifdef H5
  statusBar = 0
  // #endif
  cached = {
    statusBar,
    navHeight,
    header: statusBar + navHeight,
    topGap: TOP_GAP,
    windowWidth,
    windowHeight,
    capsule,
    rpx: windowWidth / 750
  }
  return cached
}

/// <reference types="vite/client" />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

/**
 * Vite 环境变量（只有 VITE_ 前缀会暴露到客户端）。
 * 见 src/config/env.ts 与 src/api/README.md。
 */
interface ImportMetaEnv {
  /** 真实接口根地址，缺省 http://127.0.0.1:8080（契约 servers） */
  readonly VITE_COSEN_API_BASE_URL?: string
  /** 'false' 时关闭 mock、改调真实接口；缺省 true（保持纯 mock 可跑） */
  readonly VITE_COSEN_USE_MOCK?: string
}

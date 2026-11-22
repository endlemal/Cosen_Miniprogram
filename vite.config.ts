import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

const apiTarget = process.env.COSEN_PREVIEW_API_TARGET || "http://127.0.0.1:8080";
export default defineConfig({
  plugins: [uni()],
  // 仅影响 `npm run dev:h5` 的开发态；生产构建不受影响。
  // 真后端联调：浏览器同源访问 /app/**，由 vite proxy 转发到本机 8080，绕开 CORS。
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    proxy: {
      "/app": {
        target: apiTarget,
        changeOrigin: true
      },
      "/images": { target: apiTarget, changeOrigin: true },
      "/profile/cosen": { target: apiTarget, changeOrigin: true }
    }
  }
});

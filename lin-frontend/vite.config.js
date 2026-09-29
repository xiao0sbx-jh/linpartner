import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // 开发环境代理：所有 /api 开头的请求转发到后端 8080 端口
    // 这样浏览器里不会有跨域问题，也不需要后端配置 CORS
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});

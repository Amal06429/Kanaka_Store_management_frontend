import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // 🔹 Dev server config
  server: {
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  },

  // 🔹 Preview (used after build)
  preview: {
    historyApiFallback: true,
  },

  // 🔹 IMPORTANT: Fix lightningcss @keyframes error
  css: {
    lightningcss: false
  },

  // 🔹 Disable CSS minification to avoid build crash
  build: {
    cssMinify: false
  }
})
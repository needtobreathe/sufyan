import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5085',
        changeOrigin: true
      },
      '/p/': {
        target: 'http://127.0.0.1:5086',
        changeOrigin: true
      },
      '/lp-assets': {
        target: 'http://127.0.0.1:5086',
        changeOrigin: true
      },
      '/images': {
        target: 'http://127.0.0.1:5085',
        changeOrigin: true
      }
    }
  },
  preview: {
    allowedHosts: true
  }
})

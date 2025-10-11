// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages用のbase設定
// "reha-trial" は repository名に合わせて変更
export default defineConfig({
  plugins: [react()],
  base: '/reha-trial/', // ← GitHub Pages のリポジトリ名に合わせる
  build: {
    outDir: 'dist',
  },
  server: {
    host: true,
    port: 5173,
  },
})

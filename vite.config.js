// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/reha-trial/', // ← GitHub Pagesのリポジトリ名に合わせる！
  plugins: [react()],
})

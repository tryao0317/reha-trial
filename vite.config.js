// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHubリポジトリ名に合わせて修正（例: reha-trial）
export default defineConfig({
  base: '/reha-trial/',
  plugins: [react()],
})

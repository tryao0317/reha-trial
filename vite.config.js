import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/tryao0317.github.io-trial/',
  plugins: [react(),tailwindcss()],
  server: {
    host: true,
    allowedHosts: [
      '5173-ipjmdayqt8ton4vcgbv7j-93693822.manus.computer'
    ]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

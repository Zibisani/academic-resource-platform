import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    watch: {
      usePolling: true,
    },
    host: true,
    proxy: {
      // Proxy API requests to Django backend
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      // Proxy media file requests — allows iframes to load from same origin
      // and avoids X-Frame-Options cross-origin block
      '/media': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
    }
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/microstrategy': {
        target: 'https://api.microstrategy.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/microstrategy/, ''),
      },
      '/api/artemis': {
        target: 'https://api.artemis.xyz',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/artemis/, ''),
      },
    },
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/lost': 'http://localhost:8888',
      '/search': 'http://localhost:8888',
      '/uploads': 'http://localhost:8888',
    },
  },
});

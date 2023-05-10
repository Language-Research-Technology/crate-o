import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({mode}) => ({
  plugins: [vue()],
  optimizeDeps: {
    include: ['datapack', 'validator', 'leaflet', 'leaflet-area-select']
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  base: './',
  build: {
    rollupOptions: {
      input: {
        app: './vite.html',
      },
    },
  },
  server: {
    open: '/vite.html'
  }
}));

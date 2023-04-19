import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig((config) => ({
  plugins: [vue()],
  optimizeDeps: {
    include: ['lodash', 'validator', 'leaflet', 'leaflet-area-select']
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  esbuild: {
    drop: config.mode === 'production' ? ['console', 'debugger'] : [],
  },
  base: './'
}));

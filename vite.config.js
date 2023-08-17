import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createHtmlPlugin } from 'vite-plugin-html'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig(({mode}) => ({
  plugins: [
    vue(),
    createHtmlPlugin({minify: true, entry: 'src/main.js'}),
    AutoImport({resolvers: [ElementPlusResolver()]}),
    Components({resolvers: [ElementPlusResolver()]}),
  ],
  optimizeDeps: {
    include: ['ro-crate-excel','leaflet', 'leaflet-area-select']
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
    rollupOptions: {},
    commonjsOptions: {
      include: [/ro-crate-excel/, /node_modules/],
    },
  }
}));

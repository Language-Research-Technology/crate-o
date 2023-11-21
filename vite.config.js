import { fileURLToPath, URL } from 'node:url'

/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createHtmlPlugin } from 'vite-plugin-html'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

const build = {
  _all: {
    rollupOptions: {},
    commonjsOptions: {
      include: [/ro-crate-excel/, /node_modules/],
      transformMixedEsModules: true
    },
  },
  production: {},
  library: {
    lib: {
      entry: fileURLToPath(new URL('./src/lib/index.js', import.meta.url)),
      fileName: 'crate-o',
      formats: ['es']
    },
    rollupOptions: {
      external: ['vue', /^element-plus/ ],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
      
    },
  }
}
// https://vitejs.dev/config/
export default defineConfig(({mode}) => ({
  plugins: [
    vue(),
    createHtmlPlugin({minify: true, entry: 'src/app/main.js'}),
    AutoImport({resolvers: [ElementPlusResolver()]}),
    Components({resolvers: [ElementPlusResolver()]}),
  ],
  optimizeDeps: {
    include: ['ro-crate-excel','leaflet']
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  esbuild: {
    drop: mode !== 'development' ? ['console', 'debugger'] : [],
  },
  base: './',
  build: build[mode] ?? build._all,
  test:{
    globals: true,
    environment: 'jsdom',
    deps:{
      inline: ['element-plus']
    }
  }
}));

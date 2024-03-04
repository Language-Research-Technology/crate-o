import { fileURLToPath, URL } from 'node:url'

/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createHtmlPlugin } from 'vite-plugin-html'
// import AutoImport from 'unplugin-auto-import/vite'
// import Components from 'unplugin-vue-components/vite'
// import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import ElementPlus from 'unplugin-element-plus/vite'
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';


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
      formats: ['es']
    },
    minify: false,
    rollupOptions: {
      external: ['vue', 'element-plus' ],
      output: {
        globals: {
          vue: 'Vue',
          "element-plus": "ElementPlus"
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
    ElementPlus()
    // AutoImport({resolvers: [ElementPlusResolver()]}),
    // Components({resolvers: [ElementPlusResolver()]})
  ],
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
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
  build: build[mode],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  },
  test:{
    globals: true,
    environment: 'jsdom',
    deps:{
      inline: ['element-plus']
    }
  }
}));

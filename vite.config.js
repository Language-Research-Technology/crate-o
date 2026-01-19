import { fileURLToPath, URL } from 'node:url'
import { readFile } from "node:fs/promises";
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
//import { createHtmlPlugin } from 'vite-plugin-html'
// import AutoImport from 'unplugin-auto-import/vite'
// import Components from 'unplugin-vue-components/vite'
// import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import ElementPlus from 'unplugin-element-plus/vite'
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { visualizer } from "rollup-plugin-visualizer";
import { compile } from "ejs";

/// <reference types="vitest" />

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
      external: ['vue', 'element-plus'],
      output: {
        globals: {
          vue: 'Vue',
          "element-plus": "ElementPlus"
        },
      },
    },
  }
}
const ejsRenderer = await createRenderer();
const nunjucksRenderer = await createNunjucksRenderer();

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    ejsRenderer,
    nunjucksRenderer,
    visualizer(),
    vue(),
    //createHtmlPlugin({minify: true, entry: 'src/app/main.js'}),
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
    include: ['ro-crate-excel', 'leaflet', 'ro-crate-html']
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
  test: {
    globals: true,
    environment: 'jsdom',
    deps: {
      inline: ['element-plus']
    }
  }
}));

async function createRenderer() {
  const virtualModuleId = 'virtual:ejs';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;
  const tp = fileURLToPath(import.meta.resolve('ro-crate-html/defaults/metadata_template.html'));
  const src = await readFile(tp, "utf-8");
  const code = compile(src, { client: true, strict: true });
  //const template = await buildPreviewTemplate();
  return {
    name: 'ejsRenderer',
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId;
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `export default ${code.toString()}`;
      }
    }
  }; 
}

async function createNunjucksRenderer() {
  const virtualModuleId = 'virtual:nunjucks-template';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;
  const tp = fileURLToPath(import.meta.resolve('ro-crate-html-lite/template.html'));
  const templateSrc = await readFile(tp, "utf-8");
  
  return {
    name: 'nunjucksRenderer',
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId;
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        // Return a module that exports a render function using nunjucks in the browser
        return `import nunjucks from 'nunjucks';

const template = ${JSON.stringify(templateSrc)};

export default function renderTemplateLite(data, layout) {
  const env = new nunjucks.Environment();
  
  env.addFilter("setProp", function (obj, key) {
    obj[key] = true;
    return obj;
  });
  
  return env.renderString(template, { data, layout });
}`;
      }
    }
  };
}

//import "./component.css";
import './tailwind.css';
//import "@element-plus/theme-chalk/dist/index.css";
//import 'element-plus/dist/index.css';

import CrateEditor from './components/CrateEditor.vue';
//import { handleRoute } from './DefaultRouteHandler.js'
//export { CrateEditor, handleRoute }
import { cacheLabel } from './components/utils';

CrateEditor.install = function(Vue, options) {
  Vue.component("CrateEditor", CrateEditor);
}

export { cacheLabel, CrateEditor, CrateEditor as default }

// Automatic installation if Vue has been added to the global scope.
if (window && window.Vue) {
    window.Vue.use(CrateEditor);
}
//import "./component.css";
import CrateEditor from './components/CrateEditor.vue';
//import { handleRoute } from './DefaultRouteHandler.js'
//export { CrateEditor, handleRoute }

CrateEditor.install = function(Vue, options) {
  Vue.component("CrateEditor", CrateEditor);
}

export { CrateEditor, CrateEditor as default }

// Automatic installation if Vue has been added to the global scope.
if (window && window.Vue) {
    window.Vue.use(CrateEditor);
}
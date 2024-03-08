import { createApp } from 'vue';
//import {createPinia} from 'pinia';
//import ElementPlus from 'element-plus';

//import "@element-plus/theme-chalk/dist/index.css";
import '../lib/tailwind.css';
//import 'element-plus/es/components/loading';
//import 'element-plus/dist/index.css';
//import 'element-plus/theme-chalk/base.css';
import { ElLoading } from 'element-plus';

import App from './App.vue';
import router from './router';

//import "@fortawesome/fontawesome-free/js/all";

const app = createApp(App)

//app.use(createPinia())
app.use(ElLoading)
app.use(router)
//app.use(ElementPlus)
app.mount('#app')

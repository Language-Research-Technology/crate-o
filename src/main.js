import {createApp, inject, provide} from 'vue';
import {createPinia} from 'pinia';
import ElementPlus from 'element-plus';

import './styles.css';

import "@element-plus/theme-chalk/dist/index.css";
import 'element-plus/dist/index.css';

import App from './App.vue';
import router from './router';

import "@fortawesome/fontawesome-free/js/all";

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.mount('#app')

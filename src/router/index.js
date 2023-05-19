import { createRouter, createWebHashHistory } from 'vue-router'
//import CrateOView from "../views/CrateOView.vue";
import CrateoView from "../views/CrateoView.vue";
//const base = document.querySelector('base').href;
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: CrateoView
      //component: CrateOView
    },
    {
      path: '/test',
      name: 'test',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/TestInputs.vue')
    },
    {
      path: '/testentity',
      name: 'testentity',
      component: () => import('../views/TestEntity.vue')
    },
    {
      path: '/testcrate',
      name: 'testcrate',
      component: () => import('../views/TestCrate.vue')
    }
  ]
})

export default router

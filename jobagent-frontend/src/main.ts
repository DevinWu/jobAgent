import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

import App from './App.vue'
import MainPage from './pages/MainPage.vue'
import LoginPage from './pages/LoginPage.vue'
import CreateDomainPage from './pages/CreateDomainPage.vue'
import MCPToolsPage from './pages/MCPToolsPage.vue'
import AdminPage from './pages/AdminPage.vue'
import { useAuthStore } from './stores/auth'

const routes = [
  { path: '/', component: MainPage, meta: { requiresAuth: true } },
  { path: '/login', component: LoginPage },
  { path: '/create-domain', component: CreateDomainPage, meta: { requiresAuth: true } },
  { path: '/mcp-tools', component: MCPToolsPage, meta: { requiresAuth: true } },
  { path: '/admin', component: AdminPage, meta: { requiresAuth: true, requiresAdmin: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  await authStore.initializeAuth()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated()) {
    next('/login')
  } else if (to.meta.requiresAdmin && !authStore.isAdmin()) {
    next('/')
  } else if (to.path === '/login' && authStore.isAuthenticated()) {
    next('/')
  } else {
    next()
  }
})

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(ElementPlus)

app.mount('#app')

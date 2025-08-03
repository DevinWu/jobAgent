<template>
  <div id="app">
    <Navbar v-if="!isLoginPage" />
    <main :class="{ 'with-navbar': !isLoginPage }">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'

const route = useRoute()
const isLoginPage = computed(() => route.path === '/login')
</script>

<style>
#app {
  font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background-color: #f8fafc;
}

body {
  margin: 0;
  padding: 0;
}

main.with-navbar {
  padding: 24px;
  margin-top: 60px;
}

main:not(.with-navbar) {
  padding: 0;
}

.el-menu--horizontal {
  border-bottom: 1px solid #e5e7eb;
}

.el-card {
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.el-button {
  border-radius: 8px;
}

.el-input__wrapper {
  border-radius: 8px;
}

.el-select .el-input__wrapper {
  border-radius: 8px;
}
</style>

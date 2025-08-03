<template>
  <el-menu
    mode="horizontal"
    :default-active="activeIndex"
    class="navbar"
    @select="handleSelect"
  >
    <div class="flex-1">
      <el-menu-item index="/" class="brand">
        <h2 class="text-xl font-bold text-blue-600">Job Agent</h2>
      </el-menu-item>
    </div>

    <template v-if="authStore.isAuthenticated()">
      <el-menu-item index="/">
        <el-icon><House /></el-icon>
        <span>Dashboard</span>
      </el-menu-item>
      
      <el-menu-item index="/domain-management">
        <el-icon><Platform /></el-icon>
        <span>Domains</span>
      </el-menu-item>
      
      <el-menu-item index="/mcp-tools">
        <el-icon><Tools /></el-icon>
        <span>MCP Tools</span>
      </el-menu-item>
      
      <el-menu-item v-if="authStore.isAdmin()" index="/admin">
        <el-icon><Setting /></el-icon>
        <span>Admin Reviews</span>
      </el-menu-item>

      <el-sub-menu index="user">
        <template #title>
          <el-icon><User /></el-icon>
          <span>{{ authStore.user?.username }} ({{ getRoleDisplayName(authStore.user?.role) }})</span>
        </template>
        <el-menu-item index="logout" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
          <span>Logout</span>
        </el-menu-item>
      </el-sub-menu>
    </template>

    <template v-else>
      <el-menu-item index="/login">
        <el-icon><User /></el-icon>
        <span>Login</span>
      </el-menu-item>
    </template>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {House, Tools, Setting, User, SwitchButton, Platform} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const activeIndex = computed(() => route.path)

const handleSelect = (key: string) => {
  if (key !== 'logout') {
    router.push(key)
  }
}

const getRoleDisplayName = (role?: string) => {
  switch (role) {
    case 'admin':
      return 'Admin'
    case 'vip_user':
      return 'VIP User'
    case 'user':
      return 'User'
    default:
      return 'User'
  }
}

const handleLogout = () => {
  authStore.logout()
  ElMessage.success('Logged out successfully')
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  border-bottom: 1px solid #e5e7eb;
  padding: 0 24px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.brand {
  margin-right: auto;
}

.el-menu--horizontal > .el-menu-item {
  border-bottom: 2px solid transparent;
}

.el-menu--horizontal > .el-menu-item.is-active {
  border-bottom-color: #409eff;
}
</style>

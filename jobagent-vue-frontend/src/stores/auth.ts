import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authAPI } from '@/utils/api'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const loading = ref(false)
  const error = ref('')

  const login = async (credentials: { username: string; password: string }) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await authAPI.login(credentials)
      token.value = response.data.access_token
      localStorage.setItem('token', token.value!)
      
      const userResponse = await authAPI.getCurrentUser()
      user.value = userResponse.data
      localStorage.setItem('user', JSON.stringify(user.value))
      
      return true
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Login failed'
      return false
    } finally {
      loading.value = false
    }
  }

  const register = async (userData: { username: string; email: string; password: string }) => {
    loading.value = true
    error.value = ''
    
    try {
      await authAPI.register(userData)
      return true
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Registration failed'
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const initializeAuth = async () => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      token.value = storedToken
      try {
        const userResponse = await authAPI.getCurrentUser()
        user.value = userResponse.data
      } catch (err) {
        logout()
      }
    }
  }

  const isAuthenticated = () => {
    return !!token.value && !!user.value
  }

  const isAdmin = () => {
    return user.value?.role === 'admin'
  }

  return {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    initializeAuth,
    isAuthenticated,
    isAdmin
  }
})

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <el-card class="w-full max-w-md shadow-2xl">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Job Agent Platform</h1>
          <p class="text-gray-600">
            {{ isLogin ? 'Sign in to your account' : 'Create your account' }}
          </p>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="Username" prop="username">
          <el-input
            v-model="formData.username"
            placeholder="Enter your username"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item v-if="!isLogin" label="Email" prop="email">
          <el-input
            v-model="formData.email"
            type="email"
            placeholder="Enter your email"
            size="large"
            :prefix-icon="Message"
          />
        </el-form-item>

        <el-form-item label="Password" prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="Enter your password"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="authStore.loading"
            @click="handleSubmit"
            class="w-full"
          >
            {{ isLogin ? 'Sign In' : 'Create Account' }}
          </el-button>
        </el-form-item>

        <div class="text-center">
          <el-button
            type="text"
            @click="toggleMode"
            class="text-blue-600 hover:text-blue-500"
          >
            {{ isLogin ? 'Need an account? Register' : 'Already have an account? Sign in' }}
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Message, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isLogin = ref(true)
const formRef = ref<FormInstance>()

const formData = reactive({
  username: '',
  email: '',
  password: ''
})

const formRules: FormRules = {
  username: [
    { required: true, message: 'Username is required', trigger: 'blur' },
    { min: 3, max: 50, message: 'Username must be 3-50 characters', trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Password is required', trigger: 'blur' },
    { min: 6, message: 'Password must be at least 6 characters', trigger: 'blur' }
  ]
}

const toggleMode = () => {
  isLogin.value = !isLogin.value
  authStore.error = ''
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    if (isLogin.value) {
      const success = await authStore.login({
        username: formData.username,
        password: formData.password
      })
      
      if (success) {
        ElMessage.success('Login successful!')
        router.push('/')
      } else {
        ElMessage.error(authStore.error)
      }
    } else {
      const success = await authStore.register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      })
      
      if (success) {
        ElMessage.success('Registration successful! Please sign in.')
        isLogin.value = true
        formData.password = ''
      } else {
        ElMessage.error(authStore.error)
      }
    }
  } catch (error) {
    ElMessage.error('An unexpected error occurred')
  }
}
</script>

<style scoped>
.el-card {
  border-radius: 12px;
}

.el-form-item {
  margin-bottom: 20px;
}
</style>

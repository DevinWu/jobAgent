<template>
  <div class="max-w-6xl mx-auto">
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Job Failure Analysis Platform</h1>
        <p class="text-gray-600">Analyze job failures with AI-powered diagnostic workflows</p>
      </div>
      
      <el-row :gutter="24" class="mb-6">
        <el-col :span="12">
          <el-form-item label="Select Domain">
            <el-select
              v-model="selectedDomain"
              placeholder="Choose a domain..."
              size="large"
              class="w-full"
              :loading="domainsLoading"
            >
              <el-option
                v-for="domain in domains"
                :key="domain.id"
                :label="domain.title"
                :value="domain.id"
              />
            </el-select>
            <div v-if="domains.length === 0" class="text-sm text-gray-500 mt-1">
              No published domains available.
              <router-link to="/create-domain" class="text-blue-600 hover:underline ml-1">
                Create one?
              </router-link>
            </div>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="Job ID">
            <el-input
              v-model="jobId"
              placeholder="Enter job ID to analyze"
              size="large"
              :prefix-icon="Search"
              @keyup.enter="handleAnalyze"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-button
        type="primary"
        size="large"
        :loading="analysisLoading"
        :disabled="!selectedDomain || !jobId.trim()"
        @click="handleAnalyze"
        class="w-full"
      >
        <el-icon class="mr-2"><Search /></el-icon>
        Analyze Job Failure
      </el-button>
    </div>

    <div v-if="analysis" class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 mb-6">Analysis Results</h2>
      
      <el-row :gutter="24" class="mb-6">
        <el-col :span="12">
          <el-card shadow="never" class="h-full">
            <template #header>
              <span class="font-medium">Job Information</span>
            </template>
            <div class="space-y-3">
              <div>
                <span class="text-sm text-gray-500">Job ID:</span>
                <p class="font-mono bg-gray-50 p-2 rounded mt-1">{{ analysis.job_id }}</p>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card shadow="never" class="h-full">
            <template #header>
              <span class="font-medium">Failure Category</span>
            </template>
            <div class="flex items-center">
              <el-tag
                :type="getFailureCategoryType(analysis.failure_category)"
                size="large"
                class="mr-2"
              >
                {{ analysis.failure_category }}
              </el-tag>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="never" class="mb-6">
        <template #header>
          <span class="font-medium">Root Cause Analysis</span>
        </template>
        <div class="bg-gray-50 p-4 rounded-md">
          <p class="text-gray-900 leading-relaxed">{{ analysis.root_cause }}</p>
        </div>
      </el-card>

      <el-card shadow="never">
        <template #header>
          <span class="font-medium">Recommendations</span>
        </template>
        <div class="bg-blue-50 p-4 rounded-md">
          <pre class="text-blue-900 whitespace-pre-wrap leading-relaxed">{{ analysis.suggestions }}</pre>
        </div>
      </el-card>

      <div class="mt-4 text-xs text-gray-500 text-center">
        Analysis completed at: {{ formatDate(analysis.created_at) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { domainsAPI, jobAnalysisAPI } from '@/utils/api'
import type { Domain, JobAnalysis } from '@/types'

const domains = ref<Domain[]>([])
const selectedDomain = ref<number | null>(null)
const jobId = ref('')
const analysis = ref<JobAnalysis | null>(null)
const domainsLoading = ref(false)
const analysisLoading = ref(false)

onMounted(() => {
  loadDomains()
})

const loadDomains = async () => {
  domainsLoading.value = true
  try {
    const response = await domainsAPI.getDomains(true)
    domains.value = response.data
  } catch (err) {
    ElMessage.error('Failed to load domains')
    console.error('Failed to load domains:', err)
  } finally {
    domainsLoading.value = false
  }
}

const handleAnalyze = async () => {
  if (!selectedDomain.value || !jobId.value.trim()) {
    ElMessage.warning('Please select a domain and enter a job ID')
    return
  }

  analysisLoading.value = true
  analysis.value = null

  try {
    const response = await jobAnalysisAPI.analyzeJob(jobId.value.trim(), selectedDomain.value)
    analysis.value = response.data
    ElMessage.success('Analysis completed successfully')
  } catch (err: any) {
    ElMessage.error(err.response?.data?.detail || 'Failed to analyze job')
  } finally {
    analysisLoading.value = false
  }
}

const getFailureCategoryType = (category: string) => {
  switch (category) {
    case 'unknown':
      return 'info'
    case 'userInputError':
      return 'danger'
    case 'ThirdPlatformError':
      return 'warning'
    case 'PlatformError':
      return 'danger'
    default:
      return 'info'
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}
</script>

<style scoped>
.el-card {
  border-radius: 8px;
}

.el-form-item {
  margin-bottom: 16px;
}
</style>

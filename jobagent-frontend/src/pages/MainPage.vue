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
              @change="handleDomainChange"
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
              <router-link to="/domain-management" class="text-blue-600 hover:underline ml-1">
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

    <!-- 历史分析记录表格 -->
    <div v-if="selectedDomain" class="bg-white rounded-lg shadow-md p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-900">Previous Analyses</h2>
        <el-input
          v-model="searchQuery"
          placeholder="Search by job ID or failure category"
          style="width: 300px"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <el-table
        :data="historyAnalyses"
        style="width: 100%"
        v-loading="historyLoading"
        border
        stripe
      >
        <el-table-column prop="job_id" label="Job ID" min-width="120" />
        <el-table-column prop="failure_category" label="Failure Category" min-width="150">
          <template #default="scope">
            <el-tag :type="getFailureCategoryType(scope.row.failure_category)">
              {{ scope.row.failure_category }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="root_cause" label="Root Cause" min-width="200">
          <template #default="scope">
            <div class="truncate max-w-md" :title="scope.row.root_cause">
              {{ scope.row.root_cause }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="Analysis Date" min-width="150">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="analysis_status" label="Status" min-width="120">
          <template #default="scope">
            <el-tag :type="getAnalysisStatusType(scope.row.analysis_status)">
              {{ formatAnalysisStatus(scope.row.analysis_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="120" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              link
              @click="viewAnalysis(scope.row)"
            >
              View Details
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-center mt-4">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalAnalyses"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 分析结果对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="Analysis Results"
      width="80%"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <div v-if="selectedAnalysis" class="analysis-dialog-content">
        <el-row :gutter="24" class="mb-6">
          <el-col :span="12">
            <el-card shadow="never" class="h-full">
              <template #header>
                <span class="font-medium">Job Information</span>
              </template>
              <div class="space-y-3">
                <div>
                  <span class="text-sm text-gray-500">Job ID:</span>
                  <p class="font-mono bg-gray-50 p-2 rounded mt-1">{{ selectedAnalysis.job_id }}</p>
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
                  :type="getFailureCategoryType(selectedAnalysis.failure_category)"
                  size="large"
                  class="mr-2"
                >
                  {{ selectedAnalysis.failure_category }}
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
            <p class="text-gray-900 leading-relaxed">{{ selectedAnalysis.root_cause_analysis || selectedAnalysis.root_cause }}</p>
          </div>
        </el-card>

        <el-card shadow="never">
          <template #header>
            <span class="font-medium">Recommendations</span>
          </template>
          <div class="bg-blue-50 p-4 rounded-md">
            <pre class="text-blue-900 whitespace-pre-wrap leading-relaxed">{{ selectedAnalysis.user_suggestions || selectedAnalysis.suggestions }}</pre>
          </div>
        </el-card>

        <div class="mt-4 text-xs text-gray-500 text-center">
          Analysis completed at: {{ formatDate(selectedAnalysis.created_at) }}
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">Close</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
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

// 历史分析记录相关
const historyAnalyses = ref<JobAnalysis[]>([])
const historyLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalAnalyses = ref(0)
const searchQuery = ref('')
const searchTimeout = ref<number | null>(null)

// 分析结果对话框相关
const dialogVisible = ref(false)
const selectedAnalysis = ref<JobAnalysis | null>(null)

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
    // 重新加载历史记录，以包含新的分析结果
    loadHistoryAnalyses()
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

const getAnalysisStatusType = (status: string) => {
  switch (status) {
    case 'in_progress':
      return 'warning'
    case 'completed':
      return ''
    case 'accepted':
      return 'success'
    case 'manually_corrected':
      return 'info'
    default:
      return 'info'
  }
}

const formatAnalysisStatus = (status: string) => {
  switch (status) {
    case 'in_progress':
      return 'In Progress'
    case 'completed':
      return 'Completed'
    case 'accepted':
      return 'Accepted'
    case 'manually_corrected':
      return 'Manually Corrected'
    default:
      return status
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

// 历史分析记录相关方法
const handleDomainChange = () => {
  if (selectedDomain.value) {
    // 重置分页和搜索
    currentPage.value = 1
    searchQuery.value = ''
    // 加载历史记录
    loadHistoryAnalyses()
  } else {
    historyAnalyses.value = []
    totalAnalyses.value = 0
  }
}

const loadHistoryAnalyses = async () => {
  if (!selectedDomain.value) return
  
  historyLoading.value = true
  try {
    const response = await jobAnalysisAPI.getDomainAnalyses(selectedDomain.value, {
      page: currentPage.value,
      page_size: pageSize.value,
      search: searchQuery.value || undefined
    })
    
    // 处理后端返回的数据格式
    if (Array.isArray(response.data)) {
      // 后端直接返回了数组
      historyAnalyses.value = response.data
      totalAnalyses.value = response.data.length
    } else {
      // 后端返回了分页对象
      historyAnalyses.value = response.data.results || []
      totalAnalyses.value = response.data.count || 0
    }
    
    console.log('Loaded history analyses:', historyAnalyses.value)
  } catch (err) {
    ElMessage.error('Failed to load analysis history')
    console.error('Failed to load analysis history:', err)
  } finally {
    historyLoading.value = false
  }
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  loadHistoryAnalyses()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadHistoryAnalyses()
}

const handleSearch = () => {
  // 防抖处理，避免频繁请求
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  
  searchTimeout.value = window.setTimeout(() => {
    currentPage.value = 1 // 重置到第一页
    loadHistoryAnalyses()
  }, 300)
}

const viewAnalysis = (analysisRecord: JobAnalysis) => {
  // 设置当前选中的分析记录
  selectedAnalysis.value = {
    ...analysisRecord,
    root_cause: analysisRecord.root_cause_analysis || analysisRecord.root_cause,
    suggestions: analysisRecord.user_suggestions || analysisRecord.suggestions
  }
  // 打开对话框
  dialogVisible.value = true
}

// 监听 selectedDomain 变化
watch(selectedDomain, (newValue) => {
  if (newValue) {
    handleDomainChange()
  }
})
</script>

<style scoped>
.el-card {
  border-radius: 8px;
}

.el-form-item {
  margin-bottom: 16px;
}
</style>

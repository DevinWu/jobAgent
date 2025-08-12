<template>
  <div class="max-w-6xl mx-auto">
    <!-- Domain选择器移到顶部，更加突出 -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-bold text-gray-900 mb-4">Select Domain</h2>
      <el-row :gutter="24">
        <el-col :span="18">
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
        </el-col>
        <el-col :span="6">
          <el-button
              type="primary"
              size="large"
              @click="$router.push('/domain-management')"
              class="w-full"
          >
            Manage Domains
          </el-button>
        </el-col>
      </el-row>
      <div v-if="domains.length === 0" class="text-sm text-gray-500 mt-3">
        No published domains available.
        <router-link to="/domain-management" class="text-blue-600 hover:underline ml-1">
          Create one?
        </router-link>
      </div>
    </div>

    <!-- 新任务分析区域 -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <div class="border-l-4 border-blue-500 pl-4 mb-6">
        <h2 class="text-xl font-bold text-gray-900">New Job Analysis</h2>
        <p class="text-gray-600 text-sm">Analyze job failures with AI-powered diagnostic workflows</p>
      </div>

      <el-form class="mb-6">
        <el-row :gutter="24">
          <el-col :span="24">
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
      </el-form>

      <!-- 待处理任务列表 -->
      <div v-if="pendingAnalyses.length > 0" class="mt-8">
        <div class="border-l-4 border-yellow-500 pl-4 mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Pending Analyses</h3>
          <p class="text-gray-600 text-sm">Jobs that are in progress or awaiting acceptance</p>
        </div>

        <el-table
            :data="pendingAnalyses"
            style="width: 100%"
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
      </div>
    </div>

    <!-- 历史分析记录表格 -->
    <div v-if="selectedDomain" class="bg-white rounded-lg shadow-md p-6">
      <div class="border-l-4 border-green-500 pl-4 mb-6">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Analysis History</h2>
            <p class="text-gray-600 text-sm">Previously completed and accepted analyses</p>
          </div>
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
import { ref, onMounted, watch, computed } from 'vue'
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

// 所有分析记录
const allAnalyses = ref<JobAnalysis[]>([])

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

// 待处理分析（进行中或未接受）
const pendingAnalyses = computed(() => {
  return allAnalyses.value.filter(analysis =>
      analysis.analysis_status !== 'accepted' &&
      analysis.analysis_status !== 'manually_corrected'
  )
})

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
    ElMessage.success('Analysis started successfully')
    // 重新加载分析记录
    loadAllAnalyses()
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
    // 加载所有记录
    loadAllAnalyses()
  } else {
    allAnalyses.value = []
    historyAnalyses.value = []
    totalAnalyses.value = 0
  }
}

// 加载所有分析记录
const loadAllAnalyses = async () => {
  if (!selectedDomain.value) return

  historyLoading.value = true
  try {
    const response = await jobAnalysisAPI.getDomainAnalyses(selectedDomain.value)

    // 处理后端返回的数据格式
    if (Array.isArray(response.data)) {
      // 后端直接返回了数组
      allAnalyses.value = response.data
    } else {
      // 后端返回了分页对象
      allAnalyses.value = response.data.results || []
    }

    // 更新历史记录（已接受的）
    updateHistoryAnalyses()
  } catch (err) {
    ElMessage.error('Failed to load analyses')
    console.error('Failed to load analyses:', err)
  } finally {
    historyLoading.value = false
  }
}

// 更新历史记录视图
const updateHistoryAnalyses = () => {
  // 筛选出已接受的分析记录
  const acceptedAnalyses = allAnalyses.value.filter(analysis =>
      analysis.analysis_status === 'accepted' ||
      analysis.analysis_status === 'manually_corrected'
  )

  // 应用搜索过滤
  let filtered = acceptedAnalyses
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = acceptedAnalyses.filter(analysis =>
        analysis.job_id.toLowerCase().includes(query) ||
        analysis.failure_category.toLowerCase().includes(query)
    )
  }

  // 分页处理
  totalAnalyses.value = filtered.length
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  historyAnalyses.value = filtered.slice(start, end)
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  updateHistoryAnalyses()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  updateHistoryAnalyses()
}

const handleSearch = () => {
  // 防抖处理，避免频繁请求
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  searchTimeout.value = window.setTimeout(() => {
    currentPage.value = 1 // 重置到第一页
    updateHistoryAnalyses()
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

// 监听搜索查询变化
watch(searchQuery, () => {
  handleSearch()
})
</script>

<style scoped>
.el-card {
  border-radius: 8px;
}

.el-form-item {
  margin-bottom: 16px;
}

:deep(.el-table .cell) {
  padding-left: 10px;
  padding-right: 10px;
}
</style>

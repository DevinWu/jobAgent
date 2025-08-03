<template>
  <div class="max-w-6xl mx-auto">
    <div class="bg-white rounded-lg shadow-md p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      
      <el-tabs v-model="activeTab" class="demo-tabs">
        <el-tab-pane label="Pending Reviews" name="pending">
          <el-table :data="pendingTools" :loading="loading" stripe>
            <el-table-column prop="title" label="Tool Title" width="200" />
            <el-table-column prop="creator.username" label="Creator" width="150" />
            <el-table-column prop="api_url" label="API URL" show-overflow-tooltip />
            <el-table-column prop="created_at" label="Submitted" width="150">
              <template #default="scope">
                {{ formatDate(scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="Actions" width="250">
              <template #default="scope">
                <el-button size="small" type="success" @click="testTool(scope.row)">Test</el-button>
                <el-button size="small" type="primary" @click="approveTool(scope.row)">Approve</el-button>
                <el-button size="small" type="danger" @click="rejectTool(scope.row)">Reject</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="All Tools" name="all">
          <el-table :data="allTools" :loading="loading" stripe>
            <el-table-column prop="title" label="Tool Title" width="200" />
            <el-table-column prop="creator.username" label="Creator" width="150" />
            <el-table-column prop="status" label="Status" width="150">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="Created" width="150">
              <template #default="scope">
                {{ formatDate(scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="Actions" width="150">
              <template #default="scope">
                <el-button size="small" type="success" @click="testTool(scope.row)">Test</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="showTestDialog" title="Test MCP Tool" width="600px">
      <div v-if="testingTool">
        <h3 class="mb-4">{{ testingTool.title }}</h3>
        <p class="text-gray-600 mb-4">Creator: {{ testingTool.creator?.username }}</p>
        
        <el-form label-width="120px">
          <el-form-item label="Test Parameters">
            <el-input
              v-model="testParameters"
              type="textarea"
              :rows="4"
              placeholder="Enter test parameters as JSON"
            />
          </el-form-item>
        </el-form>
        
        <div v-if="testResult" class="mt-4">
          <h4 class="mb-2">Test Result:</h4>
          <el-alert
            :type="testResult.success ? 'success' : 'error'"
            :title="testResult.success ? 'Success' : 'Error'"
            show-icon
          >
            <pre class="mt-2">{{ testResult.data }}</pre>
          </el-alert>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showTestDialog = false">Close</el-button>
        <el-button type="primary" :loading="testing" @click="runTest">Run Test</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRejectDialog" title="Reject Tool" width="500px">
      <el-form label-width="120px">
        <el-form-item label="Rejection Reason">
          <el-input
            v-model="rejectionReason"
            type="textarea"
            :rows="4"
            placeholder="Enter reason for rejection"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showRejectDialog = false">Cancel</el-button>
        <el-button type="danger" :loading="rejecting" @click="confirmReject">Reject Tool</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { mcpToolsAPI } from '@/utils/api'
import type { MCPTool } from '@/types'

const activeTab = ref('pending')
const pendingTools = ref<MCPTool[]>([])
const allTools = ref<MCPTool[]>([])
const loading = ref(false)
const testing = ref(false)
const rejecting = ref(false)

const showTestDialog = ref(false)
const showRejectDialog = ref(false)
const testingTool = ref<MCPTool | null>(null)
const rejectingTool = ref<MCPTool | null>(null)
const testParameters = ref('')
const testResult = ref<any>(null)
const rejectionReason = ref('')

onMounted(() => {
  loadTools()
})

const loadTools = async () => {
  loading.value = true
  try {
    const [pendingResponse, allResponse] = await Promise.all([
      mcpToolsAPI.getTools({ status: 'waiting_for_admin_review' }),
      mcpToolsAPI.getTools({})
    ])
    pendingTools.value = pendingResponse.data
    allTools.value = allResponse.data
  } catch (err) {
    ElMessage.error('Failed to load tools')
  } finally {
    loading.value = false
  }
}

const testTool = (tool: MCPTool) => {
  testingTool.value = tool
  testParameters.value = JSON.stringify(tool.sample_input || {}, null, 2)
  testResult.value = null
  showTestDialog.value = true
}

const runTest = async () => {
  if (!testingTool.value) return

  let params
  try {
    params = JSON.parse(testParameters.value)
  } catch (err) {
    ElMessage.error('Invalid JSON in test parameters')
    return
  }

  testing.value = true
  try {
    const response = await mcpToolsAPI.executeTool(testingTool.value.id, params)
    testResult.value = {
      success: true,
      data: JSON.stringify(response.data, null, 2)
    }
  } catch (err: any) {
    testResult.value = {
      success: false,
      data: err.response?.data?.detail || 'Test failed'
    }
  } finally {
    testing.value = false
  }
}

const approveTool = async (tool: MCPTool) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to approve "${tool.title}"?`,
      'Confirm Approval',
      {
        confirmButtonText: 'Approve',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    await mcpToolsAPI.adminUpdateTool(tool.id, {
      status: 'published',
      admin_comments: 'Approved by admin'
    })
    
    ElMessage.success('Tool approved successfully')
    loadTools()
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.detail || 'Failed to approve tool')
    }
  }
}

const rejectTool = (tool: MCPTool) => {
  rejectingTool.value = tool
  rejectionReason.value = ''
  showRejectDialog.value = true
}

const confirmReject = async () => {
  if (!rejectingTool.value || !rejectionReason.value.trim()) {
    ElMessage.error('Please provide a rejection reason')
    return
  }

  rejecting.value = true
  try {
    await mcpToolsAPI.adminUpdateTool(rejectingTool.value.id, {
      status: 'rejected',
      admin_comments: rejectionReason.value
    })
    
    ElMessage.success('Tool rejected successfully')
    showRejectDialog.value = false
    loadTools()
  } catch (err: any) {
    ElMessage.error(err.response?.data?.detail || 'Failed to reject tool')
  } finally {
    rejecting.value = false
  }
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'published':
      return 'success'
    case 'waiting_for_admin_review':
      return 'warning'
    case 'rejected':
      return 'danger'
    case 'draft':
      return 'info'
    default:
      return 'info'
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}
</script>

<style scoped>
.el-card {
  border-radius: 8px;
}
</style>

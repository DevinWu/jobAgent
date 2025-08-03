<template>
  <div class="max-w-6xl mx-auto">
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">MCP Tools Management</h1>
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon class="mr-2"><Plus /></el-icon>
          Create New Tool
        </el-button>
      </div>

      <el-tabs v-model="activeTab" class="demo-tabs">
        <el-tab-pane label="My Tools" name="my">
          <el-table :data="myTools" :loading="loading" stripe>
            <el-table-column prop="title" label="Title" width="200" />
            <el-table-column prop="api_url" label="API URL" show-overflow-tooltip />
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
            <el-table-column label="Actions" width="200">
              <template #default="scope">
                <el-button size="small" @click="editTool(scope.row)">Edit</el-button>
                <el-button size="small" type="success" @click="testTool(scope.row)">Test</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="Published Tools" name="published">
          <el-table :data="publishedTools" :loading="loading" stripe>
            <el-table-column prop="title" label="Title" width="200" />
            <el-table-column prop="api_url" label="API URL" show-overflow-tooltip />
            <el-table-column prop="created_at" label="Published" width="150">
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

    <el-dialog v-model="showCreateDialog" title="Create New MCP Tool" width="600px">
      <el-form ref="formRef" :model="toolForm" :rules="toolRules" label-width="120px">
        <el-form-item label="Title" prop="title">
          <el-input v-model="toolForm.title" placeholder="Enter tool title" />
        </el-form-item>
        
        <el-form-item label="API URL" prop="api_url">
          <el-input v-model="toolForm.api_url" placeholder="Enter API URL" />
        </el-form-item>
        
        <el-form-item label="Parameters" prop="parameters">
          <el-input
            v-model="parametersJson"
            type="textarea"
            :rows="6"
            placeholder="Enter parameters as JSON"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">Cancel</el-button>
        <el-button type="primary" :loading="creating" @click="createTool">Create</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showTestDialog" title="Test MCP Tool" width="600px">
      <div v-if="testingTool">
        <h3 class="mb-4">{{ testingTool.title }}</h3>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { mcpToolsAPI } from '@/utils/api'
import type { MCPTool } from '@/types'

const activeTab = ref('my')
const myTools = ref<MCPTool[]>([])
const publishedTools = ref<MCPTool[]>([])
const loading = ref(false)
const creating = ref(false)
const testing = ref(false)

const showCreateDialog = ref(false)
const showTestDialog = ref(false)
const testingTool = ref<MCPTool | null>(null)
const testParameters = ref('')
const testResult = ref<any>(null)

const formRef = ref<FormInstance>()
const toolForm = ref({
  title: '',
  api_url: '',
  parameters: {}
})

const parametersJson = ref('{}')

const toolRules: FormRules = {
  title: [
    { required: true, message: 'Title is required', trigger: 'blur' }
  ],
  api_url: [
    { required: true, message: 'API URL is required', trigger: 'blur' }
  ]
}

onMounted(() => {
  loadTools()
})

const loadTools = async () => {
  loading.value = true
  try {
    const [myResponse, publishedResponse] = await Promise.all([
      mcpToolsAPI.getTools({ my_tools: true }),
      mcpToolsAPI.getTools({ status: 'published' })
    ])
    myTools.value = myResponse.data
    publishedTools.value = publishedResponse.data
  } catch (err) {
    ElMessage.error('Failed to load tools')
  } finally {
    loading.value = false
  }
}

const createTool = async () => {
  if (!formRef.value) return
  
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    toolForm.value.parameters = JSON.parse(parametersJson.value)
  } catch (err) {
    ElMessage.error('Invalid JSON in parameters')
    return
  }

  creating.value = true
  try {
    await mcpToolsAPI.createTool(toolForm.value)
    ElMessage.success('Tool created successfully')
    showCreateDialog.value = false
    toolForm.value = { title: '', api_url: '', parameters: {} }
    parametersJson.value = '{}'
    loadTools()
  } catch (err: any) {
    ElMessage.error(err.response?.data?.detail || 'Failed to create tool')
  } finally {
    creating.value = false
  }
}

const editTool = (tool: MCPTool) => {
  ElMessage.info('Edit functionality coming soon')
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

const getStatusType = (status: string) => {
  switch (status) {
    case 'published':
      return 'success'
    case 'waiting_for_admin_review':
      return 'warning'
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

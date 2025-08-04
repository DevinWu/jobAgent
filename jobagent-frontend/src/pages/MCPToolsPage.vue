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
                <el-button size="small" @click="deleteTool(scope.row)">Delete</el-button>
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

    <el-dialog 
      v-model="showCreateDialog" 
      title="Create New MCP Tool" 
      width="600px"
      @open="handleCreateDialogOpen"
    >
      <el-form ref="formRef" :model="toolForm" :rules="toolRules" label-width="120px">
        <el-form-item label="Title" prop="title">
          <el-input v-model="toolForm.title" placeholder="Enter tool title" />
        </el-form-item>
        
        <el-form-item label="API URL" prop="api_url">
          <el-input v-model="toolForm.api_url" placeholder="Enter API URL" />
        </el-form-item>
        
        <el-form-item label="Parameters">
          <div class="parameters-container">
            <div v-for="(param, index) in parametersList" :key="index" class="parameter-row">
              <el-input 
                v-model="param.name" 
                placeholder="Parameter name" 
                class="param-name"
              />
              <el-select 
                v-model="param.type" 
                placeholder="Type"
                class="param-type"
              >
                <el-option 
                  v-for="type in parameterTypes" 
                  :key="type.value" 
                  :label="type.label" 
                  :value="type.value" 
                />
              </el-select>
              <el-checkbox v-model="param.required" label="Required" class="param-required" />
              <el-button 
                type="danger" 
                circle 
                @click="removeParameter(index)" 
                :icon="Delete"
                class="param-delete"
              />
            </div>
            
            <div class="add-param-row">
              <el-button type="primary" @click="addParameter" plain>
                <el-icon class="mr-1"><Plus /></el-icon>
                Add Parameter
              </el-button>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="JSON Preview" v-if="parametersList.length > 0">
          <el-input
            v-model="parametersJson"
            type="textarea"
            :rows="4"
            readonly
            placeholder="Parameters JSON preview"
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
        
        <!-- 动态参数表单 -->
        <div v-if="testingTool.parameters && Object.keys(testingTool.parameters).length > 0">
          <el-form label-width="120px">
            <el-form-item 
              v-for="(config, name) in testingTool.parameters" 
              :key="name"
              :label="name"
              :required="config.required"
            >
              <!-- 字符串类型 -->
              <el-input 
                v-if="config.type === 'str'" 
                v-model="testParamValues[name]" 
                placeholder="Enter string value"
              />
              
              <!-- 整数类型 -->
              <el-input-number 
                v-else-if="config.type === 'int'" 
                v-model="testParamValues[name]" 
                :controls="true"
                :precision="0"
                style="width: 100%"
              />
              
              <!-- 浮点数类型 -->
              <el-input-number 
                v-else-if="config.type === 'float'" 
                v-model="testParamValues[name]" 
                :controls="true"
                :precision="2"
                style="width: 100%"
              />
              
              <!-- 布尔类型 -->
              <el-switch 
                v-else-if="config.type === 'bool'" 
                v-model="testParamValues[name]"
              />
              
              <!-- 列表类型 -->
              <el-input 
                v-else-if="config.type === 'list'" 
                v-model.lazy="testParamValues[name]" 
                type="textarea"
                :rows="2"
                placeholder="Enter as JSON array: [1, 2, 3]"
                @change="validateJsonInput(name, 'list')"
              />
              
              <!-- 字典类型 -->
              <el-input 
                v-else-if="config.type === 'dict'" 
                v-model.lazy="testParamValues[name]" 
                type="textarea"
                :rows="2"
                placeholder="Enter as JSON object: {'key': 'value'}"
                @change="validateJsonInput(name, 'dict')"
              />
              
              <!-- 默认输入框 -->
              <el-input 
                v-else 
                v-model="testParamValues[name]" 
                placeholder="Enter value"
              />
              
              <span class="param-type-hint">{{ config.type }}</span>
            </el-form-item>
          </el-form>
          
          <!-- JSON预览 -->
          <el-collapse class="mt-4">
            <el-collapse-item title="JSON Preview">
              <pre class="json-preview">{{ JSON.stringify(testParamValues, null, 2) }}</pre>
            </el-collapse-item>
          </el-collapse>
        </div>
        
        <!-- 无参数情况 -->
        <el-alert
          v-else
          title="This tool has no parameters"
          type="info"
          :closable="false"
        />
        
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
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
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
const testParamValues = ref<Record<string, any>>({})

const formRef = ref<FormInstance>()
const toolForm = ref({
  title: '',
  api_url: '',
  parameters: {}
})

// 参数列表，用于UI显示和交互
const parametersList = ref<Array<{name: string, type: string, required: boolean}>>([])

// 可选的参数类型
const parameterTypes = [
  { label: 'String (str)', value: 'str' },
  { label: 'Integer (int)', value: 'int' },
  { label: 'Float', value: 'float' },
  { label: 'Boolean (bool)', value: 'bool' },
  { label: 'List', value: 'list' },
  { label: 'Dictionary (dict)', value: 'dict' }
]

// 添加新参数
const addParameter = () => {
  parametersList.value.push({ name: '', type: 'str', required: false })
}

// 删除参数
const removeParameter = (index: number) => {
  parametersList.value.splice(index, 1)
}

// 将参数列表转换为JSON对象
const updateParametersJson = () => {
  const params: Record<string, any> = {}
  parametersList.value.forEach(param => {
    if (param.name.trim()) {
      params[param.name] = {
        type: param.type,
        required: param.required
      }
    }
  })
  return params
}

// 监听对话框打开，初始化参数列表
const handleCreateDialogOpen = () => {
  // 清空参数列表
  parametersList.value = []
  // 添加一个空参数作为起点
  addParameter()
}

// 用于存储JSON字符串，但现在主要用于内部转换
const parametersJson = computed(() => {
  return JSON.stringify(updateParametersJson(), null, 2)
})

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

  // 检查参数名称是否为空
  const emptyParams = parametersList.value.filter(param => !param.name.trim())
  if (emptyParams.length > 0) {
    ElMessage.warning('Parameter names cannot be empty')
    return
  }

  // 使用更新后的参数
  toolForm.value.parameters = updateParametersJson()

  creating.value = true
  try {
    await mcpToolsAPI.createTool(toolForm.value)
    ElMessage.success('Tool created successfully')
    showCreateDialog.value = false
    toolForm.value = { title: '', api_url: '', parameters: {} }
    parametersList.value = []
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

// 解析工具参数定义，返回参数列表
const parseToolParameters = (tool: MCPTool) => {
  const result: Array<{name: string, type: string, required: boolean}> = []
  
  if (tool && tool.parameters) {
    Object.entries(tool.parameters).forEach(([name, config]) => {
      // 确保config是一个对象，并且有type和required属性
      if (typeof config === 'object' && config !== null) {
        const paramType = (config as any).type || 'str'
        const required = !!(config as any).required
        result.push({ name, type: paramType, required })
      }
    })
  }
  
  return result
}

// 根据参数类型获取默认值
const getDefaultValueForType = (type: string) => {
  switch (type) {
    case 'str':
      return ''
    case 'int':
      return 0
    case 'float':
      return 0.0
    case 'bool':
      return false
    case 'list':
      return []
    case 'dict':
      return {}
    default:
      return ''
  }
}

// 初始化测试参数值
const initTestParamValues = (tool: MCPTool) => {
  const params = parseToolParameters(tool)
  const values: Record<string, any> = {}
  
  params.forEach(param => {
    // 如果有示例输入，使用示例值
    if (tool.sample_input && param.name in tool.sample_input) {
      values[param.name] = tool.sample_input[param.name]
    } else {
      // 否则使用默认值
      values[param.name] = getDefaultValueForType(param.type)
    }
  })
  
  return values
}

const testTool = (tool: MCPTool) => {
  testingTool.value = tool
  testParameters.value = JSON.stringify(tool.sample_input || {}, null, 2)
  testResult.value = null
  // 初始化测试参数值
  testParamValues.value = initTestParamValues(tool)
  showTestDialog.value = true
}

const deleteTool = (tool: MCPTool) => {
  ElMessageBox.confirm(
    `Are you sure you want to delete the tool "${tool.title}"?`,
    'Warning',
    {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }
  )
    .then(async () => {
      loading.value = true
      try {
        await mcpToolsAPI.deleteTool(tool.id)
        ElMessage.success('Tool deleted successfully')
        // 重新加载工具列表
        loadTools()
      } catch (err: any) {
        ElMessage.error(err.response?.data?.detail || 'Failed to delete tool')
      } finally {
        loading.value = false
      }
    })
    .catch(() => {
      // 用户取消删除操作
    })
}

// 验证JSON输入
const validateJsonInput = (paramName: string, type: 'list' | 'dict') => {
  try {
    const value = testParamValues.value[paramName]
    
    // 如果是空字符串，设置为空数组或空对象
    if (value === '') {
      testParamValues.value[paramName] = type === 'list' ? [] : {}
      return
    }
    
    // 如果是字符串，尝试解析
    if (typeof value === 'string') {
      const parsed = JSON.parse(value)
      
      // 验证类型
      if (type === 'list' && !Array.isArray(parsed)) {
        ElMessage.warning(`Parameter ${paramName} should be an array`)
        return
      }
      
      if (type === 'dict' && (Array.isArray(parsed) || typeof parsed !== 'object' || parsed === null)) {
        ElMessage.warning(`Parameter ${paramName} should be an object`)
        return
      }
      
      // 更新值为解析后的对象
      testParamValues.value[paramName] = parsed
    }
  } catch (err) {
    ElMessage.error(`Invalid JSON for parameter ${paramName}`)
  }
}

// 处理复杂类型的参数值
const prepareParamValue = (value: any, type: string) => {
  if (type === 'list' || type === 'dict') {
    // 如果已经是对象或数组，直接返回
    if (typeof value === 'object' && value !== null) {
      return value
    }
    
    // 如果是字符串，尝试解析
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch (err) {
        // 解析失败，返回空数组或空对象
        return type === 'list' ? [] : {}
      }
    }
    
    // 默认返回空数组或空对象
    return type === 'list' ? [] : {}
  }
  
  return value
}

const runTest = async () => {
  if (!testingTool.value) return

  // 准备参数
  const params: Record<string, any> = {}
  
  if (testingTool.value.parameters) {
    Object.entries(testingTool.value.parameters).forEach(([name, config]) => {
      if (name in testParamValues.value) {
        // 处理复杂类型的参数值
        params[name] = prepareParamValue(testParamValues.value[name], (config as any).type)
      }
    })
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

/* 参数表单样式 */
.parameters-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.parameter-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.param-name {
  flex: 2;
  min-width: 150px;
}

.param-type {
  flex: 1;
  min-width: 120px;
}

.param-required {
  flex: 0.8;
  min-width: 100px;
}

.param-delete {
  flex: 0 0 auto;
}

.add-param-row {
  margin-top: 8px;
}

/* 预览JSON区域样式 */
.el-textarea.is-readonly .el-textarea__inner {
  background-color: #f5f7fa;
  color: #606266;
}

/* 测试参数表单样式 */
.param-type-hint {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
}

.json-preview {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  font-size: 12px;
  color: #606266;
}

/* 测试结果样式 */
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
  font-size: 12px;
}
</style>

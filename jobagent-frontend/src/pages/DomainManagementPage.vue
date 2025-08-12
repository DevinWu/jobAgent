<template>
  <div class="domain-management-page">
    <el-card class="header-card">
      <template #header>
        <div class="header-content">
          <h1>Domain Management</h1>
          <el-dropdown @command="handleTabChange" trigger="click">
            <el-button type="primary">
              {{ getActiveTabLabel() }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="published">My Published Domains</el-dropdown-item>
                <el-dropdown-item command="pending">Pending Review Domains</el-dropdown-item>
                <el-dropdown-item divided command="create">Create New Domain</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </template>
      
      <div>
        <div v-if="activeTab === 'create'">
          <div class="create-domain-section">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-form-item label="Domain Name">
                  <el-input
                    v-model="domainStore.title"
                    placeholder="Enter domain name"
                    @input="handleTitleChange"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="18">
                <el-form-item label="Domain Knowledge">
                  <el-input
                    v-model="domainStore.description"
                    type="textarea"
                    :rows="15"
                    placeholder="Describe how to diagnose failure jobs in this domain"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-alert
              v-if="domainStore.error"
              :title="domainStore.error"
              type="error"
              :closable="false"
              style="margin-bottom: 20px"
            />

            <div class="action-buttons">
              <el-button
                @click="handleSave(false)"
                :loading="domainStore.loading"
                :disabled="domainStore.loading"
              >
                <el-icon><Document /></el-icon>
                Save Draft
              </el-button>

              <el-button
                type="primary"
                @click="handleSave(true)"
                :loading="domainStore.loading"
                :disabled="domainStore.loading"
              >
                <el-icon><Upload /></el-icon>
                Submit For Review
              </el-button>
            </div>

            <el-row :gutter="20" class="workflow-section">
              <el-col :span="6">
                <el-card class="tools-panel">
                  <template #header>
                    <h3>Available Tools</h3>
                  </template>
                  
                  <div v-loading="loadingTools" class="tools-list">
                    <div
                      v-for="tool in availableTools"
                      :key="tool.id"
                      class="tool-item"
                      draggable="true"
                      @dragstart="handleDragStart(tool, $event)"
                    >
                      <div class="tool-block">
                        <div class="tool-title">{{ tool.title }}</div>
                        <div class="tool-type">MCP Tool</div>
                      </div>
                    </div>
                    
                    <div class="create-tool-item">
                      <el-button type="primary" size="small" @click="navigateToMCPTools">
                        <el-icon><Plus /></el-icon>
                        Create New Tool
                      </el-button>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="12">
                <el-card class="flow-builder">
                  <template #header>
                    <h3>Flow Builder</h3>
                  </template>
                  
                  <div class="vue-flow-container">
                    <VueFlow
                      v-model:nodes="workflowStore.nodes"
                      v-model:edges="workflowStore.edges"
                      @node-click="handleNodeClick"
                      @drop="handleDrop"
                      @dragover="handleDragOver"
                      class="vue-flow"
                    >
                      <Background />
                      <Controls />
                      
                      <template #node-domain="{ data }">
                        <div class="custom-node domain-node">
                          <div class="node-header">{{ data.title }}</div>
                          <div class="node-type">Domain</div>
                        </div>
                      </template>
                      
                      <template #node-mcp_tool="{ data, id }">
                        <div class="custom-node tool-node">
                          <div class="node-header">
                            {{ data.title }}
                            <el-button
                              type="danger"
                              size="small"
                              text
                              @click="handleNodeDelete(id)"
                            >
                              <el-icon><Delete /></el-icon>
                            </el-button>
                          </div>
                          <div class="node-type">MCP Tool</div>
                        </div>
                      </template>
                    </VueFlow>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="6">
                <el-card class="config-panel">
                  <template #header>
                    <h3>Configuration</h3>
                  </template>
                  
                  <div v-if="workflowStore.selectedNode" class="node-config">
                    <h4>{{ workflowStore.selectedNode.data.title }}</h4>
                    <p class="node-type-label">
                      {{ workflowStore.selectedNode.type === 'domain' ? 'Domain Configuration' : 'Tool Configuration' }}
                    </p>
                    
                    <div v-if="workflowStore.selectedNode.type === 'domain'" class="domain-config">
                      <el-form-item label="Title">
                        <el-input
                          v-model="domainStore.title"
                          size="small"
                          @input="handleTitleChange"
                        />
                      </el-form-item>
                      <el-form-item label="Description">
                        <el-input
                          v-model="domainStore.description"
                          type="textarea"
                          :rows="3"
                          size="small"
                        />
                      </el-form-item>
                    </div>
                    
                    <div v-else-if="selectedTool" class="tool-config">
                      <div v-if="selectedTool.parameters && Object.keys(selectedTool.parameters).length > 0">
                        <div v-for="(paramConfig, paramName) in selectedTool.parameters" :key="paramName" class="param-item">
                          <el-form-item :label="paramName">
                            <!-- 字符串类型 -->
                            <el-input
                              v-if="paramConfig.type === 'str'"
                              v-model="toolParamValues[paramName]"
                              size="small"
                              @input="updateConfigJson"
                            />
                            
                            <!-- 整数类型 -->
                            <el-input-number
                              v-else-if="paramConfig.type === 'int'"
                              v-model="toolParamValues[paramName]"
                              :precision="0"
                              :step="1"
                              size="small"
                              @change="updateConfigJson"
                            />
                            
                            <!-- 浮点数类型 -->
                            <el-input-number
                              v-else-if="paramConfig.type === 'float'"
                              v-model="toolParamValues[paramName]"
                              :precision="2"
                              :step="0.1"
                              size="small"
                              @change="updateConfigJson"
                            />
                            
                            <!-- 布尔类型 -->
                            <el-switch
                              v-else-if="paramConfig.type === 'bool'"
                              v-model="toolParamValues[paramName]"
                              @change="updateConfigJson"
                            />
                            
                            <!-- 列表类型 -->
                            <div v-else-if="paramConfig.type === 'list'" class="complex-type-input">
                              <el-input
                                v-model="toolParamValues[paramName]"
                                type="textarea"
                                :rows="3"
                                size="small"
                                placeholder="Enter JSON array"
                                @blur="validateJsonInput(paramName, 'list'); updateConfigJson()"
                              />
                            </div>
                            
                            <!-- 字典类型 -->
                            <div v-else-if="paramConfig.type === 'dict'" class="complex-type-input">
                              <el-input
                                v-model="toolParamValues[paramName]"
                                type="textarea"
                                :rows="3"
                                size="small"
                                placeholder="Enter JSON object"
                                @blur="validateJsonInput(paramName, 'dict'); updateConfigJson()"
                              />
                            </div>
                            
                            <!-- 默认为字符串类型 -->
                            <el-input
                              v-else
                              v-model="toolParamValues[paramName]"
                              size="small"
                              @input="updateConfigJson"
                            />
                          </el-form-item>
                          
                          <div v-if="paramConfig.description" class="param-description">
                            <small>{{ paramConfig.description }}</small>
                          </div>
                        </div>
                      </div>
                      
                      <div v-else class="no-params">
                        <p>This tool has no configurable parameters.</p>
                      </div>
                      
                      <el-collapse class="json-preview">
                        <el-collapse-item title="JSON Preview">
                          <pre>{{ configJson }}</pre>
                        </el-collapse-item>
                      </el-collapse>
                      
                      <div class="api-url">
                        <small>API URL: {{ selectedTool.api_url }}</small>
                      </div>
                    </div>
                  </div>
                  
                  <div v-else class="no-selection">
                    <p>Select a node to configure</p>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </div>

        <div v-if="activeTab === 'published'">
          <el-table :data="publishedDomains" :loading="loadingDomains" stripe>
            <el-table-column prop="title" label="Domain Title" width="200" />
            <el-table-column prop="description" label="Description" show-overflow-tooltip />
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
                <div class="action-buttons-cell">
                  <el-button
                    type="primary"
                    size="small"
                    @click="handleEditDomain(scope.row)"
                  >
                    <el-icon><Edit /></el-icon>
                    Edit
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    @click="handleDeleteDomain(scope.row)"
                    :disabled="scope.row.status === 'published'"
                  >
                    <el-icon><Delete /></el-icon>
                    Delete
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="activeTab === 'pending'">
          <el-table :data="pendingDomains" :loading="loadingDomains" stripe>
            <el-table-column prop="title" label="Domain Title" width="200" />
            <el-table-column prop="description" label="Description" show-overflow-tooltip />
            <el-table-column prop="status" label="Status" width="150">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="admin_comments" label="Admin Comments" show-overflow-tooltip />
            <el-table-column prop="created_at" label="Submitted" width="150">
              <template #default="scope">
                {{ formatDate(scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="Actions" width="200">
              <template #default="scope">
                <div class="action-buttons-cell">
                  <el-button
                    type="primary"
                    size="small"
                    @click="handleEditDomain(scope.row)"
                    :disabled="scope.row.status === 'published'"
                  >
                    <el-icon><Edit /></el-icon>
                    Edit
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    @click="handleDeleteDomain(scope.row)"
                    :disabled="scope.row.status === 'published'"
                  >
                    <el-icon><Delete /></el-icon>
                    Delete
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { Document, Upload, Plus, Delete, Edit, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { useDomainStore } from '@/stores/domain'
import { useWorkflowStore } from '@/stores/workflow'
import { domainsAPI, mcpToolsAPI } from '@/utils/api'
import type { MCPTool, FlowNode, FlowEdge, Domain } from '@/types'

const router = useRouter()
const domainStore = useDomainStore()
const workflowStore = useWorkflowStore()

const activeTab = ref('create')
const configJson = ref('')
const toolParamValues = ref<Record<string, any>>({})
const myDomains = ref<Domain[]>([])
const loadingDomains = ref(false)
const availableTools = ref<MCPTool[]>([])
const loadingTools = ref(false)

const publishedDomains = computed(() => 
  myDomains.value.filter(domain => domain.status === 'published')
)

const pendingDomains = computed(() => 
  myDomains.value.filter(domain => 
    domain.status === 'waiting_for_admin_review' || 
    domain.status === 'rejected' || 
    domain.status === 'draft'
  )
)

const selectedTool = computed(() => {
  if (!workflowStore.selectedNode || workflowStore.selectedNode.type !== 'mcp_tool') {
    return null
  }
  return availableTools.value.find(tool => tool.id === workflowStore.selectedNode.data.tool_id)
})

onMounted(() => {
  loadAvailableTools()
  loadMyDomains()
})

watch(() => workflowStore.selectedNode, (newNode) => {
  if (newNode && newNode.type === 'mcp_tool') {
    configJson.value = JSON.stringify(newNode.data.config || {}, null, 2)
    initToolParamValues()
  } else {
    configJson.value = ''
    toolParamValues.value = {}
  }
})

const loadAvailableTools = async () => {
  loadingTools.value = true
  try {
    const response = await mcpToolsAPI.getTools({ status: 'published' })
    availableTools.value = response.data
  } catch (err) {
    ElMessage.error('Failed to load tools')
  } finally {
    loadingTools.value = false
  }
}

const loadMyDomains = async () => {
  loadingDomains.value = true
  try {
    const response = await domainsAPI.getMyDomains()
    myDomains.value = response.data
  } catch (err) {
    ElMessage.error('Failed to load domains')
  } finally {
    loadingDomains.value = false
  }
}

const navigateToMCPTools = () => {
  router.push('/mcp-tools')
}

const handleTitleChange = () => {
  workflowStore.updateDomainTitle(domainStore.title)
}

const handleDragStart = (tool: MCPTool, event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify(tool))
    event.dataTransfer.effectAllowed = 'copy'
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  
  try {
    const toolData = event.dataTransfer?.getData('application/json')
    if (!toolData) return
    
    const tool: MCPTool = JSON.parse(toolData)
    
    // 创建新节点
    const newNodeId = `tool_${Date.now()}`
    const newNode: FlowNode = {
      id: newNodeId,
      type: 'mcp_tool',
      position: { x: event.offsetX - 75, y: event.offsetY - 25 },
      data: {
        title: tool.title,
        tool_id: tool.id,
        config: {}
      }
    }
    
    // 添加新节点
    workflowStore.addNode(newNode)
    
    // 查找domain节点
    const domainNode = workflowStore.nodes.find(node => node.type === 'domain')
    
    if (domainNode) {
      // 创建从domain节点到新节点的连接
      const newEdge: FlowEdge = {
        id: `e-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: domainNode.id,
        target: newNodeId
      }
      
      // 添加新连接
      workflowStore.addEdge(newEdge)
      
      console.log('Created connection from domain to new tool:', newEdge)
    }
    
    ElMessage.success(`Added ${tool.title} to workflow`)
  } catch (error) {
    console.error('Failed to parse dropped tool data:', error)
    ElMessage.error('Failed to add tool to workflow')
  }
}

const handleNodeClick = (event: any) => {
  workflowStore.selectNode(event.node.id)
}

const handleNodeDelete = (nodeId: string) => {
  workflowStore.removeNode(nodeId)
}

// 验证JSON输入
const validateJsonInput = (paramName: string, type: 'list' | 'dict') => {
  try {
    const value = toolParamValues.value[paramName]
    
    // 如果是空字符串，设置为空数组或空对象
    if (value === '') {
      toolParamValues.value[paramName] = type === 'list' ? [] : {}
      return
    }
    
    // 如果是字符串，尝试解析
    if (typeof value === 'string') {
      const parsed = JSON.parse(value)
      
      // 验证类型
      if (type === 'list' && !Array.isArray(parsed)) {
        ElMessage.warning(`参数 ${paramName} 应该是一个数组`)
        return
      }
      
      if (type === 'dict' && (Array.isArray(parsed) || typeof parsed !== 'object' || parsed === null)) {
        ElMessage.warning(`参数 ${paramName} 应该是一个对象`)
        return
      }
      
      // 更新值为解析后的对象
      toolParamValues.value[paramName] = parsed
    }
  } catch (err) {
    ElMessage.error(`参数 ${paramName} 的JSON格式无效`)
  }
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
      return '[]'
    case 'dict':
      return '{}'
    default:
      return ''
  }
}

// 初始化工具参数值
const initToolParamValues = () => {
  if (!selectedTool.value || !selectedTool.value.parameters) {
    toolParamValues.value = {}
    return
  }
  
  const initialValues: Record<string, any> = {}
  
  Object.entries(selectedTool.value.parameters).forEach(([name, config]) => {
    if (typeof config === 'object' && config !== null) {
      const paramType = (config as any).type || 'str'
      
      // 如果节点已有配置，使用现有值
      if (workflowStore.selectedNode && 
          workflowStore.selectedNode.data.config && 
          workflowStore.selectedNode.data.config[name] !== undefined) {
        initialValues[name] = workflowStore.selectedNode.data.config[name]
      } else {
        // 否则使用默认值
        initialValues[name] = getDefaultValueForType(paramType)
      }
    }
  })
  
  toolParamValues.value = initialValues
  
  // 同步到configJson
  updateConfigJson()
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

// 更新configJson
const updateConfigJson = () => {
  const config: Record<string, any> = {}
  
  if (selectedTool.value && selectedTool.value.parameters) {
    Object.entries(selectedTool.value.parameters).forEach(([name, paramConfig]) => {
      if (typeof paramConfig === 'object' && paramConfig !== null) {
        const paramType = (paramConfig as any).type || 'str'
        if (toolParamValues.value[name] !== undefined) {
          config[name] = prepareParamValue(toolParamValues.value[name], paramType)
        }
      }
    })
  }
  
  configJson.value = JSON.stringify(config, null, 2)
  
  // 更新节点配置
  if (workflowStore.selectedNode && selectedTool.value) {
    workflowStore.updateNodeData(workflowStore.selectedNode.id, { config })
  }
}

const handleConfigChange = () => {
  if (!workflowStore.selectedNode) return
  
  try {
    const config = JSON.parse(configJson.value)
    workflowStore.updateNodeData(workflowStore.selectedNode.id, { config })
    
    // 同步到toolParamValues
    Object.entries(config).forEach(([key, value]) => {
      toolParamValues.value[key] = value
    })
  } catch (error) {
    // 无效的JSON，不更新配置
  }
}

const validateFlow = () => {
  const validationError = workflowStore.validateFlow(domainStore.title, domainStore.description)
  if (validationError) {
    domainStore.setError(validationError)
    return false
  }
  return true
}

const handleEditDomain = async (domain: Domain) => {
  try {
    // 获取域名的详细信息
    const response = await domainsAPI.getDomain(domain.id)
    const domainDetail = response.data
    
    // 详细打印domainDetail和flow_config
    console.log('Domain Detail:', domainDetail)
    console.log('Flow Config:', domainDetail.flow_config)
    
    if (domainDetail.flow_config) {
      console.log('Flow Config Type:', typeof domainDetail.flow_config)
      console.log('Flow Config Nodes:', domainDetail.flow_config.nodes)
      console.log('Flow Config Connections:', domainDetail.flow_config.connections || domainDetail.flow_config.edges)
    }

    // 设置domainStore
    domainStore.setTitle(domainDetail.title)
    domainStore.setDescription(domainDetail.description)
    domainStore.setEditingId(domainDetail.id)

    // 设置workflowStore
    if (domainDetail.flow_config) {
      try {
        // 如果flow_config是字符串，尝试解析它
        const flowConfig = typeof domainDetail.flow_config === 'string' 
          ? JSON.parse(domainDetail.flow_config) 
          : domainDetail.flow_config
          
        console.log('Parsed Flow Config:', flowConfig)
        
        // 确保flow_config有正确的结构
        if (!flowConfig.nodes) {
          console.error('Flow config does not have nodes array')
          ElMessage.warning('Invalid workflow configuration, creating a new one')
          workflowStore.reset()
        } else {
          // 在加载前重置工作流
          workflowStore.reset()
          
          // 加载flow_config
          workflowStore.loadFlowConfig(flowConfig)
          
          // 验证加载是否成功
          setTimeout(() => {
            console.log('Verifying loaded workflow:')
            console.log('Current nodes:', workflowStore.nodes)
            console.log('Current edges:', workflowStore.edges)
            
            if (workflowStore.nodes.length === 0) {
              console.warn('No nodes were loaded from flow_config')
              ElMessage.warning('Failed to load workflow nodes, creating a new one')
              workflowStore.reset()
            } else {
              // 确保域节点的标题与域名标题一致
              const domainNode = workflowStore.nodes.find(node => node.type === 'domain')
              if (domainNode) {
                domainNode.data.title = domainStore.title
                console.log('Updated domain node title:', domainNode)
              }
              
              ElMessage.success(`Successfully loaded workflow with ${workflowStore.nodes.length} nodes`)
            }
          }, 100) // 短暂延迟以确保Vue更新完成
        }
      } catch (error) {
        console.error('Error loading flow config:', error)
        ElMessage.error(`Failed to load workflow: ${error.message}`)
        workflowStore.reset()
      }
    } else {
      console.log('No flow config found, resetting workflow')
      workflowStore.reset()
    }
    
    // 切换到创建标签页
    activeTab.value = 'create'
    
    ElMessage.info('You are now editing the domain. Save as draft or submit for review when done.')
  } catch (err: any) {
    const errorMessage = err.response?.data?.detail || 'Failed to load domain for editing'
    ElMessage.error(errorMessage)
  }
}

const handleSave = async (submitForReview = false) => {
  if (!validateFlow()) return

  domainStore.setLoading(true)
  domainStore.clearError()

  try {
    const flowConfig = workflowStore.getFlowConfig()

    const domainData = {
      title: domainStore.title,
      description: domainStore.description,
      flow_config: flowConfig,
      status: submitForReview ? 'waiting_for_admin_review' : 'draft'
    }

    if (domainStore.editingId) {
      // 更新现有域名
      await domainsAPI.updateDomain(domainStore.editingId, domainData)
      ElMessage.success(submitForReview ? 'Domain updated and submitted for review!' : 'Domain updated as draft!')
    } else {
      // 创建新域名
      await domainsAPI.createDomain(domainData)
      ElMessage.success(submitForReview ? 'Domain submitted for review!' : 'Domain saved as draft!')
    }
    
    domainStore.reset()
    workflowStore.reset()
    loadMyDomains()
    activeTab.value = submitForReview ? 'pending' : 'published'
  } catch (err: any) {
    const errorMessage = err.response?.data?.detail || 'Failed to save domain'
    domainStore.setError(errorMessage)
    ElMessage.error(errorMessage)
  } finally {
    domainStore.setLoading(false)
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

const getActiveTabLabel = () => {
  switch (activeTab.value) {
    case 'create':
      return 'Create New Domain'
    case 'published':
      return 'My Published Domains'
    case 'pending':
      return 'Pending Review Domains'
    default:
      return 'Select Option'
  }
}

const handleTabChange = (command: string) => {
  activeTab.value = command
}

const handleDeleteDomain = (domain: Domain) => {
  ElMessageBox.confirm(
    `Are you sure you want to delete the domain "${domain.title}"? This action cannot be undone.`,
    'Warning',
    {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        await domainsAPI.deleteDomain(domain.id)
        ElMessage.success('Domain deleted successfully')
        // Reload the domains list
        loadMyDomains()
      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || 'Failed to delete domain'
        ElMessage.error(errorMessage)
      }
    })
    .catch(() => {
      // User canceled the deletion
    })
}
</script>

<style scoped>
.domain-management-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.create-domain-section {
  padding: 20px 0;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.workflow-section {
  min-height: 600px;
}

.tools-panel {
  height: 600px;
}

.tools-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool-item {
  cursor: move;
  margin-bottom: 12px;
  transition: transform 0.2s;
}

.tool-item:hover {
  transform: translateY(-2px);
}

.tool-block {
  padding: 10px;
  border-radius: 6px;
  border: 2px solid #1890ff;
  background: #e6f7ff;
  min-width: 120px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s;
}

.tool-item:hover .tool-block {
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.tool-title {
  font-weight: bold;
  font-size: 12px;
  margin-bottom: 4px;
}

.tool-type {
  font-size: 10px;
  color: #666;
}

.create-tool-item {
  margin-top: 10px;
}

.flow-builder {
  height: 600px;
}

.vue-flow-container {
  width: 100%;
  height: 520px;
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
}

.vue-flow {
  height: 100%;
}

.custom-node {
  padding: 10px;
  border-radius: 6px;
  border: 2px solid #d9d9d9;
  background: white;
  min-width: 120px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.domain-node {
  background: #f6ffed;
  border-color: #52c41a;
}

.tool-node {
  background: #e6f7ff;
  border-color: #1890ff;
}

.node-header {
  font-weight: bold;
  font-size: 12px;
  margin-bottom: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.node-type {
  font-size: 10px;
  color: #666;
}

.config-panel {
  height: 600px;
}

.node-config h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.node-type-label {
  font-size: 12px;
  color: #666;
  margin: 0 0 16px 0;
}

.api-url {
  margin-top: 8px;
  color: #666;
}

.no-selection {
  text-align: center;
  color: #999;
  margin-top: 50px;
}

.param-item {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #eee;
}

.param-item:last-child {
  border-bottom: none;
}

.param-description {
  margin-top: 4px;
  color: #666;
  font-size: 12px;
  line-height: 1.4;
}

.complex-type-input {
  margin-top: 4px;
}

.json-preview {
  margin-top: 16px;
  margin-bottom: 16px;
  border-top: 1px solid #eee;
  padding-top: 12px;
}

.json-preview pre {
  background-color: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
}

.no-params {
  color: #999;
  font-style: italic;
  padding: 10px 0;
}
</style>

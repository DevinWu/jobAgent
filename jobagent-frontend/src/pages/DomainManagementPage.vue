<template>
  <div class="domain-management-page">
    <el-card class="header-card">
      <template #header>
        <h1>Domain Management</h1>
      </template>
      
      <el-tabs v-model="activeTab" class="demo-tabs">
        <el-tab-pane label="Create New Domain" name="create">
          <div class="create-domain-section">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Domain Title">
                  <el-input
                    v-model="domainStore.title"
                    placeholder="Enter domain title (one word)"
                    @input="handleTitleChange"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Domain Description">
                  <el-input
                    v-model="domainStore.description"
                    type="textarea"
                    :rows="3"
                    placeholder="Describe how to diagnose failures in this domain"
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
                Submit for Review
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
                      <el-tag type="info">{{ tool.title }}</el-tag>
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
                      <el-form-item label="Parameters">
                        <el-input
                          v-model="configJson"
                          type="textarea"
                          :rows="4"
                          size="small"
                          placeholder="Configure tool parameters (JSON)"
                          @input="handleConfigChange"
                        />
                      </el-form-item>
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
        </el-tab-pane>

        <el-tab-pane label="My Published Domains" name="published">
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
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="Pending Review" name="pending">
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
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { Document, Upload, Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

import { useDomainStore } from '@/stores/domain'
import { useWorkflowStore } from '@/stores/workflow'
import { domainsAPI, mcpToolsAPI } from '@/utils/api'
import type { MCPTool, FlowNode, Domain } from '@/types'

const router = useRouter()
const domainStore = useDomainStore()
const workflowStore = useWorkflowStore()

const activeTab = ref('create')
const configJson = ref('')
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
  } else {
    configJson.value = ''
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
    
    const newNode: FlowNode = {
      id: `tool_${Date.now()}`,
      type: 'mcp_tool',
      position: { x: event.offsetX - 75, y: event.offsetY - 25 },
      data: {
        title: tool.title,
        tool_id: tool.id,
        config: {}
      }
    }
    
    workflowStore.addNode(newNode)
  } catch (error) {
    console.error('Failed to parse dropped tool data:', error)
  }
}

const handleNodeClick = (event: any) => {
  workflowStore.selectNode(event.node.id)
}

const handleNodeDelete = (nodeId: string) => {
  workflowStore.removeNode(nodeId)
}

const handleConfigChange = () => {
  if (!workflowStore.selectedNode) return
  
  try {
    const config = JSON.parse(configJson.value)
    workflowStore.updateNodeData(workflowStore.selectedNode.id, { config })
  } catch (error) {
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

    await domainsAPI.createDomain(domainData)
    
    ElMessage.success(submitForReview ? 'Domain submitted for review!' : 'Domain saved as draft!')
    
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
  padding: 8px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #f5f7fa;
  transition: background-color 0.3s;
}

.tool-item:hover {
  background: #e6f7ff;
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
</style>

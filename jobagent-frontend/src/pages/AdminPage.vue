<template>
  <div class="max-w-6xl mx-auto">
    <div class="bg-white rounded-lg shadow-md p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      
      <el-tabs v-model="activeTab" class="demo-tabs">
        <el-tab-pane label="Pending Tool Reviews" name="pending-tools">
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

        <el-tab-pane label="Pending Domain Reviews" name="pending-domains">
          <el-table :data="pendingDomains" :loading="loadingDomains" stripe>
            <el-table-column prop="title" label="Domain Title" width="200" />
            <el-table-column prop="creator.username" label="Creator" width="150" />
            <el-table-column prop="description" label="Description" show-overflow-tooltip />
            <el-table-column prop="created_at" label="Submitted" width="150">
              <template #default="scope">
                {{ formatDate(scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="Actions" width="200">
              <template #default="scope">
                <el-button size="small" type="primary" @click="approveDomain(scope.row)">Approve</el-button>
                <el-button size="small" type="danger" @click="rejectDomain(scope.row)">Reject</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="User Management" name="users">
          <el-table :data="users" :loading="loadingUsers" stripe>
            <el-table-column prop="username" label="Username" width="200" />
            <el-table-column prop="email" label="Email" width="250" />
            <el-table-column prop="role" label="Role" width="150">
              <template #default="scope">
                <el-tag :type="getRoleType(scope.row.role)">
                  {{ getRoleDisplayName(scope.row.role) }}
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
                <el-button size="small" type="primary" @click="changeUserRole(scope.row)">Change Role</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="All Tools" name="all-tools">
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

        <el-tab-pane label="All Domains" name="all-domains">
          <el-table :data="allDomains" :loading="loadingDomains" stripe>
            <el-table-column prop="title" label="Domain Title" width="200" />
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
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="showTestDialog" title="Test MCP Tool" width="600px">
      <div v-if="testingTool">
        <h3 class="mb-4">{{ testingTool.title }}</h3>
        <p class="text-gray-600 mb-4">Creator: {{ testingTool.creator?.username }}</p>
        
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

    <el-dialog v-model="showDomainRejectDialog" title="Reject Domain" width="500px">
      <el-form label-width="120px">
        <el-form-item label="Rejection Reason">
          <el-input
            v-model="domainRejectionReason"
            type="textarea"
            :rows="4"
            placeholder="Enter reason for rejection"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showDomainRejectDialog = false">Cancel</el-button>
        <el-button type="danger" :loading="rejecting" @click="confirmRejectDomain">Reject Domain</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRoleChangeDialog" title="Change User Role" width="400px">
      <el-form label-width="120px">
        <el-form-item label="New Role">
          <el-select v-model="newUserRole" placeholder="Select role">
            <el-option label="User" value="user" />
            <el-option label="VIP User" value="vip_user" />
            <el-option label="Admin" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showRoleChangeDialog = false">Cancel</el-button>
        <el-button type="primary" :loading="rejecting" @click="confirmRoleChange">Update Role</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { mcpToolsAPI, adminAPI, domainsAPI } from '@/utils/api'
import type { MCPTool, Domain, User } from '@/types'

const activeTab = ref('pending-tools')
const pendingTools = ref<MCPTool[]>([])
const allTools = ref<MCPTool[]>([])
const pendingDomains = ref<Domain[]>([])
const allDomains = ref<Domain[]>([])
const users = ref<User[]>([])
const loading = ref(false)
const loadingDomains = ref(false)
const loadingUsers = ref(false)
const testing = ref(false)
const rejecting = ref(false)

const showTestDialog = ref(false)
const showRejectDialog = ref(false)
const showDomainRejectDialog = ref(false)
const showRoleChangeDialog = ref(false)
const testingTool = ref<MCPTool | null>(null)
const rejectingTool = ref<MCPTool | null>(null)
const rejectingDomain = ref<Domain | null>(null)
const changingRoleUser = ref<User | null>(null)
const testParameters = ref('')
const testResult = ref<any>(null)
const testParamValues = ref<Record<string, any>>({})
const rejectionReason = ref('')
const domainRejectionReason = ref('')
const newUserRole = ref('')

onMounted(() => {
  loadTools()
  loadDomains()
  loadUsers()
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

const loadDomains = async () => {
  loadingDomains.value = true
  try {
    const response = await adminAPI.getDomainsForReview()
    allDomains.value = response.data
    pendingDomains.value = response.data.filter((domain: Domain) => 
      domain.status === 'waiting_for_admin_review'
    )
  } catch (err) {
    ElMessage.error('Failed to load domains')
  } finally {
    loadingDomains.value = false
  }
}

const loadUsers = async () => {
  loadingUsers.value = true
  try {
    const response = await adminAPI.getUsers()
    users.value = response.data
  } catch (err) {
    ElMessage.error('Failed to load users')
  } finally {
    loadingUsers.value = false
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

const getRoleType = (role: string) => {
  switch (role) {
    case 'admin':
      return 'danger'
    case 'vip_user':
      return 'warning'
    case 'user':
      return 'info'
    default:
      return 'info'
  }
}

const getRoleDisplayName = (role: string) => {
  switch (role) {
    case 'admin':
      return 'Admin'
    case 'vip_user':
      return 'VIP User'
    case 'user':
      return 'User'
    default:
      return role
  }
}

const approveDomain = async (domain: Domain) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to approve "${domain.title}"?`,
      'Confirm Approval',
      {
        confirmButtonText: 'Approve',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    await domainsAPI.adminUpdateDomain(domain.id, {
      status: 'published',
      admin_comments: 'Approved by admin'
    })
    
    ElMessage.success('Domain approved successfully')
    loadDomains()
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.detail || 'Failed to approve domain')
    }
  }
}

const rejectDomain = (domain: Domain) => {
  rejectingDomain.value = domain
  domainRejectionReason.value = ''
  showDomainRejectDialog.value = true
}

const confirmRejectDomain = async () => {
  if (!rejectingDomain.value || !domainRejectionReason.value.trim()) {
    ElMessage.error('Please provide a rejection reason')
    return
  }

  rejecting.value = true
  try {
    await domainsAPI.adminUpdateDomain(rejectingDomain.value.id, {
      status: 'rejected',
      admin_comments: domainRejectionReason.value
    })
    
    ElMessage.success('Domain rejected successfully')
    showDomainRejectDialog.value = false
    loadDomains()
  } catch (err: any) {
    ElMessage.error(err.response?.data?.detail || 'Failed to reject domain')
  } finally {
    rejecting.value = false
  }
}

const changeUserRole = (user: User) => {
  changingRoleUser.value = user
  newUserRole.value = user.role
  showRoleChangeDialog.value = true
}

const confirmRoleChange = async () => {
  if (!changingRoleUser.value || !newUserRole.value) {
    ElMessage.error('Please select a role')
    return
  }

  rejecting.value = true
  try {
    await adminAPI.updateUserRole(changingRoleUser.value.id, {
      role: newUserRole.value
    })
    
    ElMessage.success('User role updated successfully')
    showRoleChangeDialog.value = false
    loadUsers()
  } catch (err: any) {
    ElMessage.error(err.response?.data?.detail || 'Failed to update user role')
  } finally {
    rejecting.value = false
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

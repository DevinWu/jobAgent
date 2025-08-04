import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authAPI = {
  register: (userData: { username: string; email: string; password: string }) =>
    api.post('/auth/register', userData),
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login', new URLSearchParams(credentials), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  getCurrentUser: () => api.get('/auth/me'),
}

export const domainsAPI = {
  getDomains: (publishedOnly = true) => api.get(`/domains/?published_only=${publishedOnly}`),
  getDomain: (id: number) => api.get(`/domains/${id}`),
  getMyDomains: () => api.get('/domains/my'),
  createDomain: (domainData: any) => api.post('/domains/', domainData),
  updateDomain: (id: number, domainData: any) => api.put(`/domains/${id}`, domainData),
  adminUpdateDomain: (id: number, adminData: any) => api.put(`/domains/${id}/admin`, adminData),
}

export const mcpToolsAPI = {
  getTools: (params?: { my_tools?: boolean; status?: string }) => 
    api.get('/mcp-tools/', { params }),
  getTool: (id: number) => api.get(`/mcp-tools/${id}`),
  createTool: (toolData: any) => api.post('/mcp-tools/', toolData),
  updateTool: (id: number, toolData: any) => api.put(`/mcp-tools/${id}`, toolData),
  adminUpdateTool: (id: number, adminData: any) => api.put(`/mcp-tools/${id}/admin`, adminData),
  executeTool: (id: number, parameters: any) => 
    api.post(`/mcp-tools/${id}/execute`, { parameters }),
  deleteTool: (id: number) => api.delete(`/mcp-tools/${id}`),
}

export const jobAnalysisAPI = {
  analyzeJob: (jobId: string, domainId: number) =>
    api.post('/job-analysis/', { job_id: jobId, domain_id: domainId }),
  getAnalysis: (jobId: string, domainId: number) =>
    api.get(`/job-analysis/${jobId}/${domainId}`),
}

export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (userId: number, roleData: any) => api.put(`/admin/users/${userId}/role`, roleData),
  getDomainsForReview: () => api.get('/admin/domains'),
}

export default api

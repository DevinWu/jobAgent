export interface User {
  id: number
  username: string
  email: string
  role: 'user' | 'admin'
  created_at: string
}

export interface Domain {
  id: number
  title: string
  description: string
  flow_config: any
  status: 'draft' | 'published'
  creator_id: number
  created_at: string
  updated_at: string
}

export interface MCPTool {
  id: number
  title: string
  api_url: string
  parameters: any
  status: 'draft' | 'waiting_for_admin_review' | 'published'
  creator_id: number
  admin_comments?: string
  sample_input?: any
  created_at: string
  updated_at: string
}

export interface JobAnalysis {
  id: number
  job_id: string
  domain_id: number
  failure_category: 'unknown' | 'userInputError' | 'ThirdPlatformError' | 'PlatformError'
  root_cause: string
  suggestions: string
  analysis_data: any
  created_at: string
}

export interface FlowNode {
  id: string
  type: 'domain' | 'mcp_tool'
  position: { x: number; y: number }
  data: {
    title: string
    tool_id?: number
    config?: any
  }
}

export interface FlowEdge {
  id: string
  source: string
  target: string
}

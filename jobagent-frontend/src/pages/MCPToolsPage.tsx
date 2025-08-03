import React, { useState, useEffect } from 'react'
import { mcpToolsAPI } from '../utils/api'
import { MCPTool } from '../types'
import { Plus, Edit, Play, Eye, MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const MCPToolsPage: React.FC = () => {
  const [tools, setTools] = useState<MCPTool[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null)
  const [testParameters, setTestParameters] = useState('')
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'my_tools' | 'published'>('my_tools')

  const [newTool, setNewTool] = useState({
    title: '',
    api_url: '',
    parameters: ''
  })

  useEffect(() => {
    loadTools()
  }, [filter])

  const loadTools = async () => {
    try {
      const params = filter === 'my_tools' ? { my_tools: true } : 
                   filter === 'published' ? { status: 'published' } : {}
      const response = await mcpToolsAPI.getTools(params)
      setTools(response.data)
    } catch (err) {
      console.error('Failed to load tools:', err)
    }
  }

  const handleCreateTool = async () => {
    if (!newTool.title || !newTool.api_url) {
      setError('Title and API URL are required')
      return
    }

    setLoading(true)
    setError('')

    try {
      let parameters = {}
      if (newTool.parameters.trim()) {
        parameters = JSON.parse(newTool.parameters)
      }

      await mcpToolsAPI.createTool({
        title: newTool.title,
        api_url: newTool.api_url,
        parameters
      })

      setNewTool({ title: '', api_url: '', parameters: '' })
      setShowCreateForm(false)
      loadTools()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create tool')
    } finally {
      setLoading(false)
    }
  }

  const handleTestTool = async (tool: MCPTool) => {
    if (!testParameters.trim()) {
      setError('Please provide test parameters')
      return
    }

    setLoading(true)
    setError('')
    setTestResult(null)

    try {
      const parameters = JSON.parse(testParameters)
      const response = await mcpToolsAPI.executeTool(tool.id, parameters)
      setTestResult(response.data)
      
      if (response.data.success) {
        await mcpToolsAPI.updateTool(tool.id, { sample_input: parameters })
        loadTools()
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to test tool')
    } finally {
      setLoading(false)
    }
  }

  const handleReleaseTool = async (tool: MCPTool) => {
    if (!tool.sample_input) {
      setError('Please test the tool successfully before releasing')
      return
    }

    setLoading(true)
    try {
      await mcpToolsAPI.updateTool(tool.id, { status: 'waiting_for_admin_review' })
      loadTools()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to release tool')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'waiting_for_admin_review':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'waiting_for_admin_review':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">MCP Tools</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Tool
          </button>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setFilter('my_tools')}
            className={`px-4 py-2 rounded-md ${filter === 'my_tools' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            My Tools
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-4 py-2 rounded-md ${filter === 'published' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Published Tools
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            All Tools
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <div key={tool.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg">{tool.title}</h3>
                <div className="flex items-center">
                  {getStatusIcon(tool.status)}
                  <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tool.status)}`}>
                    {tool.status}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{tool.api_url}</p>
              
              {tool.admin_comments && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
                  <div className="flex items-start">
                    <MessageSquare className="w-4 h-4 text-yellow-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Admin Comments:</p>
                      <p className="text-sm text-yellow-700">{tool.admin_comments}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedTool(tool)}
                  className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 flex items-center justify-center"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </button>
                <button
                  onClick={() => {
                    setSelectedTool(tool)
                    setTestParameters(JSON.stringify(tool.sample_input || {}, null, 2))
                  }}
                  className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm hover:bg-blue-200 flex items-center justify-center"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Test
                </button>
                {tool.status === 'draft' && tool.sample_input && (
                  <button
                    onClick={() => handleReleaseTool(tool)}
                    disabled={loading}
                    className="flex-1 bg-green-100 text-green-700 px-3 py-2 rounded text-sm hover:bg-green-200 disabled:opacity-50"
                  >
                    Release
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New MCP Tool</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTool.title}
                  onChange={(e) => setNewTool({ ...newTool, title: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API URL</label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTool.api_url}
                  onChange={(e) => setNewTool({ ...newTool, api_url: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parameters (JSON)</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder='{"param1": "type", "param2": "type"}'
                  value={newTool.parameters}
                  onChange={(e) => setNewTool({ ...newTool, parameters: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTool}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{selectedTool.title}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API URL</label>
                <p className="text-sm bg-gray-50 p-2 rounded">{selectedTool.api_url}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Parameters</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  value={testParameters}
                  onChange={(e) => setTestParameters(e.target.value)}
                />
              </div>
              
              {testResult && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Test Result</label>
                  <div className={`p-3 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <pre className="text-sm whitespace-pre-wrap">
                      {testResult.success ? 
                        JSON.stringify(testResult.response, null, 2) : 
                        testResult.error
                      }
                    </pre>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setSelectedTool(null)
                  setTestParameters('')
                  setTestResult(null)
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
              <button
                onClick={() => handleTestTool(selectedTool)}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Tool'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MCPToolsPage

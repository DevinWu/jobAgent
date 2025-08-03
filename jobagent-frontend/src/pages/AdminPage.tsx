import React, { useState, useEffect } from 'react'
import { mcpToolsAPI } from '../utils/api'
import { MCPTool } from '../types'
import { Play, MessageSquare, CheckCircle, XCircle } from 'lucide-react'

const AdminPage: React.FC = () => {
  const [pendingTools, setPendingTools] = useState<MCPTool[]>([])
  const [publishedTools, setPublishedTools] = useState<MCPTool[]>([])
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [comments, setComments] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'pending' | 'published'>('pending')

  useEffect(() => {
    loadTools()
  }, [])

  const loadTools = async () => {
    try {
      const [pendingResponse, publishedResponse] = await Promise.all([
        mcpToolsAPI.getTools({ status: 'waiting_for_admin_review' }),
        mcpToolsAPI.getTools({ status: 'published' })
      ])
      setPendingTools(pendingResponse.data)
      setPublishedTools(publishedResponse.data)
    } catch (err) {
      console.error('Failed to load tools:', err)
    }
  }

  const handleTestTool = async (tool: MCPTool) => {
    if (!tool.sample_input) {
      setError('No sample input available for this tool')
      return
    }

    setLoading(true)
    setError('')
    setTestResult(null)

    try {
      const response = await mcpToolsAPI.executeTool(tool.id, tool.sample_input)
      setTestResult(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to test tool')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (tool: MCPTool) => {
    setLoading(true)
    setError('')

    try {
      await mcpToolsAPI.adminUpdateTool(tool.id, {
        status: 'published',
        admin_comments: comments.trim() || undefined
      })
      setComments('')
      setSelectedTool(null)
      loadTools()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to approve tool')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (tool: MCPTool) => {
    if (!comments.trim()) {
      setError('Please provide comments when rejecting a tool')
      return
    }

    setLoading(true)
    setError('')

    try {
      await mcpToolsAPI.adminUpdateTool(tool.id, {
        status: 'draft',
        admin_comments: comments.trim()
      })
      setComments('')
      setSelectedTool(null)
      loadTools()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reject tool')
    } finally {
      setLoading(false)
    }
  }

  const currentTools = activeTab === 'pending' ? pendingTools : publishedTools

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel - MCP Tools</h1>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-md ${activeTab === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Pending Review ({pendingTools.length})
          </button>
          <button
            onClick={() => setActiveTab('published')}
            className={`px-4 py-2 rounded-md ${activeTab === 'published' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Published Tools ({publishedTools.length})
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tool Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  API URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentTools.map((tool) => (
                <tr key={tool.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{tool.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">User #{tool.creator_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 max-w-xs truncate">{tool.api_url}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(tool.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTool(tool)
                          setTestResult(null)
                          setComments('')
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Review
                      </button>
                      {activeTab === 'pending' && (
                        <button
                          onClick={() => handleTestTool(tool)}
                          disabled={loading}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {currentTools.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No {activeTab} tools found.
            </div>
          )}
        </div>
      </div>

      {selectedTool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Review Tool: {selectedTool.title}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tool Information</label>
                  <div className="bg-gray-50 p-3 rounded-md space-y-2">
                    <p><strong>Title:</strong> {selectedTool.title}</p>
                    <p><strong>API URL:</strong> {selectedTool.api_url}</p>
                    <p><strong>Creator ID:</strong> {selectedTool.creator_id}</p>
                    <p><strong>Created:</strong> {new Date(selectedTool.created_at).toLocaleString()}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parameters</label>
                  <pre className="bg-gray-50 p-3 rounded-md text-sm overflow-x-auto">
                    {JSON.stringify(selectedTool.parameters, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sample Input</label>
                  <pre className="bg-gray-50 p-3 rounded-md text-sm overflow-x-auto">
                    {JSON.stringify(selectedTool.sample_input, null, 2)}
                  </pre>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Test Tool</label>
                    <button
                      onClick={() => handleTestTool(selectedTool)}
                      disabled={loading}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Test
                    </button>
                  </div>
                  
                  {testResult && (
                    <div className={`p-3 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center mb-2">
                        {testResult.success ? 
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" /> :
                          <XCircle className="w-4 h-4 text-red-600 mr-2" />
                        }
                        <span className="font-medium">
                          {testResult.success ? 'Success' : 'Error'}
                        </span>
                      </div>
                      <pre className="text-sm whitespace-pre-wrap overflow-x-auto">
                        {testResult.success ? 
                          JSON.stringify(testResult.response, null, 2) : 
                          testResult.error
                        }
                      </pre>
                    </div>
                  )}
                </div>
                
                {activeTab === 'pending' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Comments</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="Add comments for the tool creator..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                    />
                  </div>
                )}
                
                {selectedTool.admin_comments && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Previous Comments</label>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <p className="text-sm">{selectedTool.admin_comments}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setSelectedTool(null)
                  setTestResult(null)
                  setComments('')
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
              
              {activeTab === 'pending' && (
                <>
                  <button
                    onClick={() => handleReject(selectedTool)}
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {loading ? 'Rejecting...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => handleApprove(selectedTool)}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {loading ? 'Approving...' : 'Approve'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPage

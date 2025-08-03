import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { domainsAPI, mcpToolsAPI } from '../utils/api'
import { MCPTool } from '../types'
import { Save, Send, Plus, Trash2 } from 'lucide-react'

interface FlowNode {
  id: string
  type: 'domain' | 'mcp_tool'
  title: string
  x: number
  y: number
  config?: any
  tool_id?: number
}

const CreateDomainPage: React.FC = () => {
  const [domainTitle, setDomainTitle] = useState('')
  const [domainDescription, setDomainDescription] = useState('')
  const [availableTools, setAvailableTools] = useState<MCPTool[]>([])
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>([
    { id: 'domain', type: 'domain', title: 'New Domain', x: 400, y: 100 }
  ])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [draggedTool, setDraggedTool] = useState<MCPTool | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadAvailableTools()
  }, [])

  const loadAvailableTools = async () => {
    try {
      const response = await mcpToolsAPI.getTools({ status: 'published' })
      setAvailableTools(response.data)
    } catch (err) {
      console.error('Failed to load tools:', err)
    }
  }

  const handleDragStart = (tool: MCPTool) => {
    setDraggedTool(tool)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedTool) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newNode: FlowNode = {
      id: `tool_${Date.now()}`,
      type: 'mcp_tool',
      title: draggedTool.title,
      x: x - 75,
      y: y - 25,
      tool_id: draggedTool.id,
      config: {}
    }

    setFlowNodes([...flowNodes, newNode])
    setDraggedTool(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId)
  }

  const handleNodeDelete = (nodeId: string) => {
    if (nodeId === 'domain') return
    setFlowNodes(flowNodes.filter(node => node.id !== nodeId))
    if (selectedNode === nodeId) {
      setSelectedNode(null)
    }
  }

  const updateNodeConfig = (nodeId: string, config: any) => {
    setFlowNodes(flowNodes.map(node => 
      node.id === nodeId ? { ...node, config } : node
    ))
  }

  const updateDomainNode = () => {
    setFlowNodes(flowNodes.map(node => 
      node.id === 'domain' ? { ...node, title: domainTitle || 'New Domain' } : node
    ))
  }

  useEffect(() => {
    updateDomainNode()
  }, [domainTitle])

  const validateFlow = () => {
    if (!domainTitle.trim()) {
      setError('Domain title is required')
      return false
    }
    if (!domainDescription.trim()) {
      setError('Domain description is required')
      return false
    }
    
    for (const node of flowNodes) {
      if (node.type === 'mcp_tool' && (!node.config || Object.keys(node.config).length === 0)) {
        setError(`Please configure the "${node.title}" tool`)
        return false
      }
    }
    
    return true
  }

  const handleSave = async (publish = false) => {
    if (!validateFlow()) return

    setLoading(true)
    setError('')

    try {
      const flowConfig = {
        nodes: flowNodes,
        connections: []
      }

      const domainData = {
        title: domainTitle,
        description: domainDescription,
        flow_config: flowConfig,
        status: publish ? 'published' : 'draft'
      }

      await domainsAPI.createDomain(domainData)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save domain')
    } finally {
      setLoading(false)
    }
  }

  const selectedNodeData = selectedNode ? flowNodes.find(n => n.id === selectedNode) : null
  const selectedTool = selectedNodeData?.tool_id ? 
    availableTools.find(t => t.id === selectedNodeData.tool_id) : null

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Domain</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domain Title
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter domain title (one word)"
              value={domainTitle}
              onChange={(e) => setDomainTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domain Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe how to diagnose failures in this domain"
              rows={3}
              value={domainDescription}
              onChange={(e) => setDomainDescription(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => handleSave(false)}
            disabled={loading}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <Send className="w-4 h-4 mr-2" />
            Publish
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Available Tools</h3>
          <div className="space-y-2">
            {availableTools.map((tool) => (
              <div
                key={tool.id}
                draggable
                onDragStart={() => handleDragStart(tool)}
                className="bg-blue-100 p-3 rounded-md cursor-move hover:bg-blue-200 transition-colors"
              >
                <div className="font-medium text-sm">{tool.title}</div>
              </div>
            ))}
            <div className="bg-gray-100 p-3 rounded-md cursor-pointer hover:bg-gray-200 transition-colors flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              <span className="text-sm">Create New Tool</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Flow Builder</h3>
          <div
            className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg h-96 overflow-hidden"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {flowNodes.map((node) => (
              <div
                key={node.id}
                className={`absolute bg-white border-2 rounded-lg p-3 cursor-pointer shadow-sm ${
                  selectedNode === node.id ? 'border-blue-500' : 'border-gray-300'
                } ${node.type === 'domain' ? 'bg-green-100' : 'bg-blue-100'}`}
                style={{ left: node.x, top: node.y, width: '150px' }}
                onClick={() => handleNodeClick(node.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="text-sm font-medium truncate">{node.title}</div>
                  {node.type !== 'domain' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNodeDelete(node.id)
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {node.type === 'domain' ? 'Domain' : 'MCP Tool'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Configuration</h3>
          {selectedNodeData ? (
            <div>
              <div className="mb-4">
                <h4 className="font-medium text-sm mb-2">{selectedNodeData.title}</h4>
                <p className="text-xs text-gray-500">
                  {selectedNodeData.type === 'domain' ? 'Domain Configuration' : 'Tool Configuration'}
                </p>
              </div>
              
              {selectedNodeData.type === 'domain' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      value={domainTitle}
                      onChange={(e) => setDomainTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      rows={3}
                      value={domainDescription}
                      onChange={(e) => setDomainDescription(e.target.value)}
                    />
                  </div>
                </div>
              ) : selectedTool ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Parameters</label>
                    <textarea
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      rows={4}
                      placeholder="Configure tool parameters (JSON)"
                      value={JSON.stringify(selectedNodeData.config || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          const config = JSON.parse(e.target.value)
                          updateNodeConfig(selectedNodeData.id, config)
                        } catch (err) {
                        }
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    API URL: {selectedTool.api_url}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Select a node to configure</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreateDomainPage

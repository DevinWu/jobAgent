import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FlowNode, FlowEdge } from '@/types'

export const useWorkflowStore = defineStore('workflow', () => {
  const nodes = ref<FlowNode[]>([
    {
      id: 'domain',
      type: 'domain',
      position: { x: 400, y: 100 },
      data: {
        title: 'New Domain'
      }
    }
  ])
  
  const edges = ref<FlowEdge[]>([])
  const selectedNodeId = ref<string | null>(null)

  const selectedNode = computed(() => {
    if (!selectedNodeId.value) return null
    return nodes.value.find(node => node.id === selectedNodeId.value) || null
  })

  const addNode = (node: FlowNode) => {
    nodes.value.push(node)
  }

  const removeNode = (nodeId: string) => {
    if (nodeId === 'domain') return
    nodes.value = nodes.value.filter(node => node.id !== nodeId)
    if (selectedNodeId.value === nodeId) {
      selectedNodeId.value = null
    }
  }

  const updateNode = (nodeId: string, updates: Partial<FlowNode>) => {
    const nodeIndex = nodes.value.findIndex(node => node.id === nodeId)
    if (nodeIndex !== -1) {
      nodes.value[nodeIndex] = { ...nodes.value[nodeIndex], ...updates }
    }
  }

  const updateNodeData = (nodeId: string, data: any) => {
    const nodeIndex = nodes.value.findIndex(node => node.id === nodeId)
    if (nodeIndex !== -1) {
      nodes.value[nodeIndex].data = { ...nodes.value[nodeIndex].data, ...data }
    }
  }

  const selectNode = (nodeId: string | null) => {
    selectedNodeId.value = nodeId
  }

  const updateDomainTitle = (title: string) => {
    updateNodeData('domain', { title: title || 'New Domain' })
  }

  const validateFlow = (domainTitle: string, domainDescription: string) => {
    if (!domainTitle.trim()) {
      return 'Domain title is required'
    }
    if (!domainDescription.trim()) {
      return 'Domain description is required'
    }
    
    for (const node of nodes.value) {
      if (node.type === 'mcp_tool' && (!node.data.config || Object.keys(node.data.config).length === 0)) {
        return `Please configure the "${node.data.title}" tool`
      }
    }
    
    return null
  }

  const getFlowConfig = () => {
    return {
      nodes: nodes.value,
      connections: edges.value
    }
  }

  const reset = () => {
    nodes.value = [
      {
        id: 'domain',
        type: 'domain',
        position: { x: 400, y: 100 },
        data: {
          title: 'New Domain'
        }
      }
    ]
    edges.value = []
    selectedNodeId.value = null
  }

  return {
    nodes,
    edges,
    selectedNodeId,
    selectedNode,
    addNode,
    removeNode,
    updateNode,
    updateNodeData,
    selectNode,
    updateDomainTitle,
    validateFlow,
    getFlowConfig,
    reset
  }
})

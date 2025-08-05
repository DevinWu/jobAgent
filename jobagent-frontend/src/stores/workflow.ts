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

  const loadFlowConfig = (flowConfig: any) => {
    console.log('Loading flow config:', flowConfig)

    if (!flowConfig || !flowConfig.nodes) {
      console.warn('Invalid flow config, resetting workflow')
      reset()
      return
    }

    try {
      // 清空现有节点和边
      nodes.value = []
      edges.value = []

      // 创建一个新的域节点（如果不存在）
      let hasDomainNode = false

      // 加载节点
      flowConfig.nodes.forEach((node: any) => {
        try {
          // 检查是否是域节点
          if (node.type === 'domain') {
            hasDomainNode = true
          }

          // 确保节点至少有必要的属性
          const safeNode: FlowNode = {
            id: node.id,
            type: node.type || 'unknown',
            position: node.position || { x: 0, y: 0 },
            data: {
              title: node.data?.title || 'Untitled',
              tool_id: node.data?.tool_id,
              config: node.data?.config || {}
            }
          }

          // 添加节点
          nodes.value.push(safeNode)
          console.log('Loaded node:', safeNode)
        } catch (nodeError) {
          console.error('Error loading node:', nodeError, node)
        }
      })

      // 如果没有域节点，创建一个
      if (!hasDomainNode) {
        const domainNode: FlowNode = {
          id: 'domain',
          type: 'domain',
          position: { x: 400, y: 100 },
          data: { title: 'Domain' }
        }
        nodes.value.push(domainNode)
        console.log('Created default domain node:', domainNode)
      }

      // 加载连接 - 支持connections或edges属性名
      const connectionsList = flowConfig.connections || flowConfig.edges || []
      connectionsList.forEach((edge: any) => {
        try {
          // 确保边至少有必要的属性
          if (edge.source && edge.target) {
            const safeEdge: FlowEdge = {
              id: edge.id || `e-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              source: edge.source,
              target: edge.target
            }

            // 添加边
            edges.value.push(safeEdge)
            console.log('Loaded edge:', safeEdge)
          } else {
            console.warn('Skipping edge with missing source or target:', edge)
          }
        } catch (edgeError) {
          console.error('Error loading edge:', edgeError, edge)
        }
      })

      console.log('Flow config loaded successfully:', { nodes: nodes.value, edges: edges.value })
    } catch (error) {
      console.error('Error while loading flow config:', error)
      reset()
    }

    // 重置选中状态
    selectedNodeId.value = null
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
    loadFlowConfig,
    reset
  }
})

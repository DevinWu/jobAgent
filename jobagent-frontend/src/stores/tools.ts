import { defineStore } from 'pinia'
import { ref } from 'vue'
import { mcpToolsAPI } from '@/utils/api'
import type { MCPTool } from '@/types'

export const useToolsStore = defineStore('tools', () => {
  const availableTools = ref<MCPTool[]>([])
  const loading = ref(false)
  const error = ref('')

  const loadAvailableTools = async () => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await mcpToolsAPI.getTools({ status: 'published' })
      availableTools.value = response.data
    } catch (err) {
      error.value = 'Failed to load tools'
      console.error('Failed to load tools:', err)
    } finally {
      loading.value = false
    }
  }

  const getToolById = (id: number) => {
    return availableTools.value.find(tool => tool.id === id)
  }

  const deleteTool = async (id: number) => {
    loading.value = true
    error.value = ''
    
    try {
      await mcpToolsAPI.deleteTool(id)
      // 从可用工具列表中移除已删除的工具
      availableTools.value = availableTools.value.filter(tool => tool.id !== id)
      return true
    } catch (err) {
      error.value = 'Failed to delete tool'
      console.error('Failed to delete tool:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    availableTools,
    loading,
    error,
    loadAvailableTools,
    getToolById,
    deleteTool
  }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDomainStore = defineStore('domain', () => {
  const title = ref('')
  const description = ref('')
  const loading = ref(false)
  const error = ref('')

  const setTitle = (newTitle: string) => {
    title.value = newTitle
  }

  const setDescription = (newDescription: string) => {
    description.value = newDescription
  }

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading
  }

  const setError = (errorMessage: string) => {
    error.value = errorMessage
  }

  const clearError = () => {
    error.value = ''
  }

  const reset = () => {
    title.value = ''
    description.value = ''
    loading.value = false
    error.value = ''
  }

  return {
    title,
    description,
    loading,
    error,
    setTitle,
    setDescription,
    setLoading,
    setError,
    clearError,
    reset
  }
})

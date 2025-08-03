import React, { useState, useEffect } from 'react'
import { domainsAPI, jobAnalysisAPI } from '../utils/api'
import { Domain, JobAnalysis } from '../types'
import { Search, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react'

const MainPage: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([])
  const [selectedDomain, setSelectedDomain] = useState<number | null>(null)
  const [jobId, setJobId] = useState('')
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDomains()
  }, [])

  const loadDomains = async () => {
    try {
      const response = await domainsAPI.getDomains(true)
      setDomains(response.data)
    } catch (err) {
      console.error('Failed to load domains:', err)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedDomain || !jobId.trim()) {
      setError('Please select a domain and enter a job ID')
      return
    }

    setLoading(true)
    setError('')
    setAnalysis(null)

    try {
      const response = await jobAnalysisAPI.analyzeJob(jobId.trim(), selectedDomain)
      setAnalysis(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to analyze job')
    } finally {
      setLoading(false)
    }
  }

  const getFailureCategoryIcon = (category: string) => {
    switch (category) {
      case 'unknown':
        return <AlertCircle className="w-5 h-5 text-gray-500" />
      case 'userInputError':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'ThirdPlatformError':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'PlatformError':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getFailureCategoryColor = (category: string) => {
    switch (category) {
      case 'unknown':
        return 'bg-gray-100 text-gray-800'
      case 'userInputError':
        return 'bg-red-100 text-red-800'
      case 'ThirdPlatformError':
        return 'bg-yellow-100 text-yellow-800'
      case 'PlatformError':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Job Failure Analysis</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Domain
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedDomain || ''}
              onChange={(e) => setSelectedDomain(Number(e.target.value) || null)}
            >
              <option value="">Choose a domain...</option>
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.title}
                </option>
              ))}
            </select>
            {domains.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                No published domains available. 
                <a href="/create-domain" className="text-blue-600 hover:underline ml-1">
                  Create one?
                </a>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job ID
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter job ID to analyze"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <XCircle className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading || !selectedDomain || !jobId.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Analyzing...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Analyze Job
            </>
          )}
        </button>
      </div>

      {analysis && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Analysis Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Job ID</h3>
              <p className="text-lg font-mono bg-gray-50 p-2 rounded">{analysis.job_id}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Failure Category</h3>
              <div className="flex items-center">
                {getFailureCategoryIcon(analysis.failure_category)}
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getFailureCategoryColor(analysis.failure_category)}`}>
                  {analysis.failure_category}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Root Cause Analysis</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-gray-900">{analysis.root_cause}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Suggestions</h3>
            <div className="bg-blue-50 p-4 rounded-md">
              <pre className="text-blue-900 whitespace-pre-wrap">{analysis.suggestions}</pre>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            Analysis completed at: {new Date(analysis.created_at).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  )
}

export default MainPage

import { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import StatsCards from './components/StatsCards'
import Charts from './components/Charts'
import RequestLog from './components/RequestLog'
import SystemDiagram from './components/SystemDiagram'
import ApiPlayground from './components/ApiPlayground'
import ApiSpec from './components/ApiSpec'
import type { Stats, RequestLog as RequestLogType } from './types'

type Tab = 'dashboard' | 'diagram' | 'playground' | 'spec'

const API = ''

async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${API}/v1/stats`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

async function fetchRequests(): Promise<RequestLogType[]> {
  const res = await fetch(`${API}/v1/requests?limit=50`)
  if (!res.ok) throw new Error('Failed to fetch requests')
  return res.json()
}

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [stats, setStats] = useState<Stats | null>(null)
  const [requests, setRequests] = useState<RequestLogType[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [backendError, setBackendError] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([fetchStats(), fetchRequests()])
      setStats(s)
      setRequests(r)
      setBackendError(false)
    } catch {
      setBackendError(true)
    }
  }, [])

  const refreshRequests = useCallback(async () => {
    setLoadingRequests(true)
    try {
      const [s, r] = await Promise.all([fetchStats(), fetchRequests()])
      setStats(s)
      setRequests(r)
    } finally {
      setLoadingRequests(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadData()
  }, [loadData])

  // Poll every 5s when on dashboard
  useEffect(() => {
    if (tab !== 'dashboard') return
    const id = setInterval(loadData, 5000)
    return () => clearInterval(id)
  }, [tab, loadData])

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header activeTab={tab} onTabChange={setTab} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
        {backendError && (
          <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-800/40 rounded-lg text-yellow-400 text-sm flex items-center gap-2">
            <span>⚠</span>
            <span>
              Backend not reachable — start it with{' '}
              <code className="font-mono text-yellow-300">uvicorn app.main:app --reload</code> in{' '}
              <code className="font-mono text-yellow-300">backend/</code>
            </span>
          </div>
        )}

        {tab === 'dashboard' && (
          <div className="space-y-6">
            <StatsCards stats={stats} />
            <Charts stats={stats} />
            <RequestLog
              requests={requests}
              loading={loadingRequests}
              onRefresh={refreshRequests}
            />
          </div>
        )}

        {tab === 'diagram' && (
          <div style={{ height: 'calc(100vh - 180px)' }}>
            <SystemDiagram />
          </div>
        )}

        {tab === 'playground' && (
          <ApiPlayground onRequestSent={loadData} />
        )}

        {tab === 'spec' && <ApiSpec />}
      </main>
    </div>
  )
}

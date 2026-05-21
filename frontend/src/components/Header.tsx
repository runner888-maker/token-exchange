import { useEffect, useState } from 'react'
import { ShoppingCart, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import clsx from 'clsx'

export type Tab = 'home' | 'submit' | 'portal' | 'dashboard' | 'playground' | 'spec'

interface HeaderProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

interface ProviderStatus {
  status: 'ok' | 'quota_exceeded' | 'error' | 'checking'
  error: string | null
}

const primaryTabs: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'submit', label: 'Submit Job' },
  { id: 'portal', label: 'My Jobs' },
]

const devTabs: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Ops Dashboard' },
  { id: 'playground', label: 'API Playground' },
  { id: 'spec', label: 'API Spec' },
]

function StatusDot({ status }: { status: ProviderStatus['status'] }) {
  if (status === 'checking') return <span className="w-2 h-2 rounded-full bg-gray-500 animate-pulse inline-block" />
  if (status === 'ok') return <CheckCircle size={12} className="text-accent-green" />
  if (status === 'quota_exceeded') return <AlertTriangle size={12} className="text-accent-yellow" />
  return <XCircle size={12} className="text-accent-red" />
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const [statuses, setStatuses] = useState<{ xai: ProviderStatus; gemini: ProviderStatus }>({
    xai: { status: 'checking', error: null },
    gemini: { status: 'checking', error: null },
  })

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL ?? ''
    fetch(`${base}/v2/providers/status`)
      .then(r => r.json())
      .then(data => setStatuses(data))
      .catch(() => {
        setStatuses({
          xai: { status: 'error', error: 'Backend unreachable' },
          gemini: { status: 'error', error: 'Backend unreachable' },
        })
      })
  }, [])

  return (
    <header className="border-b border-surface-2 bg-surface-1">
      <div className="max-w-7xl mx-auto px-6">
        {/* Brand row */}
        <div className="flex items-center gap-3 py-4 border-b border-surface-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand">
            <ShoppingCart size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-base leading-tight">Tokenmaxx</h1>
            <p className="text-gray-500 text-xs">The Costco of AI Tokens · v2</p>
          </div>

          {/* Provider status pills */}
          <div className="ml-6 hidden sm:flex items-center gap-3">
            {([
              { key: 'xai', label: 'xAI Grok' },
              { key: 'gemini', label: 'Google Gemini' },
            ] as const).map(({ key, label }) => {
              const s = statuses[key]
              return (
                <div
                  key={key}
                  title={s.error ?? undefined}
                  className={clsx(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border',
                    s.status === 'ok' && 'bg-emerald-900/20 border-emerald-800/30 text-accent-green',
                    s.status === 'quota_exceeded' && 'bg-yellow-900/20 border-yellow-800/30 text-accent-yellow',
                    s.status === 'error' && 'bg-red-900/20 border-red-800/30 text-accent-red',
                    s.status === 'checking' && 'bg-surface-2 border-surface-3 text-gray-500',
                  )}
                >
                  <StatusDot status={s.status} />
                  <span>{label}</span>
                  {s.status === 'quota_exceeded' && <span className="opacity-60">quota</span>}
                </div>
              )
            })}
          </div>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
              <span className="text-accent-green font-semibold">~12%</span> avg savings vs retail
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {primaryTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                'px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'border-brand text-brand-light'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              )}
            >
              {tab.label}
            </button>
          ))}

          <div className="mx-2 h-4 w-px bg-surface-3" />

          {devTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                'px-3 py-3 text-xs font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'border-brand text-brand-light'
                  : 'border-transparent text-gray-500 hover:text-gray-400'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}

import { Zap } from 'lucide-react'
import clsx from 'clsx'

type Tab = 'dashboard' | 'diagram' | 'playground' | 'spec'

interface HeaderProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'diagram', label: 'System Diagram' },
  { id: 'playground', label: 'API Playground' },
  { id: 'spec', label: 'API Spec' },
]

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="border-b border-surface-2 bg-surface-1">
      <div className="max-w-7xl mx-auto px-6">
        {/* Brand row */}
        <div className="flex items-center gap-3 py-4 border-b border-surface-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-base leading-tight">
              Token Exchange
            </h1>
            <p className="text-gray-500 text-xs">AI Compute Routing Layer · POC</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
            <span className="text-xs text-gray-400">Mock Mode Active</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex gap-1">
          {tabs.map((tab) => (
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
        </nav>
      </div>
    </header>
  )
}

import { RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import type { RequestLog } from '../types'

interface Props {
  requests: RequestLog[]
  loading: boolean
  onRefresh: () => void
}

const PRIORITY_BADGE: Record<string, string> = {
  cost: 'bg-emerald-900/50 text-emerald-400 border border-emerald-800',
  latency: 'bg-blue-900/50 text-blue-400 border border-blue-800',
  quality: 'bg-yellow-900/50 text-yellow-400 border border-yellow-800',
}

const PROVIDER_DOT: Record<string, string> = {
  anthropic: 'bg-brand',
  openai: 'bg-accent-green',
}

export default function RequestLogTable({ requests, loading, onRefresh }: Props) {
  return (
    <div className="bg-surface-1 border border-surface-2 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-2">
        <h2 className="text-sm font-semibold text-gray-200">Recent Requests</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-2">
              {['#', 'Provider', 'Model', 'Priority', 'Tokens', 'Cost (USD)', 'Credits', 'Latency', 'Savings', 'Time'].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 && !loading && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-gray-500 text-sm">
                  No requests yet. Use the API Playground to send your first request.
                </td>
              </tr>
            )}
            {requests.map((r) => (
              <tr
                key={r.id}
                className="border-b border-surface-2/50 hover:bg-surface-2/30 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-gray-500 text-xs">{r.id}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={clsx(
                        'w-2 h-2 rounded-full flex-shrink-0',
                        PROVIDER_DOT[r.provider] || 'bg-gray-500'
                      )}
                    />
                    <span className="text-gray-200 capitalize">{r.provider}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-gray-400">{r.model}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      'px-2 py-0.5 rounded text-xs font-medium',
                      PRIORITY_BADGE[r.priority] || 'bg-surface-3 text-gray-400'
                    )}
                  >
                    {r.priority}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-300">
                  {r.total_tokens.toLocaleString()}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-300">
                  ${r.cost_usd.toFixed(6)}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-blue-400">
                  {r.credits.toFixed(2)}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-300">
                  {r.latency_ms.toFixed(0)}ms
                </td>
                <td
                  className={clsx(
                    'px-4 py-3 font-mono text-xs',
                    r.savings_usd >= 0 ? 'text-accent-green' : 'text-accent-red'
                  )}
                >
                  {r.savings_usd >= 0 ? '+' : ''}${r.savings_usd.toFixed(6)}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {new Date(r.created_at).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { Activity, CreditCard, DollarSign, TrendingDown, Zap, BarChart2 } from 'lucide-react'
import type { Stats } from '../types'

interface Props {
  stats: Stats | null
}

function Card({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  color: string
}) {
  return (
    <div className="bg-surface-1 border border-surface-2 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      </div>
      <div>
        <p className="text-2xl font-bold text-white font-mono">{value}</p>
        {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export default function StatsCards({ stats }: Props) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface-1 border border-surface-2 rounded-xl p-5 h-28 animate-pulse" />
        ))}
      </div>
    )
  }

  const totalCostFormatted =
    stats.total_cost_usd < 0.001
      ? `$${(stats.total_cost_usd * 1000).toFixed(3)}m`
      : `$${stats.total_cost_usd.toFixed(4)}`

  const savingsFormatted =
    stats.total_savings_usd < 0.001
      ? `$${(stats.total_savings_usd * 1000).toFixed(3)}m`
      : `$${stats.total_savings_usd.toFixed(4)}`

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <Card
        icon={<Activity size={14} className="text-brand-light" />}
        label="Total Requests"
        value={stats.total_requests.toLocaleString()}
        sub="across all providers"
        color="bg-brand-dim"
      />
      <Card
        icon={<DollarSign size={14} className="text-accent-green" />}
        label="Total Spend"
        value={totalCostFormatted}
        sub="actual cost USD"
        color="bg-emerald-900/40"
      />
      <Card
        icon={<TrendingDown size={14} className="text-accent-green" />}
        label="Total Savings"
        value={savingsFormatted}
        sub={`vs all-Sonnet baseline`}
        color="bg-emerald-900/40"
      />
      <Card
        icon={<Zap size={14} className="text-yellow-400" />}
        label="Savings %"
        value={`${stats.savings_percentage.toFixed(1)}%`}
        sub="vs baseline provider"
        color="bg-yellow-900/30"
      />
      <Card
        icon={<CreditCard size={14} className="text-blue-400" />}
        label="Credits Used"
        value={stats.total_credits.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        sub={`1 credit = $${(1 / stats.credits_per_dollar).toFixed(4)}`}
        color="bg-blue-900/30"
      />
      <Card
        icon={<BarChart2 size={14} className="text-purple-400" />}
        label="Avg Latency"
        value={`${stats.avg_latency_ms.toFixed(0)}ms`}
        sub="rolling average"
        color="bg-purple-900/30"
      />
    </div>
  )
}

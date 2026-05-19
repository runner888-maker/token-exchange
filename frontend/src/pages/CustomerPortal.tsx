import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, TrendingDown, Briefcase, DollarSign, Zap } from 'lucide-react'
import clsx from 'clsx'

interface Job {
  job_id: number
  provider: string
  model: string
  priority: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  customer_charge_usd: number
  retail_cost_usd: number
  savings_usd: number
  latency_ms: number
  created_at: string
}

interface Summary {
  total_jobs: number
  total_spent_usd: number
  total_retail_usd: number
  total_saved_usd: number
  avg_savings_pct: number
}

export default function CustomerPortal() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(false)
  const [providerFilter, setProviderFilter] = useState<string>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const base = import.meta.env.VITE_API_URL ?? ''
      const [jobsRes, sumRes] = await Promise.all([
        fetch(`${base}/v2/jobs?limit=100`),
        fetch(`${base}/v2/summary`),
      ])
      if (jobsRes.ok) setJobs(await jobsRes.json())
      if (sumRes.ok) setSummary(await sumRes.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const fmtUsd = (v: number) => (v < 0.001 ? `$${v.toFixed(6)}` : `$${v.toFixed(4)}`)
  const fmtDate = (s: string) => new Date(s).toLocaleString()

  const providers = ['all', ...Array.from(new Set(jobs.map(j => j.provider)))]
  const filtered = providerFilter === 'all' ? jobs : jobs.filter(j => j.provider === providerFilter)

  const statCards = summary
    ? [
        {
          label: 'Total Jobs',
          value: summary.total_jobs.toLocaleString(),
          icon: <Briefcase size={16} />,
          color: 'text-accent-blue',
          bg: 'bg-blue-900/20',
        },
        {
          label: 'Total Spent',
          value: `$${summary.total_spent_usd.toFixed(4)}`,
          icon: <DollarSign size={16} />,
          color: 'text-white',
          bg: 'bg-surface-2',
        },
        {
          label: 'vs Retail You Saved',
          value: `$${summary.total_saved_usd.toFixed(4)}`,
          icon: <TrendingDown size={16} />,
          color: 'text-accent-green',
          bg: 'bg-emerald-900/20',
        },
        {
          label: 'Avg Savings Rate',
          value: `${summary.avg_savings_pct.toFixed(1)}%`,
          icon: <Zap size={16} />,
          color: 'text-brand-light',
          bg: 'bg-brand-dim/30',
        },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Job Portal</h1>
          <p className="text-gray-500 text-sm mt-1">Your job history and cumulative savings vs retail pricing.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-surface-2 hover:bg-surface-3 text-gray-300 text-sm rounded-lg border border-surface-3 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon, color, bg }) => (
          <div key={label} className={clsx('rounded-xl p-4 border border-surface-2', bg)}>
            <div className={clsx('flex items-center gap-2 mb-2', color)}>
              {icon}
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</span>
            </div>
            <div className={clsx('text-2xl font-bold font-mono', color)}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Filter:</span>
        {providers.map(p => (
          <button
            key={p}
            onClick={() => setProviderFilter(p)}
            className={clsx(
              'px-3 py-1 rounded-full text-xs font-medium transition-all capitalize',
              providerFilter === p
                ? 'bg-brand text-white'
                : 'bg-surface-2 text-gray-400 hover:text-gray-300'
            )}
          >
            {p}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-600">{filtered.length} jobs</span>
      </div>

      {/* Jobs table */}
      {filtered.length === 0 ? (
        <div className="bg-surface-1 border border-surface-2 rounded-xl p-12 text-center">
          <Briefcase size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No jobs yet — submit your first job to see results here.</p>
        </div>
      ) : (
        <div className="bg-surface-1 border border-surface-2 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-2 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left py-3 px-4">#</th>
                  <th className="text-left py-3 px-4">Model</th>
                  <th className="text-left py-3 px-4">Priority</th>
                  <th className="text-right py-3 px-4">Tokens</th>
                  <th className="text-right py-3 px-4">Retail</th>
                  <th className="text-right py-3 px-4 text-accent-green">You Paid</th>
                  <th className="text-right py-3 px-4 text-accent-green">Saved</th>
                  <th className="text-right py-3 px-4">Latency</th>
                  <th className="text-right py-3 px-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((job) => (
                  <tr key={job.job_id} className="border-b border-surface-2/50 hover:bg-surface-2/30 transition-colors">
                    <td className="py-2.5 px-4 text-gray-600 font-mono text-xs">#{job.job_id}</td>
                    <td className="py-2.5 px-4">
                      <div className="text-white text-xs font-medium">{job.model}</div>
                      <div className="text-gray-600 text-xs">{job.provider === 'xai' ? 'xAI' : 'Google'}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={clsx(
                        'text-xs px-2 py-0.5 rounded-full',
                        job.priority === 'cost' && 'bg-emerald-900/40 text-accent-green',
                        job.priority === 'latency' && 'bg-blue-900/40 text-accent-blue',
                        job.priority === 'quality' && 'bg-brand-dim/50 text-brand-light',
                      )}>
                        {job.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-400 font-mono text-xs">
                      {(job.total_tokens || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-500 font-mono text-xs line-through">
                      {job.retail_cost_usd != null ? fmtUsd(job.retail_cost_usd) : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right text-accent-green font-mono text-xs font-semibold">
                      {fmtUsd(job.customer_charge_usd)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-accent-green font-mono text-xs">
                      {job.savings_usd != null ? fmtUsd(job.savings_usd) : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-500 font-mono text-xs">
                      {job.latency_ms ? `${job.latency_ms.toFixed(0)}ms` : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-600 text-xs">
                      {job.created_at ? fmtDate(job.created_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import type { Stats } from '../types'

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: '#7c3aed',
  openai: '#10b981',
}

const PRIORITY_COLORS: Record<string, string> = {
  cost: '#10b981',
  latency: '#3b82f6',
  quality: '#f59e0b',
}

interface Props {
  stats: Stats | null
}

export default function Charts({ stats }: Props) {
  if (!stats || stats.total_requests === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="bg-surface-1 border border-surface-2 rounded-xl p-6 h-64 flex items-center justify-center"
          >
            <p className="text-gray-500 text-sm">No data yet — send some requests</p>
          </div>
        ))}
      </div>
    )
  }

  const providerData = stats.provider_distribution.map((p) => ({
    name: p.provider.charAt(0).toUpperCase() + p.provider.slice(1),
    value: p.count,
    cost: p.total_cost_usd,
    latency: p.avg_latency_ms,
  }))

  const priorityData = stats.priority_distribution.map((p) => ({
    name: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
    count: p.count,
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Provider distribution pie */}
      <div className="bg-surface-1 border border-surface-2 rounded-xl p-6">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Provider Distribution</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={providerData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {providerData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={PROVIDER_COLORS[entry.name.toLowerCase()] || '#6b7280'}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#1e2535', border: '1px solid #252d3d', borderRadius: 8 }}
              labelStyle={{ color: '#fff' }}
              itemStyle={{ color: '#a78bfa' }}
              formatter={(v: number, _name: string, props) => [
                `${v} requests (${((v / stats.total_requests) * 100).toFixed(1)}%)`,
                props.payload.name,
              ]}
            />
            <Legend
              formatter={(value) => (
                <span style={{ color: '#9ca3af', fontSize: 12 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Priority distribution bar */}
      <div className="bg-surface-1 border border-surface-2 rounded-xl p-6">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Routing Priority Usage</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={priorityData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#252d3d" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ background: '#1e2535', border: '1px solid #252d3d', borderRadius: 8 }}
              labelStyle={{ color: '#fff' }}
              cursor={{ fill: 'rgba(124,58,237,0.1)' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {priorityData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={PRIORITY_COLORS[entry.name.toLowerCase()] || '#7c3aed'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

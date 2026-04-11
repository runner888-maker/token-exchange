import { useState } from 'react'
import { Play, Zap, Clock, Star, DollarSign, CreditCard } from 'lucide-react'
import clsx from 'clsx'
import type { CompletionResponse } from '../types'

type Priority = 'cost' | 'latency' | 'quality'

const PRIORITIES: { value: Priority; label: string; desc: string; color: string; icon: React.ReactNode }[] = [
  {
    value: 'cost',
    label: 'Cost',
    desc: 'Cheapest model (gpt-4o-mini)',
    color: 'border-emerald-600 bg-emerald-900/30 text-emerald-400',
    icon: <DollarSign size={14} />,
  },
  {
    value: 'latency',
    label: 'Latency',
    desc: 'Fastest response time',
    color: 'border-blue-600 bg-blue-900/30 text-blue-400',
    icon: <Clock size={14} />,
  },
  {
    value: 'quality',
    label: 'Quality',
    desc: 'Highest quality (claude-3-opus)',
    color: 'border-yellow-600 bg-yellow-900/30 text-yellow-400',
    icon: <Star size={14} />,
  },
]

const EXAMPLE_PROMPTS = [
  'Explain quantum computing in two sentences.',
  'Write a haiku about distributed systems.',
  'What is the difference between REST and GraphQL?',
  'Summarize the CAP theorem for a non-technical audience.',
]

export default function ApiPlayground({ onRequestSent }: { onRequestSent: () => void }) {
  const [prompt, setPrompt] = useState(EXAMPLE_PROMPTS[0])
  const [priority, setPriority] = useState<Priority>('cost')
  const [maxTokens, setMaxTokens] = useState(256)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CompletionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState<number | null>(null)

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    setResult(null)
    const t0 = performance.now()

    try {
      const res = await fetch('/v1/completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, priority, max_tokens: maxTokens }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || `HTTP ${res.status}`)
      }

      const data: CompletionResponse = await res.json()
      setResult(data)
      setElapsedMs(Math.round(performance.now() - t0))
      onRequestSent()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Input */}
      <div className="space-y-5">
        <div className="bg-surface-1 border border-surface-2 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">
            Request Builder
          </h2>

          {/* Priority selector */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">
              Routing Priority
            </label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={clsx(
                    'flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition-all',
                    priority === p.value
                      ? p.color
                      : 'border-surface-3 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                  )}
                >
                  {p.icon}
                  <span>{p.label}</span>
                  <span className="text-xs opacity-60 font-normal text-center leading-tight hidden sm:block">
                    {p.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Example prompts */}
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">
              Example Prompts
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPrompt(p)}
                  className={clsx(
                    'text-xs px-2 py-1 rounded border transition-colors',
                    prompt === p
                      ? 'border-brand/60 bg-brand-dim text-brand-light'
                      : 'border-surface-3 text-gray-500 hover:border-gray-600 hover:text-gray-400'
                  )}
                >
                  {p.length > 40 ? p.slice(0, 38) + '…' : p}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt textarea */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full bg-surface text-sm text-gray-200 border border-surface-3 rounded-lg p-3 resize-none focus:outline-none focus:border-brand/60 font-mono"
              placeholder="Enter your prompt…"
            />
          </div>

          {/* Max tokens */}
          <div className="mb-5">
            <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">
              Max Tokens: <span className="text-gray-300 font-mono">{maxTokens}</span>
            </label>
            <input
              type="range"
              min={64}
              max={2048}
              step={64}
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              className="w-full accent-brand"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !prompt.trim()}
            className={clsx(
              'w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-all',
              loading || !prompt.trim()
                ? 'bg-surface-3 text-gray-500 cursor-not-allowed'
                : 'bg-brand hover:bg-brand/90 text-white'
            )}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Routing…
              </>
            ) : (
              <>
                <Play size={14} />
                Send Request
              </>
            )}
          </button>
        </div>

        {/* Raw curl equivalent */}
        <div className="bg-surface-1 border border-surface-2 rounded-xl p-5">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">
            Equivalent cURL
          </p>
          <pre className="text-xs font-mono text-gray-400 leading-relaxed whitespace-pre-wrap break-all">
{`curl -X POST http://localhost:8000/v1/completion \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ prompt: prompt.slice(0, 50) + (prompt.length > 50 ? '…' : ''), priority, max_tokens: maxTokens }, null, 2)}'`}
          </pre>
        </div>
      </div>

      {/* Right: Response */}
      <div className="bg-surface-1 border border-surface-2 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-200">Response</h2>
          {result && elapsedMs !== null && (
            <span className="text-xs text-gray-500 font-mono">{elapsedMs}ms round-trip</span>
          )}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {!result && !error && !loading && (
          <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
            Send a request to see the response and routing decision
          </div>
        )}

        {loading && (
          <div className="h-48 flex flex-col items-center justify-center gap-3 text-gray-500 text-sm">
            <div className="w-6 h-6 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
            Routing to optimal provider…
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Routing decision */}
            <div className="flex items-center gap-2 p-3 bg-surface rounded-lg border border-surface-3">
              <Zap size={14} className="text-brand-light flex-shrink-0" />
              <span className="text-xs text-gray-400">Routed to</span>
              <span className="text-xs font-mono text-brand-light capitalize font-semibold">
                {result.provider}
              </span>
              <span className="text-gray-600">·</span>
              <span className="text-xs font-mono text-gray-300">{result.model}</span>
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: <DollarSign size={12} />, label: 'Cost', value: `$${result.cost_usd.toFixed(7)}`, color: 'text-emerald-400' },
                { icon: <CreditCard size={12} />, label: 'Credits', value: result.credits.toFixed(3), color: 'text-blue-400' },
                { icon: <Clock size={12} />, label: 'Latency', value: `${result.latency_ms}ms`, color: 'text-purple-400' },
              ].map((m) => (
                <div key={m.label} className="bg-surface rounded-lg p-3 border border-surface-3">
                  <div className={clsx('flex items-center gap-1 mb-1', m.color)}>
                    {m.icon}
                    <span className="text-xs">{m.label}</span>
                  </div>
                  <p className={clsx('text-sm font-mono font-semibold', m.color)}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* Savings */}
            <div className="flex items-center justify-between p-3 bg-emerald-900/20 border border-emerald-800/30 rounded-lg">
              <span className="text-xs text-gray-400">Savings vs baseline (Claude Sonnet)</span>
              <span className={clsx('text-sm font-mono font-semibold', result.savings_usd >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {result.savings_usd >= 0 ? '+' : ''}${result.savings_usd.toFixed(7)}
              </span>
            </div>

            {/* Tokens */}
            <div className="flex items-center gap-4 text-xs text-gray-500 font-mono">
              <span>in: {result.input_tokens} tok</span>
              <span>·</span>
              <span>out: {result.output_tokens} tok</span>
              <span>·</span>
              <span>total: {result.total_tokens} tok</span>
            </div>

            {/* Response text */}
            <div>
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">
                Response Text
              </p>
              <div className="bg-surface border border-surface-3 rounded-lg p-3 text-sm text-gray-300 leading-relaxed max-h-48 overflow-y-auto font-mono">
                {result.text}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { Send, Zap, DollarSign, Clock, Star, CheckCircle, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

type Priority = 'cost' | 'latency' | 'quality'

interface Quote {
  recommended_provider: string
  recommended_model: string
  model_display_name: string
  estimated_input_tokens: number
  estimated_output_tokens: number
  retail_cost_usd: number
  bulk_cost_usd: number
  customer_charge_usd: number
  savings_usd: number
  savings_pct: number
}

interface JobResult extends Quote {
  job_id: number
  text: string
  provider: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  latency_ms: number
  priority_used: string
}

export default function JobSubmit() {
  const [prompt, setPrompt] = useState('')
  const [priority, setPriority] = useState<Priority>('cost')
  const [maxTokens, setMaxTokens] = useState(1024)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [result, setResult] = useState<JobResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchQuote = useCallback(async () => {
    if (!prompt.trim()) { setQuote(null); return }
    setQuoteLoading(true)
    try {
      const base = import.meta.env.VITE_API_URL ?? ''
      const res = await fetch(`${base}/v2/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, priority, max_tokens: maxTokens }),
      })
      if (res.ok) setQuote(await res.json())
    } finally {
      setQuoteLoading(false)
    }
  }, [prompt, priority, maxTokens])

  useEffect(() => {
    const t = setTimeout(fetchQuote, 400)
    return () => clearTimeout(t)
  }, [fetchQuote])

  const runJob = async () => {
    if (!prompt.trim()) return
    setRunning(true)
    setError(null)
    setResult(null)
    try {
      const base = import.meta.env.VITE_API_URL ?? ''
      const res = await fetch(`${base}/v2/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, priority, max_tokens: maxTokens }),
      })
      if (!res.ok) {
        const body = await res.json()
        setError(body.detail || 'Job failed')
        return
      }
      setResult(await res.json())
    } catch {
      setError('Network error — is the backend running?')
    } finally {
      setRunning(false)
    }
  }

  const fmtUsd = (v: number) => (v < 0.001 ? `$${v.toFixed(6)}` : `$${v.toFixed(4)}`)

  const priorities: { id: Priority; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'cost', label: 'Cost', desc: 'Cheapest model', icon: <DollarSign size={14} /> },
    { id: 'latency', label: 'Speed', desc: 'Fastest response', icon: <Clock size={14} /> },
    { id: 'quality', label: 'Quality', desc: 'Best model', icon: <Star size={14} /> },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Submit an AI Job</h1>
        <p className="text-gray-500 text-sm mt-1">
          We'll route your job to the best provider at warehouse prices.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: input panel */}
        <div className="lg:col-span-3 space-y-4">
          {/* Prompt */}
          <div className="bg-surface-1 border border-surface-2 rounded-xl p-4">
            <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
              Your Prompt
            </label>
            <textarea
              className="w-full bg-surface resize-none rounded-lg p-3 text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-brand min-h-[200px] placeholder-gray-600"
              placeholder="Enter any prompt — code generation, analysis, writing, Q&A, summarization..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>{prompt.length} chars</span>
              <span>~{Math.ceil(prompt.length / 4)} est. input tokens</span>
            </div>
          </div>

          {/* Priority selector */}
          <div className="bg-surface-1 border border-surface-2 rounded-xl p-4">
            <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">
              Routing Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {priorities.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPriority(p.id)}
                  className={clsx(
                    'flex flex-col items-center gap-1 py-3 px-2 rounded-lg border text-sm font-medium transition-all',
                    priority === p.id
                      ? 'border-brand bg-brand-dim/40 text-brand-light'
                      : 'border-surface-2 text-gray-400 hover:border-surface-3 hover:text-gray-300'
                  )}
                >
                  {p.icon}
                  <span>{p.label}</span>
                  <span className="text-xs text-gray-600 font-normal">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Max tokens */}
          <div className="bg-surface-1 border border-surface-2 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Max Output Tokens
              </label>
              <span className="text-sm text-white font-mono">{maxTokens.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={128}
              max={4096}
              step={128}
              value={maxTokens}
              onChange={e => setMaxTokens(Number(e.target.value))}
              className="w-full accent-brand"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>128</span>
              <span>4096</span>
            </div>
          </div>
        </div>

        {/* Right: quote + submit */}
        <div className="lg:col-span-2 space-y-4">
          {/* Live quote card */}
          <div className="bg-surface-1 border border-surface-2 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Live Quote
              </span>
              {quoteLoading && (
                <span className="text-xs text-gray-600 animate-pulse">Calculating...</span>
              )}
            </div>

            {!prompt.trim() ? (
              <p className="text-gray-600 text-sm text-center py-4">
                Type a prompt to see your quote
              </p>
            ) : quote ? (
              <div className="space-y-3">
                {/* Recommended model */}
                <div className="bg-surface rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Best model for "{priority}"</div>
                  <div className="flex items-center gap-2">
                    <Zap size={12} className="text-brand-light" />
                    <span className="text-white text-sm font-medium">{quote.model_display_name}</span>
                    <span className="text-xs text-gray-600 capitalize">{quote.recommended_provider}</span>
                  </div>
                </div>

                {/* Token estimate */}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Est. input tokens</span>
                  <span className="text-gray-300 font-mono">{quote.estimated_input_tokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Est. output tokens</span>
                  <span className="text-gray-300 font-mono">{quote.estimated_output_tokens.toLocaleString()}</span>
                </div>

                <div className="border-t border-surface-2 my-2" />

                {/* Cost breakdown */}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Retail price</span>
                  <span className="text-gray-400 line-through font-mono">{fmtUsd(quote.retail_cost_usd)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Bulk cost (–15%)</span>
                  <span className="text-gray-400 font-mono">{fmtUsd(quote.bulk_cost_usd)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Service fee (+3%)</span>
                  <span className="text-gray-400 font-mono">included</span>
                </div>

                <div className="border-t border-surface-2" />

                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-white">You pay</span>
                  <span className="text-lg font-bold text-accent-green font-mono">
                    {fmtUsd(quote.customer_charge_usd)}
                  </span>
                </div>

                <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-lg p-2 flex items-center gap-2">
                  <CheckCircle size={12} className="text-accent-green flex-shrink-0" />
                  <span className="text-xs text-accent-green">
                    Saves {fmtUsd(quote.savings_usd)} ({quote.savings_pct.toFixed(1)}%) vs retail
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Submit button */}
          <button
            onClick={runJob}
            disabled={!prompt.trim() || running}
            className={clsx(
              'w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-all',
              prompt.trim() && !running
                ? 'bg-brand hover:bg-brand/90 text-white'
                : 'bg-surface-2 text-gray-600 cursor-not-allowed'
            )}
          >
            {running ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Running Job...
              </>
            ) : (
              <>
                <Send size={16} />
                Run Job
              </>
            )}
          </button>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-800/40 rounded-lg">
              <AlertCircle size={14} className="text-accent-red flex-shrink-0 mt-0.5" />
              <span className="text-accent-red text-xs">{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-surface-1 border border-surface-2 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-2">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-accent-green" />
              <span className="text-sm font-semibold text-white">Job #{result.job_id} Complete</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className={clsx(
                'px-2 py-0.5 rounded-full text-xs',
                result.provider === 'xai' ? 'bg-brand-dim/50 text-brand-light' : 'bg-emerald-900/40 text-accent-green'
              )}>
                {result.provider === 'xai' ? 'xAI' : 'Google'} · {result.model_display_name}
              </span>
              <span>{result.total_tokens.toLocaleString()} tokens</span>
              <span>{result.latency_ms.toFixed(0)}ms</span>
            </div>
          </div>

          {/* Cost receipt */}
          <div className="grid grid-cols-4 divide-x divide-surface-2 border-b border-surface-2">
            {[
              { label: 'Retail Price', value: fmtUsd(result.retail_cost_usd), sub: 'what others charge', muted: true },
              { label: 'Bulk Cost', value: fmtUsd(result.bulk_cost_usd), sub: 'our wholesale price', muted: true },
              { label: 'You Paid', value: fmtUsd(result.customer_charge_usd), sub: 'bulk + 3% fee', green: true },
              { label: 'You Saved', value: fmtUsd(result.savings_usd), sub: `${result.savings_pct.toFixed(1)}% vs retail`, green: true },
            ].map(({ label, value, sub, muted, green }) => (
              <div key={label} className="px-4 py-3 text-center">
                <div className="text-xs text-gray-500 mb-1">{label}</div>
                <div className={clsx(
                  'font-mono font-bold',
                  green ? 'text-accent-green' : muted ? 'text-gray-400' : 'text-white'
                )}>
                  {value}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>

          {/* Response text */}
          <div className="p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Response</div>
            <div className="bg-surface rounded-lg p-4 text-gray-200 text-sm leading-relaxed font-mono whitespace-pre-wrap">
              {result.text}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import clsx from 'clsx'

interface Endpoint {
  method: 'POST' | 'GET'
  path: string
  summary: string
  description: string
  request?: object
  response: object
  params?: { name: string; type: string; required: boolean; description: string }[]
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'POST',
    path: '/v1/completion',
    summary: 'Route a completion request',
    description:
      'Accepts a prompt and a routing priority. The engine selects the optimal provider and model, executes the inference, and returns the response with full cost/savings metadata.',
    request: {
      prompt: 'string (required) — The user prompt to complete',
      priority: '"cost" | "latency" | "quality" — Routing strategy (default: "cost")',
      max_tokens: 'integer — Max output tokens (default: 1024)',
      system: 'string | null — Optional system/context message',
    },
    response: {
      text: 'string — Model response text',
      provider: '"anthropic" | "openai"',
      model: 'string — Exact model ID used',
      input_tokens: 'integer',
      output_tokens: 'integer',
      total_tokens: 'integer',
      cost_usd: 'float — Actual cost in USD',
      credits: 'float — Internal credits consumed',
      latency_ms: 'float — Provider response time in ms',
      savings_usd: 'float — Cost saved vs Claude 3.5 Sonnet baseline',
      priority_used: 'string — Priority that was applied',
      request_id: 'integer — DB ID for this request',
    },
  },
  {
    method: 'GET',
    path: '/v1/stats',
    summary: 'Aggregate usage statistics',
    description: 'Returns aggregate statistics across all requests: total spend, credits, savings percentage, avg latency, and per-provider breakdown.',
    response: {
      total_requests: 'integer',
      total_cost_usd: 'float',
      total_credits: 'float',
      total_savings_usd: 'float',
      savings_percentage: 'float — % saved vs always using baseline',
      avg_latency_ms: 'float',
      total_tokens: 'integer',
      credits_per_dollar: 'integer (10000)',
      provider_distribution: 'array of { provider, count, total_cost_usd, avg_latency_ms, percentage }',
      priority_distribution: 'array of { priority, count }',
    },
  },
  {
    method: 'GET',
    path: '/v1/requests',
    summary: 'Recent request log',
    description: 'Returns the most recent requests ordered by created_at desc. Supports optional filtering by provider or priority.',
    params: [
      { name: 'limit', type: 'integer', required: false, description: 'Max results (default 50, max 200)' },
      { name: 'provider', type: 'string', required: false, description: 'Filter by provider: "anthropic" or "openai"' },
      { name: 'priority', type: 'string', required: false, description: 'Filter by priority: "cost", "latency", or "quality"' },
    ],
    response: {
      '[array]': 'id, provider, model, priority, input_tokens, output_tokens, total_tokens, cost_usd, credits, latency_ms, savings_usd, created_at',
    },
  },
  {
    method: 'GET',
    path: '/v1/providers',
    summary: 'Available providers and model pricing',
    description: 'Returns all configured providers and models with their static pricing, quality scores, and rolling average latency from live traffic.',
    response: {
      '[array]': 'provider, model, display_name, input_cost_per_1m, output_cost_per_1m, quality_score, latency_tier, rolling_avg_latency_ms',
    },
  },
  {
    method: 'GET',
    path: '/health',
    summary: 'Health check',
    description: 'Returns service status. Use this to confirm the server is running.',
    response: {
      status: '"ok"',
      service: '"token-exchange"',
      version: '"0.1.0"',
    },
  },
]

const METHOD_STYLE: Record<string, string> = {
  POST: 'bg-green-900/40 text-green-400 border border-green-800/50',
  GET: 'bg-blue-900/40 text-blue-400 border border-blue-800/50',
}

export default function ApiSpec() {
  const [open, setOpen] = useState<string | null>('/v1/completion')

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h2 className="text-base font-semibold text-white">Token Exchange API</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Base URL: <code className="font-mono text-brand-light">http://localhost:8000</code>
            &nbsp;·&nbsp; Version 0.1.0
            &nbsp;·&nbsp; Interactive docs at{' '}
            <code className="font-mono text-brand-light">/docs</code>
          </p>
        </div>
      </div>

      {ENDPOINTS.map((ep) => {
        const key = `${ep.method} ${ep.path}`
        const isOpen = open === key

        return (
          <div
            key={key}
            className="bg-surface-1 border border-surface-2 rounded-xl overflow-hidden"
          >
            {/* Header row */}
            <button
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-surface-2/30 transition-colors"
              onClick={() => setOpen(isOpen ? null : key)}
            >
              <span
                className={clsx(
                  'text-xs font-mono font-bold px-2 py-0.5 rounded flex-shrink-0',
                  METHOD_STYLE[ep.method]
                )}
              >
                {ep.method}
              </span>
              <code className="text-sm font-mono text-gray-200">{ep.path}</code>
              <span className="text-sm text-gray-500">{ep.summary}</span>
              <span className="ml-auto text-gray-600 text-xs">{isOpen ? '▲' : '▼'}</span>
            </button>

            {/* Expanded */}
            {isOpen && (
              <div className="border-t border-surface-2 px-5 py-5 space-y-5">
                <p className="text-sm text-gray-400">{ep.description}</p>

                {ep.params && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Query Parameters
                    </p>
                    <div className="space-y-2">
                      {ep.params.map((p) => (
                        <div key={p.name} className="flex items-start gap-3 text-sm">
                          <code className="font-mono text-brand-light flex-shrink-0">{p.name}</code>
                          <span className="text-gray-600 font-mono text-xs">{p.type}</span>
                          {!p.required && (
                            <span className="text-gray-600 text-xs">optional</span>
                          )}
                          <span className="text-gray-400 text-xs">{p.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ep.request && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                        Request Body (JSON)
                      </p>
                      <pre className="text-xs font-mono p-3 rounded-lg leading-relaxed bg-surface border border-surface-3 text-gray-300 overflow-x-auto">
                        {Object.entries(ep.request)
                          .map(([k, v]) => `"${k}": ${v}`)
                          .join('\n')}
                      </pre>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Response Body (JSON)
                    </p>
                    <pre className="text-xs font-mono p-3 rounded-lg leading-relaxed bg-surface border border-surface-3 text-purple-300 overflow-x-auto">
                      {Object.entries(ep.response)
                        .map(([k, v]) => `"${k}": ${v}`)
                        .join('\n')}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

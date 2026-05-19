import { useEffect, useState } from 'react'
import { ShoppingCart, Zap, TrendingDown, Shield, ArrowRight, BarChart2, CheckCircle } from 'lucide-react'

interface PricingModel {
  provider: string
  model: string
  display_name: string
  quality_score: number
  latency_tier: string
  retail_input_per_1m: number
  retail_output_per_1m: number
  customer_input_per_1m: number
  customer_output_per_1m: number
  savings_pct: number
}

interface Summary {
  total_jobs: number
  total_saved_usd: number
  avg_savings_pct: number
  bulk_discount_pct: number
  markup_pct: number
}

interface LandingProps {
  onNavigate: (tab: string) => void
}

export default function Landing({ onNavigate }: LandingProps) {
  const [pricing, setPricing] = useState<PricingModel[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL ?? ''
    fetch(`${base}/v2/pricing`).then(r => r.json()).then(setPricing).catch(() => {})
    fetch(`${base}/v2/summary`).then(r => r.json()).then(setSummary).catch(() => {})
  }, [])

  return (
    <div className="space-y-16 pb-16">
      {/* Hero */}
      <section className="text-center pt-12 pb-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dim/20 to-transparent rounded-2xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-dim/40 border border-brand/30 text-brand-light text-xs font-medium mb-6">
            <ShoppingCart size={12} />
            Warehouse-priced AI — now open
          </div>

          <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
            The Costco of
            <span className="text-brand-light"> AI Tokens</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            We buy tokens in bulk from every major LLM provider — Anthropic, OpenAI, and more —
            and pass the savings to you. You pay{' '}
            <span className="text-accent-green font-semibold">~12% less</span> than retail,
            with a transparent 3% service fee.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <button
              onClick={() => onNavigate('submit')}
              className="flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand/90 text-white font-semibold rounded-lg transition-colors"
            >
              Submit Your First Job
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className="flex items-center gap-2 px-6 py-3 bg-surface-2 hover:bg-surface-3 text-gray-200 font-medium rounded-lg border border-surface-3 transition-colors"
            >
              View All Prices
            </button>
          </div>
        </div>
      </section>

      {/* Live stats bar */}
      {summary && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Jobs Processed',
              value: summary.total_jobs.toLocaleString(),
              icon: <BarChart2 size={16} />,
              color: 'text-accent-blue',
            },
            {
              label: 'Total Saved vs Retail',
              value: `$${summary.total_saved_usd.toFixed(4)}`,
              icon: <TrendingDown size={16} />,
              color: 'text-accent-green',
            },
            {
              label: 'Avg Customer Savings',
              value: `${summary.avg_savings_pct.toFixed(1)}%`,
              icon: <ShoppingCart size={16} />,
              color: 'text-brand-light',
            },
            {
              label: 'Providers Available',
              value: '2+',
              icon: <Zap size={16} />,
              color: 'text-accent-yellow',
            },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-surface-1 border border-surface-2 rounded-xl p-5 text-center">
              <div className={`flex justify-center mb-2 ${color}`}>{icon}</div>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </section>
      )}

      {/* How it works */}
      <section>
        <h2 className="text-2xl font-bold text-white text-center mb-8">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Submit Your Job',
              desc: 'Send us your prompt and tell us whether you care most about cost, speed, or quality.',
              icon: <Zap size={20} />,
              color: 'bg-brand-dim text-brand-light',
            },
            {
              step: '02',
              title: 'We Route Smart',
              desc: "Our engine checks real-time pricing across all providers and picks the model that solves your job for the least money.",
              icon: <TrendingDown size={20} />,
              color: 'bg-emerald-900/40 text-accent-green',
            },
            {
              step: '03',
              title: 'You Pay Bulk Rates',
              desc: "You're charged our wholesale bulk price plus a transparent 3% fee — no subscriptions, no surprise markups.",
              icon: <Shield size={20} />,
              color: 'bg-blue-900/40 text-accent-blue',
            },
          ].map(({ step, title, desc, icon, color }) => (
            <div key={step} className="bg-surface-1 border border-surface-2 rounded-xl p-6 relative">
              <div className="text-5xl font-black text-surface-2 absolute top-4 right-6 select-none">{step}</div>
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4 ${color}`}>
                {icon}
              </div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing comparison table */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Bulk vs. Retail Pricing</h2>
            <p className="text-gray-500 text-sm mt-1">Per 1M tokens (input / output). All prices in USD.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-accent-green bg-emerald-900/30 px-3 py-1.5 rounded-full border border-emerald-800/40">
            <CheckCircle size={12} />
            ~12% avg savings vs retail
          </div>
        </div>

        {pricing.length === 0 ? (
          <div className="bg-surface-1 border border-surface-2 rounded-xl p-8 text-center text-gray-500 text-sm">
            Loading pricing...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-2 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left py-3 px-4">Model</th>
                  <th className="text-left py-3 px-4">Provider</th>
                  <th className="text-right py-3 px-4">Retail Input</th>
                  <th className="text-right py-3 px-4">Retail Output</th>
                  <th className="text-right py-3 px-4 text-accent-green">Our Price (In)</th>
                  <th className="text-right py-3 px-4 text-accent-green">Our Price (Out)</th>
                  <th className="text-right py-3 px-4">You Save</th>
                  <th className="text-center py-3 px-4">Quality</th>
                </tr>
              </thead>
              <tbody>
                {pricing.map((m) => (
                  <tr
                    key={`${m.provider}/${m.model}`}
                    className="border-b border-surface-2/50 hover:bg-surface-1 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium text-white">{m.display_name}</span>
                      <span className="text-gray-600 text-xs block">{m.latency_tier}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        m.provider === 'xai'
                          ? 'bg-brand-dim/50 text-brand-light'
                          : 'bg-emerald-900/40 text-accent-green'
                      }`}>
                        {m.provider === 'xai' ? 'xAI' : 'Google'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400 font-mono">
                      ${m.retail_input_per_1m.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400 font-mono">
                      ${m.retail_output_per_1m.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-accent-green font-mono font-medium">
                      ${m.customer_input_per_1m.toFixed(4)}
                    </td>
                    <td className="py-3 px-4 text-right text-accent-green font-mono font-medium">
                      ${m.customer_output_per_1m.toFixed(4)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-accent-green font-semibold">{m.savings_pct.toFixed(1)}%</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-0.5">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-3 rounded-sm ${
                              i < m.quality_score ? 'bg-brand' : 'bg-surface-3'
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Value props */}
      <section className="bg-surface-1 border border-surface-2 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-white mb-6 text-center">Why Token Exchange?</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            ['Bulk purchasing power', 'We negotiate volume agreements with every provider so small businesses get enterprise rates.'],
            ['Smart job routing', 'Every job is analyzed and routed to the cheapest model that meets your quality threshold.'],
            ['Transparent 3% fee', 'No hidden costs. Our entire margin is 3% on top of our wholesale cost. See the math on every job.'],
            ['No subscriptions', 'Pay only for what you run. No monthly fees, no seat licenses, no minimums.'],
            ['Multi-provider coverage', 'Anthropic, OpenAI, and more — if a cheaper model launches, you benefit automatically.'],
            ['Full audit trail', 'Every job logs the provider, model, tokens, retail price, bulk price, and your charge.'],
          ].map(([title, desc]) => (
            <div key={title} className="flex gap-3">
              <CheckCircle size={16} className="text-accent-green flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white text-sm font-medium">{title}</span>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Ready to save on AI?</h2>
        <p className="text-gray-500 mb-6">Submit a job in seconds. No account required for the demo.</p>
        <button
          onClick={() => onNavigate('submit')}
          className="inline-flex items-center gap-2 px-8 py-4 bg-brand hover:bg-brand/90 text-white font-bold rounded-xl text-lg transition-colors"
        >
          <ShoppingCart size={20} />
          Submit a Job Now
        </button>
      </section>
    </div>
  )
}

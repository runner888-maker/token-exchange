import { useState } from 'react'
import clsx from 'clsx'
import { X } from 'lucide-react'

interface NodeDef {
  id: string
  label: string
  sublabel?: string
  x: number
  y: number
  w: number
  h: number
  color: string
  icon: string
  detail: {
    title: string
    description: string
    code?: string
    bullets?: string[]
  }
}

const NODE_W = 160
const NODE_H = 64
const SVG_W = 860
const SVG_H = 560

const nodes: NodeDef[] = [
  {
    id: 'client',
    label: 'Client App',
    sublabel: 'Your application',
    x: 350,
    y: 20,
    w: NODE_W,
    h: NODE_H,
    color: '#3b82f6',
    icon: '⬡',
    detail: {
      title: 'Client Application',
      description:
        'Any application that wants to use AI inference. Instead of calling Anthropic or OpenAI directly, it sends all requests to the Token Exchange proxy endpoint.',
      code: `POST http://localhost:8000/v1/completion
{
  "prompt": "Explain quantum computing",
  "priority": "cost"
}`,
      bullets: [
        'Single endpoint — no provider-specific SDK needed',
        'Uses "credits" instead of provider tokens',
        'Priority hint tells the router what to optimize',
      ],
    },
  },
  {
    id: 'relay',
    label: 'Relay API',
    sublabel: 'Proxy Layer',
    x: 350,
    y: 140,
    w: NODE_W,
    h: NODE_H,
    color: '#7c3aed',
    icon: '⇄',
    detail: {
      title: 'Relay API (Proxy Layer)',
      description:
        'FastAPI service that acts as the unified entry point. It validates requests, delegates routing decisions, and returns normalized responses regardless of which provider was used.',
      code: `@app.post("/v1/completion")
async def create_completion(body: CompletionRequest):
    provider, model = route_request(body.priority)
    result = await provider.complete(body.prompt, model)
    return normalize(result)`,
      bullets: [
        'CORS-enabled — works from any frontend',
        'Validates priority field before routing',
        'Truncates & logs responses to SQLite',
        'Returns cost + credits alongside the text',
      ],
    },
  },
  {
    id: 'router',
    label: 'Routing Engine',
    sublabel: 'cost · latency · quality',
    x: 350,
    y: 260,
    w: NODE_W,
    h: NODE_H,
    color: '#f59e0b',
    icon: '⚡',
    detail: {
      title: 'Routing Engine',
      description:
        'Rules-based engine that selects the optimal provider + model based on the requested priority. Maintains an in-memory rolling average latency per model to improve latency-mode decisions over time.',
      bullets: [
        'cost → picks model with lowest avg $/token (currently gpt-4o-mini at $0.15/1M)',
        'latency → uses rolling avg ms; falls back to tier (fast/medium/slow) if no data',
        'quality → picks highest quality_score (claude-3-opus, score 10)',
        'Latency store updates after every real request',
      ],
      code: `def route_request(priority) -> (provider, model):
  if priority == "cost":
      return min_cost_model()
  if priority == "latency":
      return min_latency_model()
  if priority == "quality":
      return max_quality_model()`,
    },
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    sublabel: 'Claude 3.5 Haiku · Sonnet · Opus',
    x: 120,
    y: 390,
    w: NODE_W + 20,
    h: NODE_H,
    color: '#a78bfa',
    icon: '◈',
    detail: {
      title: 'Anthropic Provider',
      description:
        'Wraps the Anthropic Messages API. In mock mode it simulates responses with realistic latency. With a real API key it calls the actual model.',
      bullets: [
        'claude-3-5-haiku: $0.80/$4.00 per 1M tokens — fast',
        'claude-3-5-sonnet: $3.00/$15.00 per 1M tokens — medium',
        'claude-3-opus: $15.00/$75.00 per 1M tokens — slow, highest quality',
        'Baseline model for savings calculation: Claude 3.5 Sonnet',
      ],
      code: `response = await client.messages.create(
  model="claude-3-5-haiku-20241022",
  max_tokens=1024,
  messages=[{"role":"user","content":prompt}]
)`,
    },
  },
  {
    id: 'openai',
    label: 'OpenAI',
    sublabel: 'GPT-4o Mini · GPT-4o · GPT-4 Turbo',
    x: 580,
    y: 390,
    w: NODE_W + 20,
    h: NODE_H,
    color: '#10b981',
    icon: '◇',
    detail: {
      title: 'OpenAI Provider',
      description:
        'Wraps the OpenAI Chat Completions API. In mock mode it simulates responses. Each model has distinct pricing and quality tradeoffs.',
      bullets: [
        'gpt-4o-mini: $0.15/$0.60 per 1M tokens — fast, cheapest',
        'gpt-4o: $5.00/$15.00 per 1M tokens — medium',
        'gpt-4-turbo: $10.00/$30.00 per 1M tokens — medium',
      ],
      code: `response = await client.chat.completions.create(
  model="gpt-4o-mini",
  messages=[{"role":"user","content":prompt}],
  max_tokens=1024
)`,
    },
  },
  {
    id: 'aggregation',
    label: 'Response Layer',
    sublabel: 'Normalize · Cost · Credits',
    x: 350,
    y: 390,
    w: NODE_W,
    h: NODE_H,
    color: '#06b6d4',
    icon: '≡',
    detail: {
      title: 'Response Aggregation',
      description:
        'Normalizes provider-specific response shapes into a unified schema. Calculates cost in USD, converts to credits, and computes savings vs the baseline (always-Sonnet) cost.',
      bullets: [
        'Unified response shape regardless of provider',
        '1 credit = $0.0001 (10,000 credits = $1)',
        'Savings = baseline_cost − actual_cost',
        'All fields logged to SQLite for dashboard analytics',
      ],
      code: `{
  text, provider, model,
  input_tokens, output_tokens,
  cost_usd: 0.00000012,
  credits: 0.0012,
  savings_usd: 0.00000188,
  latency_ms: 120
}`,
    },
  },
  {
    id: 'dashboard',
    label: 'Dashboard + Logs',
    sublabel: 'React · SQLite',
    x: 350,
    y: 490,
    w: NODE_W,
    h: NODE_H,
    color: '#ec4899',
    icon: '▦',
    detail: {
      title: 'Dashboard & Request Logs',
      description:
        'React dashboard pulling live data from the /v1/stats and /v1/requests endpoints. Shows per-request cost, provider selection, latency, and aggregate savings vs baseline.',
      bullets: [
        'Polling /v1/stats every 5s for live updates',
        'Provider distribution pie chart',
        'Priority usage bar chart',
        'Filterable request log table',
        'API Playground for interactive testing',
      ],
    },
  },
]

// Connections: [fromId, toId, label?]
const edges: [string, string, string?][] = [
  ['client', 'relay', 'POST /v1/completion'],
  ['relay', 'router'],
  ['router', 'anthropic'],
  ['router', 'openai'],
  ['anthropic', 'aggregation'],
  ['openai', 'aggregation'],
  ['aggregation', 'dashboard'],
]

function getNodeCenter(node: NodeDef) {
  return { x: node.x + node.w / 2, y: node.y + node.h / 2 }
}

function getEdgePoints(from: NodeDef, to: NodeDef) {
  const fc = getNodeCenter(from)
  const tc = getNodeCenter(to)
  // Exit from bottom of from, enter top of to (or side if on same row)
  const fromX = fc.x
  const fromY = from.y + from.h
  const toX = tc.x
  const toY = to.y
  return { fromX, fromY, toX, toY }
}

export default function SystemDiagram() {
  const [selected, setSelected] = useState<NodeDef | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]))

  return (
    <div className="flex gap-6 h-full">
      {/* SVG Diagram */}
      <div className="flex-1 bg-surface-1 border border-surface-2 rounded-xl p-4 overflow-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-200">
            System Architecture — click any node to inspect
          </h2>
          <span className="text-xs text-gray-500 italic">Interactive · POC v0.1</span>
        </div>

        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full"
          style={{ maxHeight: 520 }}
        >
          {/* Defs */}
          <defs>
            {nodes.map((n) => (
              <marker
                key={`arrow-${n.id}`}
                id={`arrow-${n.id}`}
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L8,3 z" fill={n.color} opacity="0.6" />
              </marker>
            ))}
          </defs>

          {/* Edges */}
          {edges.map(([fromId, toId, label]) => {
            const from = nodeMap[fromId]
            const to = nodeMap[toId]
            if (!from || !to) return null

            const { fromX, fromY, toX, toY } = getEdgePoints(from, to)
            const isActive =
              hoveredId === fromId || hoveredId === toId ||
              selected?.id === fromId || selected?.id === toId

            // Bezier control points
            const cy = (fromY + toY) / 2

            return (
              <g key={`${fromId}-${toId}`}>
                <path
                  d={`M ${fromX} ${fromY} C ${fromX} ${cy}, ${toX} ${cy}, ${toX} ${toY}`}
                  fill="none"
                  stroke={isActive ? to.color : '#2d3748'}
                  strokeWidth={isActive ? 2 : 1.5}
                  strokeDasharray={isActive ? '6 3' : 'none'}
                  markerEnd={`url(#arrow-${toId})`}
                  className={isActive ? 'flow-arrow' : ''}
                  style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
                />
                {label && isActive && (
                  <text
                    x={(fromX + toX) / 2}
                    y={cy - 6}
                    textAnchor="middle"
                    fill={to.color}
                    fontSize={9}
                    fontFamily="monospace"
                    opacity={0.9}
                  >
                    {label}
                  </text>
                )}
              </g>
            )
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const isSelected = selected?.id === node.id
            const isHovered = hoveredId === node.id

            return (
              <g
                key={node.id}
                onClick={() => setSelected(isSelected ? null : node)}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Glow */}
                {(isSelected || isHovered) && (
                  <rect
                    x={node.x - 4}
                    y={node.y - 4}
                    width={node.w + 8}
                    height={node.h + 8}
                    rx={14}
                    fill={node.color}
                    opacity={0.12}
                  />
                )}
                {/* Card */}
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.w}
                  height={node.h}
                  rx={10}
                  fill="#1e2535"
                  stroke={isSelected || isHovered ? node.color : '#252d3d'}
                  strokeWidth={isSelected ? 2 : 1}
                  style={{ transition: 'stroke 0.15s' }}
                />
                {/* Left accent bar */}
                <rect
                  x={node.x}
                  y={node.y + 10}
                  width={3}
                  height={node.h - 20}
                  rx={2}
                  fill={node.color}
                  opacity={0.8}
                />
                {/* Icon */}
                <text
                  x={node.x + 18}
                  y={node.y + node.h / 2 + 5}
                  fontSize={18}
                  fill={node.color}
                  textAnchor="middle"
                >
                  {node.icon}
                </text>
                {/* Label */}
                <text
                  x={node.x + 30}
                  y={node.y + node.h / 2 - 4}
                  fontSize={11}
                  fontWeight={600}
                  fill="#e2e8f0"
                  fontFamily="Inter, sans-serif"
                >
                  {node.label}
                </text>
                {/* Sublabel */}
                {node.sublabel && (
                  <text
                    x={node.x + 30}
                    y={node.y + node.h / 2 + 11}
                    fontSize={9}
                    fill="#64748b"
                    fontFamily="Inter, sans-serif"
                  >
                    {node.sublabel}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Detail panel */}
      <div
        className={clsx(
          'bg-surface-1 border border-surface-2 rounded-xl transition-all duration-200 overflow-hidden',
          selected ? 'w-80 opacity-100' : 'w-0 opacity-0 border-0'
        )}
      >
        {selected && (
          <div className="p-5 h-full overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div
                  className="text-xs font-mono px-2 py-0.5 rounded mb-2 inline-block"
                  style={{
                    background: `${selected.color}22`,
                    color: selected.color,
                    border: `1px solid ${selected.color}44`,
                  }}
                >
                  {selected.id}
                </div>
                <h3 className="text-base font-semibold text-white">
                  {selected.detail.title}
                </h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-gray-300 transition-colors mt-1"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              {selected.detail.description}
            </p>

            {selected.detail.bullets && (
              <ul className="space-y-2 mb-4">
                {selected.detail.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span style={{ color: selected.color }} className="mt-0.5 flex-shrink-0">▸</span>
                    <span className="text-gray-300">{b}</span>
                  </li>
                ))}
              </ul>
            )}

            {selected.detail.code && (
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">
                  Example
                </p>
                <pre
                  className="text-xs font-mono p-3 rounded-lg overflow-x-auto leading-relaxed"
                  style={{
                    background: '#0f1117',
                    border: '1px solid #252d3d',
                    color: '#a78bfa',
                  }}
                >
                  {selected.detail.code}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

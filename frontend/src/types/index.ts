export interface CompletionRequest {
  prompt: string
  priority: 'cost' | 'latency' | 'quality'
  max_tokens?: number
  system?: string
}

export interface CompletionResponse {
  text: string
  provider: string
  model: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  cost_usd: number
  credits: number
  latency_ms: number
  savings_usd: number
  priority_used: string
  request_id: number
}

export interface RequestLog {
  id: number
  provider: string
  model: string
  priority: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  cost_usd: number
  credits: number
  latency_ms: number
  savings_usd: number
  created_at: string
}

export interface ProviderDist {
  provider: string
  count: number
  total_cost_usd: number
  avg_latency_ms: number
  percentage: number
}

export interface Stats {
  total_requests: number
  total_cost_usd: number
  total_credits: number
  total_savings_usd: number
  savings_percentage: number
  avg_latency_ms: number
  total_tokens: number
  credits_per_dollar: number
  provider_distribution: ProviderDist[]
  priority_distribution: { priority: string; count: number }[]
}

export interface ProviderModel {
  provider: string
  model: string
  display_name: string
  input_cost_per_1m: number
  output_cost_per_1m: number
  quality_score: number
  latency_tier: string
  rolling_avg_latency_ms: number
}

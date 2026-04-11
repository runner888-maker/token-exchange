from typing import Dict, Any

# Static pricing tables (USD per 1M tokens, as of 2024)
PROVIDER_MODELS: Dict[str, Dict[str, Any]] = {
    "anthropic": {
        "claude-3-5-haiku-20241022": {
            "input_cost_per_1m": 0.80,
            "output_cost_per_1m": 4.00,
            "quality_score": 6,
            "latency_tier": "fast",
            "display_name": "Claude 3.5 Haiku",
        },
        "claude-3-5-sonnet-20241022": {
            "input_cost_per_1m": 3.00,
            "output_cost_per_1m": 15.00,
            "quality_score": 9,
            "latency_tier": "medium",
            "display_name": "Claude 3.5 Sonnet",
        },
        "claude-3-opus-20240229": {
            "input_cost_per_1m": 15.00,
            "output_cost_per_1m": 75.00,
            "quality_score": 10,
            "latency_tier": "slow",
            "display_name": "Claude 3 Opus",
        },
    },
    "openai": {
        "gpt-4o-mini": {
            "input_cost_per_1m": 0.15,
            "output_cost_per_1m": 0.60,
            "quality_score": 6,
            "latency_tier": "fast",
            "display_name": "GPT-4o Mini",
        },
        "gpt-4o": {
            "input_cost_per_1m": 5.00,
            "output_cost_per_1m": 15.00,
            "quality_score": 9,
            "latency_tier": "medium",
            "display_name": "GPT-4o",
        },
        "gpt-4-turbo": {
            "input_cost_per_1m": 10.00,
            "output_cost_per_1m": 30.00,
            "quality_score": 9,
            "latency_tier": "medium",
            "display_name": "GPT-4 Turbo",
        },
    },
}

# 1 credit = $0.0001  →  $1 = 10,000 credits
CREDITS_PER_DOLLAR = 10_000

# Baseline model used to compute savings (what you'd pay if always using Sonnet)
BASELINE_PROVIDER = "anthropic"
BASELINE_MODEL = "claude-3-5-sonnet-20241022"


def calculate_cost(provider: str, model: str, input_tokens: int, output_tokens: int) -> float:
    """Returns cost in USD."""
    info = PROVIDER_MODELS[provider][model]
    return (input_tokens / 1_000_000) * info["input_cost_per_1m"] + \
           (output_tokens / 1_000_000) * info["output_cost_per_1m"]


def cost_to_credits(cost_usd: float) -> float:
    return cost_usd * CREDITS_PER_DOLLAR

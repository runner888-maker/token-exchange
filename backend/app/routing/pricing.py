from typing import Dict, Any

# Pricing as of 2025 (USD per 1M tokens)
PROVIDER_MODELS: Dict[str, Dict[str, Any]] = {
    "xai": {
        "grok-3-mini-beta": {
            "input_cost_per_1m": 0.30,
            "output_cost_per_1m": 0.50,
            "quality_score": 7,
            "latency_tier": "fast",
            "display_name": "Grok 3 Mini",
        },
        "grok-3-beta": {
            "input_cost_per_1m": 3.00,
            "output_cost_per_1m": 15.00,
            "quality_score": 10,
            "latency_tier": "medium",
            "display_name": "Grok 3",
        },
        "grok-2-1212": {
            "input_cost_per_1m": 2.00,
            "output_cost_per_1m": 10.00,
            "quality_score": 8,
            "latency_tier": "medium",
            "display_name": "Grok 2",
        },
    },
    "gemini": {
        "gemini-2.5-flash": {
            "input_cost_per_1m": 0.15,
            "output_cost_per_1m": 0.60,
            "quality_score": 8,
            "latency_tier": "fast",
            "display_name": "Gemini 2.5 Flash",
        },
        "gemini-2.5-pro": {
            "input_cost_per_1m": 1.25,
            "output_cost_per_1m": 10.00,
            "quality_score": 10,
            "latency_tier": "medium",
            "display_name": "Gemini 2.5 Pro",
        },
    },
}

# 1 credit = $0.0001  →  $1 = 10,000 credits
CREDITS_PER_DOLLAR = 10_000

# Baseline for savings comparison: Gemini 1.5 Pro (mid-tier)
BASELINE_PROVIDER = "gemini"
BASELINE_MODEL = "gemini-1.5-pro"


def calculate_cost(provider: str, model: str, input_tokens: int, output_tokens: int) -> float:
    """Returns cost in USD."""
    info = PROVIDER_MODELS[provider][model]
    return (input_tokens / 1_000_000) * info["input_cost_per_1m"] + \
           (output_tokens / 1_000_000) * info["output_cost_per_1m"]


def cost_to_credits(cost_usd: float) -> float:
    return cost_usd * CREDITS_PER_DOLLAR

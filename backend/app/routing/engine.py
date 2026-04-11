from typing import Tuple, Dict
from .pricing import PROVIDER_MODELS

# In-memory rolling latency store: { "provider/model": {"avg": ms, "count": n} }
_latency_store: Dict[str, dict] = {}


def get_rolling_latency(provider: str, model: str) -> float:
    return _latency_store.get(f"{provider}/{model}", {}).get("avg", 9999.0)


def update_latency(provider: str, model: str, latency_ms: float) -> None:
    key = f"{provider}/{model}"
    if key not in _latency_store:
        _latency_store[key] = {"avg": latency_ms, "count": 1}
    else:
        count = _latency_store[key]["count"]
        old_avg = _latency_store[key]["avg"]
        _latency_store[key]["avg"] = (old_avg * count + latency_ms) / (count + 1)
        _latency_store[key]["count"] = count + 1


def get_latency_data() -> Dict[str, dict]:
    return dict(_latency_store)


def route_request(priority: str) -> Tuple[str, str]:
    """
    Returns (provider, model) based on the given priority strategy.

    Strategies:
      cost     – lowest average cost per token
      latency  – fastest rolling avg latency (falls back to tier if no data)
      quality  – highest quality score
    """
    if priority == "cost":
        best, best_val = None, float("inf")
        for provider, models in PROVIDER_MODELS.items():
            for model, info in models.items():
                avg = (info["input_cost_per_1m"] + info["output_cost_per_1m"]) / 2
                if avg < best_val:
                    best_val, best = avg, (provider, model)
        return best

    if priority == "latency":
        tier_rank = {"fast": 1000, "medium": 2000, "slow": 3000}
        best, best_val = None, float("inf")
        for provider, models in PROVIDER_MODELS.items():
            for model, info in models.items():
                key = f"{provider}/{model}"
                if key in _latency_store:
                    score = _latency_store[key]["avg"]
                else:
                    score = float(tier_rank.get(info["latency_tier"], 2000))
                if score < best_val:
                    best_val, best = score, (provider, model)
        return best

    if priority == "quality":
        best, best_val = None, -1
        for provider, models in PROVIDER_MODELS.items():
            for model, info in models.items():
                if info["quality_score"] > best_val:
                    best_val, best = info["quality_score"], (provider, model)
        return best

    # default fallback
    return route_request("cost")

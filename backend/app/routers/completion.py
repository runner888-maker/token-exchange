import hashlib

from flask import Blueprint, jsonify, request

from ..config import settings
from ..database.db import get_db
from ..database.models import Request
from ..providers.xai_provider import XAIProvider
from ..providers.gemini_provider import GeminiProvider
from ..routing.engine import route_request, update_latency
from ..routing.pricing import (
    BASELINE_MODEL,
    BASELINE_PROVIDER,
    calculate_cost,
    cost_to_credits,
)

completion_bp = Blueprint("completion", __name__)

VALID_PRIORITIES = {"cost", "latency", "quality"}


def _make_provider(provider_name: str):
    if provider_name == "xai":
        return XAIProvider(
            api_key=settings.xai_api_key,
            mock=settings.mock_mode or not settings.xai_api_key,
        )
    return GeminiProvider(
        api_key=settings.gemini_api_key,
        mock=settings.mock_mode or not settings.gemini_api_key,
    )


@completion_bp.post("/completion")
def create_completion():
    data = request.get_json(silent=True)
    if not data or "prompt" not in data:
        return jsonify({"detail": "prompt is required"}), 400

    prompt = data["prompt"]
    priority = data.get("priority", "cost")
    max_tokens = data.get("max_tokens", 1024)
    system = data.get("system")

    if priority not in VALID_PRIORITIES:
        return jsonify({"detail": "priority must be one of: cost, latency, quality"}), 400

    provider_name, model = route_request(priority)
    provider = _make_provider(provider_name)

    try:
        result = provider.complete(prompt=prompt, model=model, max_tokens=max_tokens, system=system)
    except Exception as primary_err:
        # Fallback: if Gemini fails (quota/billing), use xAI
        if provider_name != "xai" and settings.xai_api_key:
            provider_name, model = "xai", "grok-3-mini-beta"
            provider = _make_provider("xai")
            try:
                result = provider.complete(prompt=prompt, model=model, max_tokens=max_tokens, system=system)
            except Exception as fallback_err:
                return jsonify({"detail": f"All providers failed. Primary: {primary_err}. Fallback: {fallback_err}"}), 502
        else:
            return jsonify({"detail": str(primary_err)}), 502

    update_latency(provider_name, model, result.latency_ms)

    cost = calculate_cost(provider_name, model, result.input_tokens, result.output_tokens)
    credits = cost_to_credits(cost)
    baseline_cost = calculate_cost(
        BASELINE_PROVIDER, BASELINE_MODEL, result.input_tokens, result.output_tokens
    )
    savings = baseline_cost - cost

    db = get_db()
    try:
        record = Request(
            prompt_hash=hashlib.md5(prompt.encode()).hexdigest()[:16],
            provider=provider_name,
            model=model,
            priority=priority,
            input_tokens=result.input_tokens,
            output_tokens=result.output_tokens,
            total_tokens=result.input_tokens + result.output_tokens,
            cost_usd=cost,
            credits=credits,
            latency_ms=result.latency_ms,
            response_text=result.text[:500],
            baseline_cost_usd=baseline_cost,
            savings_usd=savings,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        record_id = record.id
    finally:
        db.close()

    return jsonify({
        "text": result.text,
        "provider": provider_name,
        "model": model,
        "input_tokens": result.input_tokens,
        "output_tokens": result.output_tokens,
        "total_tokens": result.input_tokens + result.output_tokens,
        "cost_usd": round(cost, 8),
        "credits": round(credits, 4),
        "latency_ms": round(result.latency_ms, 2),
        "savings_usd": round(savings, 8),
        "priority_used": priority,
        "request_id": record_id,
    })

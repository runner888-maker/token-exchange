import hashlib

from flask import Blueprint, jsonify, request

from ..config import settings
from ..database.db import get_db
from ..database.models import Request
from ..providers.anthropic_provider import AnthropicProvider
from ..providers.openai_provider import OpenAIProvider
from ..routing.engine import route_request, update_latency
from ..routing.pricing import (
    BASELINE_MODEL,
    BASELINE_PROVIDER,
    calculate_cost,
    cost_to_credits,
)

completion_bp = Blueprint("completion", __name__)

VALID_PRIORITIES = {"cost", "latency", "quality"}


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

    # Route
    provider_name, model = route_request(priority)

    # Execute
    if provider_name == "anthropic":
        provider = AnthropicProvider(
            api_key=settings.anthropic_api_key,
            mock=settings.mock_mode or not settings.anthropic_api_key,
        )
    else:
        provider = OpenAIProvider(
            api_key=settings.openai_api_key,
            mock=settings.mock_mode or not settings.openai_api_key,
        )

    result = provider.complete(prompt=prompt, model=model, max_tokens=max_tokens, system=system)

    update_latency(provider_name, model, result.latency_ms)

    # Costs
    cost = calculate_cost(provider_name, model, result.input_tokens, result.output_tokens)
    credits = cost_to_credits(cost)
    baseline_cost = calculate_cost(
        BASELINE_PROVIDER, BASELINE_MODEL, result.input_tokens, result.output_tokens
    )
    savings = baseline_cost - cost

    # Persist
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

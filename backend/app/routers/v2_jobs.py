import hashlib

from flask import Blueprint, jsonify, request

from ..billing.markup import BULK_DISCOUNT, MARKUP, calculate_job_pricing
from ..config import settings
from ..database.db import get_db
from ..database.models import Request
from ..providers.xai_provider import XAIProvider
from ..providers.gemini_provider import GeminiProvider
from ..routing.engine import route_request, update_latency
from ..routing.pricing import PROVIDER_MODELS, calculate_cost

v2_jobs_bp = Blueprint("v2_jobs", __name__)

VALID_PRIORITIES = {"cost", "latency", "quality"}

CHARS_PER_TOKEN = 4


def estimate_tokens(prompt: str, max_tokens: int) -> tuple[int, int]:
    input_est = max(1, len(prompt) // CHARS_PER_TOKEN)
    output_est = int(max_tokens * 0.6)
    return input_est, output_est


@v2_jobs_bp.get("/pricing")
def get_pricing():
    result = []
    for provider, models in PROVIDER_MODELS.items():
        for model_id, info in models.items():
            retail_input = info["input_cost_per_1m"]
            retail_output = info["output_cost_per_1m"]
            result.append({
                "provider": provider,
                "model": model_id,
                "display_name": info["display_name"],
                "quality_score": info["quality_score"],
                "latency_tier": info["latency_tier"],
                "retail_input_per_1m": retail_input,
                "retail_output_per_1m": retail_output,
                "bulk_input_per_1m": round(retail_input * (1 - BULK_DISCOUNT), 4),
                "bulk_output_per_1m": round(retail_output * (1 - BULK_DISCOUNT), 4),
                "customer_input_per_1m": round(retail_input * (1 - BULK_DISCOUNT) * (1 + MARKUP), 4),
                "customer_output_per_1m": round(retail_output * (1 - BULK_DISCOUNT) * (1 + MARKUP), 4),
                "savings_pct": round(BULK_DISCOUNT * 100 - MARKUP * 100, 2),
            })
    return jsonify(result)


@v2_jobs_bp.post("/quote")
def get_quote():
    data = request.get_json(silent=True) or {}
    prompt = data.get("prompt", "")
    priority = data.get("priority", "cost")
    max_tokens = int(data.get("max_tokens", 1024))

    if priority not in VALID_PRIORITIES:
        return jsonify({"detail": "priority must be one of: cost, latency, quality"}), 400

    provider_name, model = route_request(priority)
    input_est, output_est = estimate_tokens(prompt, max_tokens)
    retail_cost = calculate_cost(provider_name, model, input_est, output_est)
    pricing = calculate_job_pricing(retail_cost)

    return jsonify({
        "recommended_provider": provider_name,
        "recommended_model": model,
        "model_display_name": PROVIDER_MODELS[provider_name][model]["display_name"],
        "estimated_input_tokens": input_est,
        "estimated_output_tokens": output_est,
        **pricing,
    })


@v2_jobs_bp.post("/jobs")
def submit_job():
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

    def make_provider(name):
        if name == "xai":
            return XAIProvider(api_key=settings.xai_api_key, mock=settings.mock_mode or not settings.xai_api_key)
        return GeminiProvider(api_key=settings.gemini_api_key, mock=settings.mock_mode or not settings.gemini_api_key)

    provider = make_provider(provider_name)
    try:
        result = provider.complete(prompt=prompt, model=model, max_tokens=max_tokens, system=system)
    except Exception as primary_err:
        # Fallback to xAI if primary provider fails (e.g. Gemini quota exceeded)
        if provider_name != "xai" and settings.xai_api_key:
            provider_name, model = "xai", "grok-3-mini-beta"
            provider = make_provider("xai")
            try:
                result = provider.complete(prompt=prompt, model=model, max_tokens=max_tokens, system=system)
            except Exception as fallback_err:
                return jsonify({"detail": f"All providers failed. Primary: {primary_err}. Fallback: {fallback_err}"}), 502
        else:
            return jsonify({"detail": str(primary_err)}), 502
    update_latency(provider_name, model, result.latency_ms)

    retail_cost = calculate_cost(provider_name, model, result.input_tokens, result.output_tokens)
    pricing = calculate_job_pricing(retail_cost)

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
            cost_usd=pricing["customer_charge_usd"],
            credits=pricing["customer_charge_usd"] * 10_000,
            latency_ms=result.latency_ms,
            response_text=result.text[:500],
            baseline_cost_usd=pricing["retail_cost_usd"],
            savings_usd=pricing["savings_usd"],
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        record_id = record.id
    finally:
        db.close()

    return jsonify({
        "job_id": record_id,
        "text": result.text,
        "provider": provider_name,
        "model": model,
        "model_display_name": PROVIDER_MODELS[provider_name][model]["display_name"],
        "input_tokens": result.input_tokens,
        "output_tokens": result.output_tokens,
        "total_tokens": result.input_tokens + result.output_tokens,
        "latency_ms": round(result.latency_ms, 2),
        "priority_used": priority,
        **pricing,
    })


@v2_jobs_bp.get("/jobs")
def list_jobs():
    limit = min(int(request.args.get("limit", 50)), 200)
    db = get_db()
    try:
        rows = (
            db.query(Request)
            .order_by(Request.created_at.desc())
            .limit(limit)
            .all()
        )
        return jsonify([
            {
                "job_id": r.id,
                "provider": r.provider,
                "model": r.model,
                "priority": r.priority,
                "input_tokens": r.input_tokens,
                "output_tokens": r.output_tokens,
                "total_tokens": r.total_tokens,
                "customer_charge_usd": round(r.cost_usd, 8),
                "retail_cost_usd": round(r.baseline_cost_usd, 8) if r.baseline_cost_usd else None,
                "savings_usd": round(r.savings_usd, 8) if r.savings_usd else None,
                "latency_ms": r.latency_ms,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ])
    finally:
        db.close()


@v2_jobs_bp.get("/providers/status")
def provider_status():
    """Probe each provider with a minimal call and report health."""
    from openai import OpenAI

    results = {}

    # --- xAI ---
    try:
        client = OpenAI(api_key=settings.xai_api_key, base_url="https://api.x.ai/v1")
        r = client.chat.completions.create(
            model="grok-3-mini-beta",
            messages=[{"role": "user", "content": "hi"}],
            max_tokens=5,
        )
        results["xai"] = {"status": "ok", "model": "grok-3-mini-beta", "error": None}
    except Exception as e:
        results["xai"] = {"status": "error", "model": "grok-3-mini-beta", "error": str(e)[:200]}

    # --- Gemini ---
    try:
        client = OpenAI(
            api_key=settings.gemini_api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
        )
        r = client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=[{"role": "user", "content": "hi"}],
        )
        results["gemini"] = {"status": "ok", "model": "gemini-2.5-flash", "error": None}
    except Exception as e:
        err = str(e)
        if "429" in err or "quota" in err.lower() or "RESOURCE_EXHAUSTED" in err:
            results["gemini"] = {
                "status": "quota_exceeded",
                "model": "gemini-2.5-flash",
                "error": "Free-tier quota exhausted — enable billing at console.cloud.google.com",
            }
        else:
            results["gemini"] = {"status": "error", "model": "gemini-2.5-flash", "error": err[:200]}

    return jsonify(results)


@v2_jobs_bp.get("/summary")
def get_summary():
    db = get_db()
    try:
        rows = db.query(Request).all()
        total_jobs = len(rows)
        total_spent = sum(r.cost_usd or 0 for r in rows)
        total_retail = sum(r.baseline_cost_usd or 0 for r in rows)
        total_saved = total_retail - total_spent
        avg_savings_pct = (total_saved / total_retail * 100) if total_retail > 0 else 12.45
        return jsonify({
            "total_jobs": total_jobs,
            "total_spent_usd": round(total_spent, 6),
            "total_retail_usd": round(total_retail, 6),
            "total_saved_usd": round(total_saved, 6),
            "avg_savings_pct": round(avg_savings_pct, 2),
            "bulk_discount_pct": round(BULK_DISCOUNT * 100, 1),
            "markup_pct": round(MARKUP * 100, 1),
        })
    finally:
        db.close()

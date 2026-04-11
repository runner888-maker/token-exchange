from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database.db import get_db
from ..database.models import Request
from ..routing.engine import get_latency_data
from ..routing.pricing import CREDITS_PER_DOLLAR, PROVIDER_MODELS

router = APIRouter()


@router.get(
    "/stats",
    summary="Aggregate usage statistics",
    tags=["stats"],
)
async def get_stats(db: Session = Depends(get_db)):
    total_requests = db.query(func.count(Request.id)).scalar() or 0
    total_cost = db.query(func.sum(Request.cost_usd)).scalar() or 0.0
    total_credits = db.query(func.sum(Request.credits)).scalar() or 0.0
    total_savings = db.query(func.sum(Request.savings_usd)).scalar() or 0.0
    avg_latency = db.query(func.avg(Request.latency_ms)).scalar() or 0.0
    total_tokens = db.query(func.sum(Request.total_tokens)).scalar() or 0
    baseline_cost = db.query(func.sum(Request.baseline_cost_usd)).scalar() or 0.0

    savings_pct = (
        (baseline_cost - total_cost) / baseline_cost * 100 if baseline_cost > 0 else 0.0
    )

    provider_rows = (
        db.query(
            Request.provider,
            func.count(Request.id).label("count"),
            func.sum(Request.cost_usd).label("total_cost"),
            func.avg(Request.latency_ms).label("avg_latency"),
        )
        .group_by(Request.provider)
        .all()
    )

    priority_rows = (
        db.query(
            Request.priority,
            func.count(Request.id).label("count"),
        )
        .group_by(Request.priority)
        .all()
    )

    return {
        "total_requests": total_requests,
        "total_cost_usd": round(total_cost, 6),
        "total_credits": round(total_credits, 2),
        "total_savings_usd": round(total_savings, 6),
        "savings_percentage": round(savings_pct, 1),
        "avg_latency_ms": round(avg_latency, 2),
        "total_tokens": total_tokens,
        "credits_per_dollar": CREDITS_PER_DOLLAR,
        "provider_distribution": [
            {
                "provider": r.provider,
                "count": r.count,
                "total_cost_usd": round(r.total_cost or 0, 6),
                "avg_latency_ms": round(r.avg_latency or 0, 2),
                "percentage": round(r.count / total_requests * 100, 1) if total_requests else 0,
            }
            for r in provider_rows
        ],
        "priority_distribution": [
            {"priority": r.priority, "count": r.count}
            for r in priority_rows
        ],
    }


@router.get(
    "/requests",
    summary="Recent request log",
    tags=["stats"],
)
async def list_requests(
    limit: int = Query(default=50, le=200),
    provider: str = Query(default=None),
    priority: str = Query(default=None),
    db: Session = Depends(get_db),
):
    q = db.query(Request).order_by(Request.created_at.desc())
    if provider:
        q = q.filter(Request.provider == provider)
    if priority:
        q = q.filter(Request.priority == priority)
    rows = q.limit(limit).all()

    return [
        {
            "id": r.id,
            "provider": r.provider,
            "model": r.model,
            "priority": r.priority,
            "input_tokens": r.input_tokens,
            "output_tokens": r.output_tokens,
            "total_tokens": r.total_tokens,
            "cost_usd": round(r.cost_usd, 8),
            "credits": round(r.credits, 4),
            "latency_ms": round(r.latency_ms, 2),
            "savings_usd": round(r.savings_usd, 8),
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


@router.get(
    "/providers",
    summary="Available providers and models with pricing",
    tags=["stats"],
)
async def list_providers():
    result = []
    latency_data = get_latency_data()
    for provider_name, models in PROVIDER_MODELS.items():
        for model_id, info in models.items():
            key = f"{provider_name}/{model_id}"
            result.append(
                {
                    "provider": provider_name,
                    "model": model_id,
                    "display_name": info["display_name"],
                    "input_cost_per_1m": info["input_cost_per_1m"],
                    "output_cost_per_1m": info["output_cost_per_1m"],
                    "quality_score": info["quality_score"],
                    "latency_tier": info["latency_tier"],
                    "rolling_avg_latency_ms": round(
                        latency_data.get(key, {}).get("avg", 0), 2
                    ),
                }
            )
    return result

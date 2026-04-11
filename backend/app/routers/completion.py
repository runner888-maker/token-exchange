import hashlib
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

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

router = APIRouter()

VALID_PRIORITIES = {"cost", "latency", "quality"}


class CompletionRequest(BaseModel):
    prompt: str
    priority: str = "cost"
    max_tokens: int = 1024
    system: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "Explain quantum computing in one paragraph.",
                "priority": "cost",
                "max_tokens": 512,
            }
        }


class CompletionResponse(BaseModel):
    text: str
    provider: str
    model: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    cost_usd: float
    credits: float
    latency_ms: float
    savings_usd: float
    priority_used: str
    request_id: int


@router.post(
    "/completion",
    response_model=CompletionResponse,
    summary="Route a completion request",
    description=(
        "Accepts a prompt and a routing priority (cost | latency | quality). "
        "The routing engine selects the optimal provider and model, executes the "
        "request, and returns the response along with cost and savings metadata."
    ),
    tags=["completion"],
)
async def create_completion(
    body: CompletionRequest, db: Session = Depends(get_db)
) -> CompletionResponse:
    if body.priority not in VALID_PRIORITIES:
        raise HTTPException(
            status_code=400,
            detail=f"priority must be one of: {', '.join(sorted(VALID_PRIORITIES))}",
        )

    # 1. Route
    provider_name, model = route_request(body.priority)

    # 2. Execute
    use_mock = settings.mock_mode
    if provider_name == "anthropic":
        provider = AnthropicProvider(
            api_key=settings.anthropic_api_key,
            mock=use_mock or not settings.anthropic_api_key,
        )
    else:
        provider = OpenAIProvider(
            api_key=settings.openai_api_key,
            mock=use_mock or not settings.openai_api_key,
        )

    result = await provider.complete(
        prompt=body.prompt,
        model=model,
        max_tokens=body.max_tokens,
        system=body.system,
    )

    # 3. Update rolling latency
    update_latency(provider_name, model, result.latency_ms)

    # 4. Costs + credits
    cost = calculate_cost(
        provider_name, model, result.input_tokens, result.output_tokens
    )
    credits = cost_to_credits(cost)
    baseline_cost = calculate_cost(
        BASELINE_PROVIDER, BASELINE_MODEL, result.input_tokens, result.output_tokens
    )
    savings = baseline_cost - cost

    # 5. Persist
    record = Request(
        prompt_hash=hashlib.md5(body.prompt.encode()).hexdigest()[:16],
        provider=provider_name,
        model=model,
        priority=body.priority,
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

    return CompletionResponse(
        text=result.text,
        provider=provider_name,
        model=model,
        input_tokens=result.input_tokens,
        output_tokens=result.output_tokens,
        total_tokens=result.input_tokens + result.output_tokens,
        cost_usd=round(cost, 8),
        credits=round(credits, 4),
        latency_ms=round(result.latency_ms, 2),
        savings_usd=round(savings, 8),
        priority_used=body.priority,
        request_id=record.id,
    )

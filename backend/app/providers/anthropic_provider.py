import asyncio
import time
from typing import Optional

from .base import BaseProvider, ProviderResponse


class AnthropicProvider(BaseProvider):
    def __init__(self, api_key: str = "", mock: bool = True):
        self.api_key = api_key
        self.mock = mock or not api_key
        if not self.mock:
            import anthropic
            self._client = anthropic.AsyncAnthropic(api_key=api_key)

    async def complete(
        self,
        prompt: str,
        model: str,
        max_tokens: int = 1024,
        system: Optional[str] = None,
    ) -> ProviderResponse:
        if self.mock:
            return await self._mock_complete(prompt, model, max_tokens)

        kwargs: dict = {
            "model": model,
            "max_tokens": max_tokens,
            "messages": [{"role": "user", "content": prompt}],
        }
        if system:
            kwargs["system"] = system

        start = time.perf_counter()
        response = await self._client.messages.create(**kwargs)
        latency_ms = (time.perf_counter() - start) * 1000

        return ProviderResponse(
            text=response.content[0].text,
            input_tokens=response.usage.input_tokens,
            output_tokens=response.usage.output_tokens,
            latency_ms=round(latency_ms, 2),
            model=model,
            provider="anthropic",
        )

    async def _mock_complete(
        self, prompt: str, model: str, max_tokens: int
    ) -> ProviderResponse:
        # Simulate realistic latency variation per model
        latency_map = {
            "claude-3-5-haiku-20241022": 0.12,
            "claude-3-5-sonnet-20241022": 0.28,
            "claude-3-opus-20240229": 0.55,
        }
        await asyncio.sleep(latency_map.get(model, 0.20))
        latency_ms = latency_map.get(model, 0.20) * 1000

        input_tokens = max(10, len(prompt.split()) * 4 // 3)
        output = (
            f"[Mock Anthropic · {model}] "
            f"Responding to your {len(prompt.split())}-word prompt. "
            "In production this calls the real Anthropic API with your key."
        )
        output_tokens = max(10, len(output.split()) * 4 // 3)

        return ProviderResponse(
            text=output,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=round(latency_ms, 2),
            model=model,
            provider="anthropic",
        )

import asyncio
import time
from typing import Optional

from .base import BaseProvider, ProviderResponse


class OpenAIProvider(BaseProvider):
    def __init__(self, api_key: str = "", mock: bool = True):
        self.api_key = api_key
        self.mock = mock or not api_key
        if not self.mock:
            from openai import AsyncOpenAI
            self._client = AsyncOpenAI(api_key=api_key)

    async def complete(
        self,
        prompt: str,
        model: str,
        max_tokens: int = 1024,
        system: Optional[str] = None,
    ) -> ProviderResponse:
        if self.mock:
            return await self._mock_complete(prompt, model, max_tokens)

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        start = time.perf_counter()
        response = await self._client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
        )
        latency_ms = (time.perf_counter() - start) * 1000

        return ProviderResponse(
            text=response.choices[0].message.content or "",
            input_tokens=response.usage.prompt_tokens,
            output_tokens=response.usage.completion_tokens,
            latency_ms=round(latency_ms, 2),
            model=model,
            provider="openai",
        )

    async def _mock_complete(
        self, prompt: str, model: str, max_tokens: int
    ) -> ProviderResponse:
        latency_map = {
            "gpt-4o-mini": 0.09,
            "gpt-4o": 0.22,
            "gpt-4-turbo": 0.35,
        }
        await asyncio.sleep(latency_map.get(model, 0.15))
        latency_ms = latency_map.get(model, 0.15) * 1000

        input_tokens = max(10, len(prompt.split()) * 4 // 3)
        output = (
            f"[Mock OpenAI · {model}] "
            f"Responding to your {len(prompt.split())}-word prompt. "
            "In production this calls the real OpenAI API with your key."
        )
        output_tokens = max(10, len(output.split()) * 4 // 3)

        return ProviderResponse(
            text=output,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=round(latency_ms, 2),
            model=model,
            provider="openai",
        )

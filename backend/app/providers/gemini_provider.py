import time
from typing import Optional

from .base import BaseProvider, ProviderResponse

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"


class GeminiProvider(BaseProvider):
    def __init__(self, api_key: str = "", mock: bool = False):
        self.api_key = api_key
        self.mock = mock or not api_key
        if not self.mock:
            from openai import OpenAI
            self._client = OpenAI(api_key=api_key, base_url=GEMINI_BASE_URL)

    def complete(
        self,
        prompt: str,
        model: str,
        max_tokens: int = 1024,
        system: Optional[str] = None,
    ) -> ProviderResponse:
        if self.mock:
            return self._mock_complete(prompt, model, max_tokens)

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        start = time.perf_counter()
        # Gemini 2.5 are thinking models — they need headroom to reason.
        # Use the caller's max_tokens but enforce a generous minimum.
        effective_max = max(max_tokens, 2048)
        response = self._client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=effective_max,
        )
        latency_ms = (time.perf_counter() - start) * 1000

        return ProviderResponse(
            text=response.choices[0].message.content or "",
            input_tokens=response.usage.prompt_tokens,
            output_tokens=response.usage.completion_tokens,
            latency_ms=round(latency_ms, 2),
            model=model,
            provider="gemini",
        )

    def _mock_complete(self, prompt: str, model: str, max_tokens: int) -> ProviderResponse:
        latency_map = {
            "gemini-2.5-flash": 900.0,
            "gemini-2.5-pro": 2000.0,
        }
        latency_ms = latency_map.get(model, 120.0)
        time.sleep(latency_ms / 1000)
        input_tokens = max(10, len(prompt.split()) * 4 // 3)
        output = f"[Mock Gemini · {model}] Responding to your {len(prompt.split())}-word prompt."
        return ProviderResponse(
            text=output,
            input_tokens=input_tokens,
            output_tokens=max(10, len(output.split()) * 4 // 3),
            latency_ms=round(latency_ms, 2),
            model=model,
            provider="gemini",
        )

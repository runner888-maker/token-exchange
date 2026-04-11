from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class ProviderResponse:
    text: str
    input_tokens: int
    output_tokens: int
    latency_ms: float
    model: str
    provider: str


class BaseProvider(ABC):
    @abstractmethod
    async def complete(
        self,
        prompt: str,
        model: str,
        max_tokens: int = 1024,
        system: Optional[str] = None,
    ) -> ProviderResponse:
        pass

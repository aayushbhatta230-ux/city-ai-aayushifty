"""FORGE AI Model Provider Adapter Base Interface."""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class ModelCompletionRequest(BaseModel):
    prompt: str
    system_prompt: Optional[str] = None
    temperature: float = 0.2
    max_tokens: int = 4096
    model_name: Optional[str] = None
    stop_sequences: List[str] = Field(default_factory=list)

class ModelCompletionResponse(BaseModel):
    content: str
    model_name: str
    provider_name: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    estimated_cost_usd: float = 0.0
    latency_ms: float = 0.0
    is_fallback: bool = False
    raw_metadata: Dict[str, Any] = Field(default_factory=dict)

class ModelProviderAdapter(ABC):
    """Abstract interface for all model providers (OpenAI, Gemini, Ollama, Mock)."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the provider (e.g. 'openai', 'gemini', 'ollama', 'mock')."""
        pass

    @abstractmethod
    async def is_available(self) -> bool:
        """Checks if the provider credentials and network/endpoint are reachable."""
        pass

    @abstractmethod
    async def generate(self, request: ModelCompletionRequest) -> ModelCompletionResponse:
        """Executes a model completion call."""
        pass

    @abstractmethod
    def estimate_cost(self, prompt_tokens: int, completion_tokens: int, model_name: str) -> float:
        """Estimates cost in USD for the given token consumption."""
        pass

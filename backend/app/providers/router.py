"""FORGE AI Model Routing Engine: Provider selection, fallbacks, and cost tracking."""

import logging
from typing import Dict, List, Optional
from app.providers.base import ModelProviderAdapter, ModelCompletionRequest, ModelCompletionResponse
from app.providers.mock_provider import MockModelProvider
from app.providers.openai_provider import OpenAIModelProvider
from app.providers.gemini_provider import GeminiModelProvider
from app.providers.ollama_provider import OllamaModelProvider

logger = logging.getLogger("forge.model_router")

class ModelRouter:
    """Intelligently routes inference requests across model providers with automated fallback."""

    def __init__(self):
        self._providers: Dict[str, ModelProviderAdapter] = {
            "mock": MockModelProvider(),
            "openai": OpenAIModelProvider(),
            "gemini": GeminiModelProvider(),
            "ollama": OllamaModelProvider(),
        }
        self.fallback_chain = ["openai", "gemini", "ollama", "mock"]

    def register_provider(self, name: str, provider: ModelProviderAdapter) -> None:
        self._providers[name] = provider

    def get_provider(self, name: str) -> Optional[ModelProviderAdapter]:
        return self._providers.get(name)

    async def get_available_providers(self) -> List[str]:
        available = []
        for name, provider in self._providers.items():
            try:
                if await provider.is_available():
                    available.append(name)
            except Exception:
                pass
        return available

    async def route_completion(
        self,
        request: ModelCompletionRequest,
        preferred_provider: Optional[str] = None
    ) -> ModelCompletionResponse:
        """Attempts generation with preferred provider, falling back down the resilience chain."""
        candidates = []
        if preferred_provider and preferred_provider in self._providers:
            candidates.append(preferred_provider)
            
        for p in self.fallback_chain:
            if p not in candidates and p in self._providers:
                candidates.append(p)

        last_error = None
        for i, provider_name in enumerate(candidates):
            provider = self._providers[provider_name]
            try:
                if not await provider.is_available():
                    logger.warning(f"Provider {provider_name} is not available, skipping.")
                    continue
                    
                response = await provider.generate(request)
                if i > 0 and preferred_provider and provider_name != preferred_provider:
                    response.is_fallback = True
                return response
            except Exception as e:
                logger.error(f"Provider {provider_name} failed: {e}. Attempting next fallback.")
                last_error = e

        logger.warning(f"All configured providers failed. Falling back to deterministic Mock provider. Error: {last_error}")
        mock_provider = self._providers["mock"]
        resp = await mock_provider.generate(request)
        resp.is_fallback = True
        return resp

model_router = ModelRouter()

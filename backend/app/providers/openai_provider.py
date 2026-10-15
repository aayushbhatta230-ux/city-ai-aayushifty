"""FORGE AI OpenAI & Compatible Provider Adapter."""

import os
import time
from typing import Optional
import httpx
from app.providers.base import ModelProviderAdapter, ModelCompletionRequest, ModelCompletionResponse
from app.core.security import SecurityEngine

class OpenAIModelProvider(ModelProviderAdapter):
    """Adapter for OpenAI, Azure OpenAI, or any OpenAI-compatible API endpoint."""

    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://api.openai.com/v1"):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.base_url = base_url.rstrip("/")

    @property
    def provider_name(self) -> str:
        return "openai"

    async def is_available(self) -> bool:
        return bool(self.api_key)

    def estimate_cost(self, prompt_tokens: int, completion_tokens: int, model_name: str) -> float:
        input_cost = (prompt_tokens / 1_000_000.0) * 2.50
        output_cost = (completion_tokens / 1_000_000.0) * 10.00
        return round(input_cost + output_cost, 6)

    async def generate(self, request: ModelCompletionRequest) -> ModelCompletionResponse:
        if not self.api_key:
            raise ValueError("OpenAI API key is missing or not configured")

        start = time.perf_counter()
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        messages = []
        if request.system_prompt:
            messages.append({"role": "system", "content": request.system_prompt})
        messages.append({"role": "user", "content": request.prompt})

        payload = {
            "model": request.model_name or "gpt-4o",
            "messages": messages,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()

        choice = data["choices"][0]
        content = choice["message"]["content"]
        usage = data.get("usage", {})
        p_tokens = usage.get("prompt_tokens", 0)
        c_tokens = usage.get("completion_tokens", 0)
        cost = self.estimate_cost(p_tokens, c_tokens, payload["model"])
        latency = (time.perf_counter() - start) * 1000.0

        return ModelCompletionResponse(
            content=SecurityEngine.redact_secrets(content),
            model_name=payload["model"],
            provider_name=self.provider_name,
            prompt_tokens=p_tokens,
            completion_tokens=c_tokens,
            estimated_cost_usd=cost,
            latency_ms=latency,
            is_fallback=False,
            raw_metadata={"id": data.get("id")}
        )

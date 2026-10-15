"""FORGE AI Local Ollama Provider Adapter."""

import time
import httpx
from app.providers.base import ModelProviderAdapter, ModelCompletionRequest, ModelCompletionResponse
from app.core.security import SecurityEngine

class OllamaModelProvider(ModelProviderAdapter):
    """Adapter for locally hosted Ollama instances."""

    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url.rstrip("/")

    @property
    def provider_name(self) -> str:
        return "ollama"

    async def is_available(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                return res.status_code == 200
        except Exception:
            return False

    def estimate_cost(self, prompt_tokens: int, completion_tokens: int, model_name: str) -> float:
        return 0.0

    async def generate(self, request: ModelCompletionRequest) -> ModelCompletionResponse:
        start = time.perf_counter()
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": request.model_name or "llama3",
            "prompt": f"{request.system_prompt}\n\n{request.prompt}" if request.system_prompt else request.prompt,
            "stream": False,
            "options": {
                "temperature": request.temperature,
                "num_predict": request.max_tokens
            }
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()

        content = data.get("response", "")
        p_tokens = data.get("prompt_eval_count", len(request.prompt.split()))
        c_tokens = data.get("eval_count", len(content.split()))
        latency = (time.perf_counter() - start) * 1000.0

        return ModelCompletionResponse(
            content=SecurityEngine.redact_secrets(content),
            model_name=payload["model"],
            provider_name=self.provider_name,
            prompt_tokens=p_tokens,
            completion_tokens=c_tokens,
            estimated_cost_usd=0.0,
            latency_ms=latency,
            is_fallback=False
        )

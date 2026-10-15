"""FORGE AI Deterministic Mock Provider for Testing & Offline Evaluation."""

import time
import json
from app.providers.base import ModelProviderAdapter, ModelCompletionRequest, ModelCompletionResponse

class MockModelProvider(ModelProviderAdapter):
    """Provides high-fidelity, deterministic completions for offline execution and tests."""

    @property
    def provider_name(self) -> str:
        return "mock"

    async def is_available(self) -> bool:
        return True

    def estimate_cost(self, prompt_tokens: int, completion_tokens: int, model_name: str) -> float:
        return 0.0

    async def generate(self, request: ModelCompletionRequest) -> ModelCompletionResponse:
        start = time.perf_counter()
        prompt_lower = request.prompt.lower()
        system_lower = (request.system_prompt or "").lower()

        if "product analyst" in system_lower or "specification" in prompt_lower:
            content = json.dumps({
                "summary": "Verified Product Specification for Target Application",
                "features": [
                    {"name": "Core Entity Management", "priority": "P0", "criteria": "CRUD operations with schema validation"},
                    {"name": "Automated Validation", "priority": "P0", "criteria": "Full test suite pass with zero regressions"}
                ],
                "acceptance_criteria": [
                    "All core endpoints and interfaces pass automated tests",
                    "Security policies prevent unauthorized access"
                ]
            }, indent=2)
        elif "architect" in system_lower or "task decomposition" in prompt_lower:
            content = json.dumps({
                "architecture_overview": "Modular architecture with isolated domain boundaries and SQLite storage.",
                "tasks": [
                    {
                        "title": "Build Core Domain Models",
                        "objective": "Define entities, data schemas, and validation rules.",
                        "assigned_role": "implementation_agent",
                        "dependencies": [],
                        "acceptance_criteria": ["Entity definitions load without syntax errors", "Pydantic models validate valid inputs"]
                    },
                    {
                        "title": "Implement Unit & Integration Tests",
                        "objective": "Write comprehensive automated tests for domain models.",
                        "assigned_role": "testing_agent",
                        "dependencies": ["Build Core Domain Models"],
                        "acceptance_criteria": ["Pytest runs with 100% pass rate"]
                    }
                ]
            }, indent=2)
        elif "debugger" in system_lower or "repair" in prompt_lower or "root cause" in prompt_lower:
            target_file = "src/core.py" if "src" in prompt_lower else "app/core.py"
            content = json.dumps({
                "diagnosis": "Identified syntax error or unmet assertion in test execution.",
                "root_cause": "Missing return statement or incorrect comparison operator.",
                "patch_plan": "Update implementation to return verified result and satisfy assertions.",
                "file_updates": [
                    {"file_path": target_file, "content": "# Fixed implementation\ndef run_core():\n    return {'status': 'success'}\n"}
                ]
            }, indent=2)
        elif "reviewer" in system_lower or "code review" in prompt_lower:
            content = json.dumps({
                "approved": True,
                "confidence_score": 0.95,
                "security_findings": [],
                "maintainability_notes": "Code is clean, well-typed, and satisfies acceptance criteria."
            }, indent=2)
        else:
            content = json.dumps({
                "status": "success",
                "message": "Task completed deterministically by FORGE mock engine.",
                "files_generated": [
                    {"path": "solution.py", "content": "# Generated solution\ndef solution():\n    return 42\n"}
                ]
            }, indent=2)

        p_tokens = len(request.prompt.split())
        c_tokens = len(content.split())
        latency = (time.perf_counter() - start) * 1000.0

        return ModelCompletionResponse(
            content=content,
            model_name=request.model_name or "forge-mock-v1",
            provider_name=self.provider_name,
            prompt_tokens=p_tokens,
            completion_tokens=c_tokens,
            estimated_cost_usd=0.0,
            latency_ms=latency,
            is_fallback=False,
            raw_metadata={"mock": True}
        )

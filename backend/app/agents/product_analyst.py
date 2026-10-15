"""FORGE AI Product Analyst Agent: Requirements Extraction & Acceptance Criteria."""

from typing import Dict, Any, List
from app.models.schemas import AgentRole
from app.agents.base import BaseAgent
from app.providers.base import ModelCompletionRequest

class ProductAnalystAgent(BaseAgent):
    """Converts high-level software ideas into structured specifications with testable criteria."""

    def __init__(self, router):
        super().__init__(AgentRole.PRODUCT_ANALYST, router)

    async def analyze_project(self, prompt: str) -> Dict[str, Any]:
        user_prompt = f"""
Analyze the following project request and generate a complete, structured engineering specification.
REQUEST:
"{prompt}"

Respond in JSON with the exact structure:
{{
  "summary": "Concise summary of the platform",
  "target_users": ["User roles"],
  "features": [
    {{"name": "Feature Name", "priority": "P0/P1", "criteria": "Observable behavior requirement"}}
  ],
  "acceptance_criteria": [
    "Testable criterion 1",
    "Testable criterion 2"
  ]
}}
"""
        req = ModelCompletionRequest(
            prompt=user_prompt,
            system_prompt=self.system_prompt,
            temperature=0.2
        )
        resp = await self.router.route_completion(req)
        return self.extract_json(resp.content)

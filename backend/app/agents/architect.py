"""FORGE AI Software Architect Agent: Architecture Design & Task Decomposition."""

from typing import Dict, Any, List
from app.models.schemas import AgentRole
from app.agents.base import BaseAgent
from app.providers.base import ModelCompletionRequest

class ArchitectAgent(BaseAgent):
    """Designs modular component systems and decomposes projects into a verifiable DAG."""

    def __init__(self, router):
        super().__init__(AgentRole.SOFTWARE_ARCHITECT, router)

    async def design_and_decompose(self, prd: Dict[str, Any], project_id: str) -> Dict[str, Any]:
        user_prompt = f"""
Given the following Product Specification:
{prd}

Design the system architecture and break it down into an ordered, dependent task DAG.
Respond in valid JSON with:
{{
  "architecture_overview": "Component and storage architecture description",
  "data_models": ["Model descriptions and schemas"],
  "tasks": [
    {{
      "title": "Task title",
      "objective": "Clear technical objective",
      "assigned_role": "implementation_agent | testing_agent | documentation_agent",
      "dependencies": ["Prerequisite task titles"],
      "acceptance_criteria": ["Observable testable criteria"]
    }}
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

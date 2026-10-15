"""FORGE AI Base Agent Definitions & Structured JSON Extraction."""

import json
import re
from typing import Dict, Any, Optional
from app.models.schemas import AgentRole
from app.providers.base import ModelCompletionRequest
from app.providers.router import ModelRouter

class AgentException(Exception):
    pass

class BaseAgent:
    """Base class for specialized agent capabilities with resilient JSON extraction."""

    def __init__(self, role: AgentRole, router: ModelRouter):
        self.role = role
        self.router = router

    @property
    def system_prompt(self) -> str:
        return f"You are the FORGE AI {self.role.value}. Follow engineering discipline, verify boundaries, and respond in valid JSON format."

    def extract_json(self, text: str) -> Dict[str, Any]:
        """Extracts JSON object from text, handling markdown fences or preamble."""
        text = text.strip()
        # Remove markdown code blocks if wrapped
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            text = match.group(1).strip()
            
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Try to find first { and last }
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1 and end > start:
                try:
                    return json.loads(text[start:end+1])
                except Exception:
                    pass
            raise AgentException(f"Failed to parse valid JSON from agent response: {text[:200]}")

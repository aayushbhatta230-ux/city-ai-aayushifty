"""FORGE AI Implementation, Testing, Debugging, Reviewer, and Documentation Agents."""

from typing import Dict, Any, List
from app.models.schemas import AgentRole, Task
from app.agents.base import BaseAgent
from app.providers.base import ModelCompletionRequest
from app.execution.workspace import WorkspaceManager

class ImplementationAgent(BaseAgent):
    """Writes, edits, and refactors source code within the workspace jail."""

    def __init__(self, router):
        super().__init__(AgentRole.IMPLEMENTATION_AGENT, router)

    async def execute_task(self, task: Task, workspace: WorkspaceManager, memory_context: str) -> Dict[str, Any]:
        existing_files = workspace.list_files()
        user_prompt = f"""
PROJECT CONTEXT & CONSTRAINTS:
{memory_context}

TASK TITLE: {task.title}
OBJECTIVE: {task.objective}
ACCEPTANCE CRITERIA:
{task.acceptance_criteria}

EXISTING REPO FILES: {existing_files}

Generate or modify the required source files to fulfill this objective.
Respond in valid JSON with:
{{
  "summary": "Summary of changes",
  "files": [
    {{"path": "relative/file/path.py", "content": "Full source code here"}}
  ]
}}
"""
        req = ModelCompletionRequest(
            prompt=user_prompt,
            system_prompt=self.system_prompt,
            temperature=0.1
        )
        resp = await self.router.route_completion(req)
        data = self.extract_json(resp.content)
        
        # Apply changes to workspace
        for f in data.get("files", []):
            workspace.write_file(f["path"], f["content"])
            
        workspace.commit_changes(f"feat: {task.title}")
        return data


class TestingAgent(BaseAgent):
    """Generates automated test suites (pytest/unittest) based on acceptance criteria."""

    def __init__(self, router):
        super().__init__(AgentRole.TESTING_AGENT, router)

    async def generate_tests(self, task: Task, workspace: WorkspaceManager) -> Dict[str, Any]:
        existing_files = workspace.list_files()
        user_prompt = f"""
TASK TITLE: {task.title}
OBJECTIVE: {task.objective}
ACCEPTANCE CRITERIA:
{task.acceptance_criteria}

EXISTING REPO FILES: {existing_files}

Write comprehensive automated unit/integration tests for these acceptance criteria.
Respond in valid JSON with:
{{
  "test_framework": "pytest",
  "test_command": "pytest -v",
  "files": [
    {{"path": "tests/test_feature.py", "content": "Full pytest test code"}}
  ]
}}
"""
        req = ModelCompletionRequest(
            prompt=user_prompt,
            system_prompt=self.system_prompt,
            temperature=0.1
        )
        resp = await self.router.route_completion(req)
        data = self.extract_json(resp.content)

        for f in data.get("files", []):
            workspace.write_file(f["path"], f["content"])

        workspace.commit_changes(f"test: add tests for {task.title}")
        return data


class ReviewerAgent(BaseAgent):
    """Independently evaluates diffs, code security, and acceptance criteria compliance."""

    def __init__(self, router):
        super().__init__(AgentRole.INDEPENDENT_REVIEWER, router)

    async def review_changes(self, task: Task, git_diff: str) -> Dict[str, Any]:
        user_prompt = f"""
TASK OBJECTIVE: {task.objective}
ACCEPTANCE CRITERIA: {task.acceptance_criteria}

GIT DIFF:
{git_diff or "No uncommitted diff (changes already staged/committed)."}

Review this work for correctness, maintainability, security, and criteria compliance.
Respond in valid JSON:
{{
  "approved": true,
  "confidence_score": 0.95,
  "security_findings": [],
  "maintainability_notes": "Clean modular code."
}}
"""
        req = ModelCompletionRequest(
            prompt=user_prompt,
            system_prompt=self.system_prompt,
            temperature=0.1
        )
        resp = await self.router.route_completion(req)
        return self.extract_json(resp.content)


class DocumentationAgent(BaseAgent):
    """Maintains setup documentation, API specifications, and release notes."""

    def __init__(self, router):
        super().__init__(AgentRole.DOCUMENTATION_AGENT, router)

    async def generate_docs(self, project_name: str, workspace: WorkspaceManager) -> Dict[str, Any]:
        files = workspace.list_files()
        user_prompt = f"""
PROJECT NAME: {project_name}
PROJECT FILES: {files}

Generate comprehensive setup and architecture documentation.
Respond in JSON:
{{
  "files": [
    {{"path": "docs/SYSTEM_GUIDE.md", "content": "# System Guide..."}}
  ]
}}
"""
        req = ModelCompletionRequest(
            prompt=user_prompt,
            system_prompt=self.system_prompt,
            temperature=0.2
        )
        resp = await self.router.route_completion(req)
        data = self.extract_json(resp.content)
        for f in data.get("files", []):
            workspace.write_file(f["path"], f["content"])
        workspace.commit_changes("docs: update system documentation")
        return data

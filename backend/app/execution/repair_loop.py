"""FORGE AI Automated Repair Loop: Bounded Failure Recovery & Regression Verification."""

import json
from pathlib import Path
from typing import Dict, Any, Optional

from app.models.schemas import Task, TaskState, VerificationEvidence
from app.execution.workspace import WorkspaceManager
from app.execution.verifier import VerifierEngine
from app.providers.router import model_router
from app.providers.base import ModelCompletionRequest

class RepairLoopEngine:
    """Orchestrates bounded self-healing attempts when tasks fail verification."""

    @classmethod
    async def attempt_repair(
        cls,
        task: Task,
        workspace: WorkspaceManager,
        initial_evidence: VerificationEvidence,
        test_command: str = "pytest -v",
        max_attempts: int = 3
    ) -> VerificationEvidence:
        current_evidence = initial_evidence
        attempt = 0

        while attempt < max_attempts and current_evidence.exit_code != 0:
            attempt += 1
            repair_prompt = f"""
The automated test suite failed with exit code {current_evidence.exit_code}.
TASK OBJECTIVE: {task.objective}
ACCEPTANCE CRITERIA: {task.acceptance_criteria}
FAILED TESTS: {current_evidence.failed_tests}
WORKSPACE FILES: {workspace.list_files()}
ERROR LOGS:
{current_evidence.output_snippet}

Please analyze the root cause and provide a targeted JSON patch to fix the issue.
Respond in valid JSON with:
{{
  "diagnosis": "Short explanation of failure",
  "root_cause": "Specific bug cause",
  "file_updates": [
    {{"file_path": "path/relative/to/workspace.py", "content": "fixed full code"}}
  ]
}}
"""
            req = ModelCompletionRequest(
                prompt=repair_prompt,
                system_prompt="You are the FORGE AI Debugging Agent. Provide minimal, robust, regression-free code patches.",
                temperature=0.1
            )
            response = await model_router.route_completion(req, preferred_provider="mock")

            try:
                data = json.loads(response.content)
                updates = data.get("file_updates", [])
                for item in updates:
                    fpath = item.get("file_path")
                    content = item.get("content")
                    if fpath and content:
                        workspace.write_file(fpath, content)
                workspace.commit_changes(f"Automated repair attempt {attempt} for task {task.id}")
            except Exception:
                # If model returned non-JSON, continue or break
                pass

            # Re-verify after patch
            current_evidence = await VerifierEngine.verify_workspace(
                workspace_path=workspace.root,
                test_command=test_command
            )

        return current_evidence

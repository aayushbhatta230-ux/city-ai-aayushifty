"""FORGE AI Master Orchestration Engine: Dependency Scheduling & Autonomous Execution."""

import uuid
from typing import List, Dict, Optional, Any
from app.models.schemas import (
    Project, Task, TaskCreate, TaskState, AgentRole, ProjectStatus, TaskRun,
    VerificationEvidence, ApprovalRequest
)
from app.models.database import Database
from app.core.state_machine import StateMachineValidator
from app.core.event_bus import event_bus, ForgeEvent
from app.execution.workspace import WorkspaceManager
from app.execution.verifier import VerifierEngine
from app.execution.repair_loop import RepairLoopEngine
from app.memory.project_memory import ProjectMemoryStore
from app.budget.manager import BudgetManager
from app.providers.router import model_router

from app.agents.product_analyst import ProductAnalystAgent
from app.agents.architect import ArchitectAgent
from app.agents.specialized import (
    ImplementationAgent, TestingAgent, ReviewerAgent, DocumentationAgent
)

class Orchestrator:
    """The central coordinator managing task DAGs, agent dispatches, verification gates, and repair."""

    def __init__(self, db: Database, workspace_root: str):
        self.db = db
        self.workspace = WorkspaceManager(workspace_root)
        self.memory = ProjectMemoryStore(db)
        self.budget = BudgetManager(db)
        
        # Instantiate agents
        self.analyst = ProductAnalystAgent(model_router)
        self.architect = ArchitectAgent(model_router)
        self.implementer = ImplementationAgent(model_router)
        self.tester = TestingAgent(model_router)
        self.reviewer = ReviewerAgent(model_router)
        self.documenter = DocumentationAgent(model_router)

    async def initialize_project_pipeline(self, project: Project, prompt: str) -> Dict[str, Any]:
        """Step 1 & 2: Analyzes product request and decomposes it into a verifiable task DAG."""
        self.budget.check_can_execute(project.id)

        # 1. Product Analysis
        await event_bus.publish(ForgeEvent(
            event_id=uuid.uuid4().hex,
            topic=f"project:{project.id}:status",
            payload={"message": "Product Analyst analyzing requirements...", "step": "SPECIFICATION"}
        ))
        prd = await self.analyst.analyze_project(prompt)
        
        # Record PRD in memory
        self.memory.record_adr(
            project.id,
            title="Initial Product Specification",
            decision=prd.get("summary", "PRD generated"),
            rationale="User submitted idea analyzed into structured requirements"
        )

        # 2. Architectural Design & Task Decomposition
        await event_bus.publish(ForgeEvent(
            event_id=uuid.uuid4().hex,
            topic=f"project:{project.id}:status",
            payload={"message": "Software Architect decomposing system into tasks...", "step": "ARCHITECTURE"}
        ))
        arch_data = await self.architect.design_and_decompose(prd, project.id)

        created_tasks = []
        raw_tasks = arch_data.get("tasks", [])
        
        # If model returned no tasks, provide sensible defaults
        if not raw_tasks:
            raw_tasks = [
                {
                    "title": "Build Core Entities and Validation",
                    "objective": "Implement domain entities with strict typing and input validation.",
                    "assigned_role": "implementation_agent",
                    "dependencies": [],
                    "acceptance_criteria": ["All models parse valid data", "Type safety enforced"]
                },
                {
                    "title": "Automated Unit Tests",
                    "objective": "Verify entity functionality and edge cases.",
                    "assigned_role": "testing_agent",
                    "dependencies": ["Build Core Entities and Validation"],
                    "acceptance_criteria": ["Pytest suite passes with 0 failures"]
                }
            ]

        # Map title to generated task_id
        title_to_id: Dict[str, str] = {}
        for item in raw_tasks:
            t_id = f"task-{uuid.uuid4().hex[:8]}"
            title_to_id[item["title"]] = t_id

        for item in raw_tasks:
            dep_ids = [title_to_id[dep] for dep in item.get("dependencies", []) if dep in title_to_id]
            role = AgentRole.IMPLEMENTATION_AGENT
            try:
                role = AgentRole(item.get("assigned_role", "implementation_agent"))
            except Exception:
                pass

            task = Task(
                id=title_to_id[item["title"]],
                project_id=project.id,
                title=item["title"],
                objective=item["objective"],
                assigned_role=role,
                state=TaskState.QUEUED,
                dependencies=dep_ids,
                acceptance_criteria=item.get("acceptance_criteria", []),
                retry_count=0,
                max_retries=3
            )
            self.db.create_task(task)
            created_tasks.append(task)

        self.db.update_project_status(project.id, ProjectStatus.RUNNING)
        return {"prd": prd, "architecture": arch_data, "tasks": created_tasks}

    async def execute_task(self, task: Task) -> Task:
        """Executes a single task through the strict state machine and verification gate."""
        self.budget.check_can_execute(task.project_id)

        # Transition: QUEUED -> READY -> RUNNING
        StateMachineValidator.validate_transition(task.state, TaskState.READY)
        self.db.update_task_state(task.id, TaskState.READY)
        task.state = TaskState.READY

        StateMachineValidator.validate_transition(task.state, TaskState.RUNNING)
        self.db.update_task_state(task.id, TaskState.RUNNING)
        task.state = TaskState.RUNNING

        await event_bus.publish(ForgeEvent(
            event_id=uuid.uuid4().hex,
            topic=f"task:{task.id}:state",
            payload={"state": "RUNNING", "title": task.title, "role": task.assigned_role.value}
        ))

        # Dispatch to assigned agent
        memory_ctx = self.memory.get_context_summary(task.project_id)
        result_summary = "Executed task successfully."

        if task.assigned_role == AgentRole.IMPLEMENTATION_AGENT:
            data = await self.implementer.execute_task(task, self.workspace, memory_ctx)
            result_summary = data.get("summary", "Implementation changes applied.")
        elif task.assigned_role == AgentRole.TESTING_AGENT:
            data = await self.tester.generate_tests(task, self.workspace)
            result_summary = "Automated test suite created."
        elif task.assigned_role == AgentRole.DOCUMENTATION_AGENT:
            data = await self.documenter.generate_docs(task.project_id, self.workspace)
            result_summary = "System documentation generated."

        # Transition: RUNNING -> VERIFYING
        StateMachineValidator.validate_transition(task.state, TaskState.VERIFYING)
        self.db.update_task_state(task.id, TaskState.VERIFYING, result_summary=result_summary)
        task.state = TaskState.VERIFYING

        await event_bus.publish(ForgeEvent(
            event_id=uuid.uuid4().hex,
            topic=f"task:{task.id}:state",
            payload={"state": "VERIFYING", "title": task.title}
        ))

        # Verification Gate
        evidence = await VerifierEngine.verify_workspace(self.workspace.root, test_command="pytest -v")

        # If tests failed, trigger the automated repair loop
        if evidence.exit_code != 0:
            evidence = await RepairLoopEngine.attempt_repair(
                task=task,
                workspace=self.workspace,
                initial_evidence=evidence,
                test_command="pytest -v",
                max_attempts=task.max_retries
            )

        task.verification = evidence

        # Final Verification Check: Only transition to COMPLETED if exit_code == 0
        if evidence.exit_code == 0:
            StateMachineValidator.validate_transition(task.state, TaskState.COMPLETED, has_verification_evidence=True)
            self.db.update_task_state(task.id, TaskState.COMPLETED, verification=evidence)
            task.state = TaskState.COMPLETED
            
            # Review step
            diff = self.workspace.get_git_diff()
            await self.reviewer.review_changes(task, diff)

            await event_bus.publish(ForgeEvent(
                event_id=uuid.uuid4().hex,
                topic=f"task:{task.id}:state",
                payload={"state": "COMPLETED", "title": task.title, "evidence": evidence.model_dump()}
            ))
        else:
            StateMachineValidator.validate_transition(task.state, TaskState.FAILED)
            self.db.update_task_state(task.id, TaskState.FAILED, verification=evidence)
            task.state = TaskState.FAILED

            await event_bus.publish(ForgeEvent(
                event_id=uuid.uuid4().hex,
                topic=f"task:{task.id}:state",
                payload={"state": "FAILED", "title": task.title, "evidence": evidence.model_dump()}
            ))

        return task

    async def run_pipeline(self, project: Project, prompt: str) -> Dict[str, Any]:
        """Runs the entire pipeline sequentially adhering to task dependencies."""
        init_res = await self.initialize_project_pipeline(project, prompt)
        tasks = init_res["tasks"]

        completed_ids = set()
        executed_tasks = []

        while len(completed_ids) < len(tasks):
            # Find next ready task whose dependencies are satisfied
            ready_task = None
            for t in tasks:
                if t.id not in completed_ids:
                    # check if all dependencies are in completed_ids
                    if all(dep in completed_ids for dep in t.dependencies):
                        ready_task = t
                        break

            if not ready_task:
                # Deadlock or cyclic dependency fallback
                break

            result_task = await self.execute_task(ready_task)
            executed_tasks.append(result_task)
            
            if result_task.state == TaskState.COMPLETED:
                completed_ids.add(result_task.id)
            else:
                # Task failed - mark project failed and halt
                self.db.update_project_status(project.id, ProjectStatus.FAILED)
                return {
                    "status": "FAILED",
                    "failed_task": result_task,
                    "completed_tasks": list(completed_ids),
                    "total_tasks": len(tasks)
                }

        self.db.update_project_status(project.id, ProjectStatus.COMPLETED)
        return {
            "status": "COMPLETED",
            "completed_tasks": list(completed_ids),
            "total_tasks": len(tasks),
            "workspace_files": self.workspace.list_files()
        }

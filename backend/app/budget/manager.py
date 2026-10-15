"""FORGE AI Budget & Cost Management Engine."""

from app.models.schemas import BudgetStatus, Project
from app.models.database import Database

class BudgetExceededError(Exception):
    """Raised when an operation would exceed configured spending or token thresholds."""
    pass

class EmergencyStopActiveError(Exception):
    """Raised when task scheduling or execution is halted by the global emergency stop."""
    pass

class BudgetManager:
    """Monitors token usage, dollar spend, and enforces hard execution stop limits."""

    def __init__(self, db: Database):
        self.db = db

    def check_can_execute(self, project_id: str, estimated_cost_usd: float = 0.0) -> None:
        if self.db.is_emergency_stopped():
            raise EmergencyStopActiveError("Global Emergency Stop is active. Execution halted.")

        project = self.db.get_project(project_id)
        if not project:
            return

        if (project.spent_usd + estimated_cost_usd) > project.budget_limit_usd:
            raise BudgetExceededError(
                f"Project {project_id} spend limit (${project.budget_limit_usd:.2f}) reached or exceeded."
            )

    def record_usage(self, project_id: str, cost_usd: float, tokens: int) -> None:
        self.db.record_project_spend(project_id, cost_usd, tokens)

    def trigger_emergency_stop(self) -> None:
        self.db.set_emergency_stop(True)

    def resume_emergency_stop(self) -> None:
        self.db.set_emergency_stop(False)

    def get_budget_status(self, project_id: str) -> BudgetStatus:
        project = self.db.get_project(project_id)
        if not project:
            return BudgetStatus(
                project_id=project_id,
                allocated_usd=0.0,
                consumed_usd=0.0,
                total_tokens=0,
                is_emergency_stopped=self.db.is_emergency_stopped()
            )
        return BudgetStatus(
            project_id=project_id,
            allocated_usd=project.budget_limit_usd,
            consumed_usd=project.spent_usd,
            total_tokens=project.total_tokens,
            is_emergency_stopped=self.db.is_emergency_stopped()
        )

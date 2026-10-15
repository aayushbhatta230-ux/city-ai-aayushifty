"""FORGE AI Persistent Database Layer using SQLite."""

import sqlite3
import json
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from app.models.schemas import (
    Project, ProjectStatus, Task, TaskCreate, TaskRun, TaskState, AgentRole,
    VerificationEvidence, ApprovalRequest, ApprovalStatus, ProjectMemoryEntry,
    MemoryCategory
)

class Database:
    """Thread-safe SQLite repository for persistent project and task records."""

    def __init__(self, db_path: Path):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), timeout=20.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode = WAL")
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def _init_schema(self) -> None:
        with self._get_connection() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL,
                    workspace_dir TEXT NOT NULL,
                    status TEXT NOT NULL,
                    budget_limit_usd REAL DEFAULT 25.0,
                    spent_usd REAL DEFAULT 0.0,
                    total_tokens INTEGER DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS tasks (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                    title TEXT NOT NULL,
                    objective TEXT NOT NULL,
                    assigned_role TEXT NOT NULL,
                    state TEXT NOT NULL,
                    dependencies_json TEXT NOT NULL DEFAULT '[]',
                    acceptance_criteria_json TEXT NOT NULL DEFAULT '[]',
                    retry_count INTEGER DEFAULT 0,
                    max_retries INTEGER DEFAULT 3,
                    timeout_seconds INTEGER DEFAULT 300,
                    result_summary TEXT,
                    verification_json TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS task_runs (
                    run_id TEXT PRIMARY KEY,
                    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                    agent_role TEXT NOT NULL,
                    model_used TEXT NOT NULL,
                    start_time TEXT NOT NULL,
                    end_time TEXT,
                    status TEXT NOT NULL,
                    prompt_tokens INTEGER DEFAULT 0,
                    completion_tokens INTEGER DEFAULT 0,
                    estimated_cost_usd REAL DEFAULT 0.0,
                    logs_json TEXT NOT NULL DEFAULT '[]',
                    error_message TEXT
                );

                CREATE TABLE IF NOT EXISTS approvals (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                    task_id TEXT,
                    action_type TEXT NOT NULL,
                    description TEXT NOT NULL,
                    status TEXT NOT NULL,
                    requested_at TEXT NOT NULL,
                    decided_at TEXT,
                    decision_note TEXT
                );

                CREATE TABLE IF NOT EXISTS memory_entries (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                    category TEXT NOT NULL,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    tags_json TEXT NOT NULL DEFAULT '[]',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS system_state (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
            """)

    # --- Project Operations ---

    def create_project(self, project: Project) -> Project:
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO projects (
                    id, name, description, workspace_dir, status,
                    budget_limit_usd, spent_usd, total_tokens, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    project.id, project.name, project.description, project.workspace_dir,
                    project.status.value, project.budget_limit_usd, project.spent_usd,
                    project.total_tokens, project.created_at.isoformat(), project.updated_at.isoformat()
                )
            )
        return project

    def get_project(self, project_id: str) -> Optional[Project]:
        with self._get_connection() as conn:
            row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
            if not row:
                return None
            return Project(
                id=row["id"],
                name=row["name"],
                description=row["description"],
                workspace_dir=row["workspace_dir"],
                status=ProjectStatus(row["status"]),
                budget_limit_usd=row["budget_limit_usd"],
                spent_usd=row["spent_usd"],
                total_tokens=row["total_tokens"],
                created_at=datetime.fromisoformat(row["created_at"]),
                updated_at=datetime.fromisoformat(row["updated_at"])
            )

    def list_projects(self) -> List[Project]:
        with self._get_connection() as conn:
            rows = conn.execute("SELECT * FROM projects ORDER BY created_at DESC").fetchall()
            return [
                Project(
                    id=r["id"],
                    name=r["name"],
                    description=r["description"],
                    workspace_dir=r["workspace_dir"],
                    status=ProjectStatus(r["status"]),
                    budget_limit_usd=r["budget_limit_usd"],
                    spent_usd=r["spent_usd"],
                    total_tokens=r["total_tokens"],
                    created_at=datetime.fromisoformat(r["created_at"]),
                    updated_at=datetime.fromisoformat(r["updated_at"])
                )
                for r in rows
            ]

    def update_project_status(self, project_id: str, status: ProjectStatus) -> None:
        with self._get_connection() as conn:
            conn.execute(
                "UPDATE projects SET status = ?, updated_at = ? WHERE id = ?",
                (status.value, datetime.now(timezone.utc).isoformat(), project_id)
            )

    def record_project_spend(self, project_id: str, cost_usd: float, tokens: int) -> None:
        with self._get_connection() as conn:
            conn.execute(
                """
                UPDATE projects 
                SET spent_usd = spent_usd + ?, total_tokens = total_tokens + ?, updated_at = ?
                WHERE id = ?
                """,
                (cost_usd, tokens, datetime.now(timezone.utc).isoformat(), project_id)
            )

    # --- Task Operations ---

    def create_task(self, task: Task) -> Task:
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO tasks (
                    id, project_id, title, objective, assigned_role, state,
                    dependencies_json, acceptance_criteria_json, retry_count,
                    max_retries, timeout_seconds, result_summary, verification_json,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    task.id, task.project_id, task.title, task.objective,
                    task.assigned_role.value, task.state.value,
                    json.dumps(task.dependencies), json.dumps(task.acceptance_criteria),
                    task.retry_count, task.max_retries, task.timeout_seconds,
                    task.result_summary,
                    json.dumps(task.verification.model_dump()) if task.verification else None,
                    task.created_at.isoformat(), task.updated_at.isoformat()
                )
            )
        return task

    def get_task(self, task_id: str) -> Optional[Task]:
        with self._get_connection() as conn:
            row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
            if not row:
                return None
            return self._row_to_task(row)

    def list_tasks_for_project(self, project_id: str) -> List[Task]:
        with self._get_connection() as conn:
            rows = conn.execute("SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at ASC", (project_id,)).fetchall()
            return [self._row_to_task(r) for r in rows]

    def update_task_state(
        self,
        task_id: str,
        state: TaskState,
        result_summary: Optional[str] = None,
        verification: Optional[VerificationEvidence] = None,
        increment_retry: bool = False
    ) -> None:
        with self._get_connection() as conn:
            now = datetime.now(timezone.utc).isoformat()
            if increment_retry:
                conn.execute("UPDATE tasks SET retry_count = retry_count + 1 WHERE id = ?", (task_id,))
                
            updates = ["state = ?", "updated_at = ?"]
            params: List[Any] = [state.value, now]
            
            if result_summary is not None:
                updates.append("result_summary = ?")
                params.append(result_summary)
                
            if verification is not None:
                updates.append("verification_json = ?")
                params.append(json.dumps(verification.model_dump(), default=str))
                
            params.append(task_id)
            query = f"UPDATE tasks SET {', '.join(updates)} WHERE id = ?"
            conn.execute(query, params)

    def _row_to_task(self, row: sqlite3.Row) -> Task:
        verif = None
        if row["verification_json"]:
            try:
                v_data = json.loads(row["verification_json"])
                verif = VerificationEvidence(
                    test_suite=v_data.get("test_suite", ""),
                    exit_code=v_data.get("exit_code", 0),
                    passed_tests=v_data.get("passed_tests", 0),
                    failed_tests=v_data.get("failed_tests", 0),
                    output_snippet=v_data.get("output_snippet", "")
                )
            except Exception:
                pass
        return Task(
            id=row["id"],
            project_id=row["project_id"],
            title=row["title"],
            objective=row["objective"],
            assigned_role=AgentRole(row["assigned_role"]),
            state=TaskState(row["state"]),
            dependencies=json.loads(row["dependencies_json"]),
            acceptance_criteria=json.loads(row["acceptance_criteria_json"]),
            retry_count=row["retry_count"],
            max_retries=row["max_retries"],
            timeout_seconds=row["timeout_seconds"],
            result_summary=row["result_summary"],
            verification=verif,
            created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"])
        )

    # --- Task Run Operations ---

    def record_task_run(self, run: TaskRun) -> None:
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO task_runs (
                    run_id, task_id, agent_role, model_used, start_time, end_time,
                    status, prompt_tokens, completion_tokens, estimated_cost_usd,
                    logs_json, error_message
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    run.run_id, run.task_id, run.agent_role.value, run.model_used,
                    run.start_time.isoformat(),
                    run.end_time.isoformat() if run.end_time else None,
                    run.status, run.prompt_tokens, run.completion_tokens,
                    run.estimated_cost_usd, json.dumps(run.logs), run.error_message
                )
            )

    def get_task_runs(self, task_id: str) -> List[TaskRun]:
        with self._get_connection() as conn:
            rows = conn.execute("SELECT * FROM task_runs WHERE task_id = ? ORDER BY start_time ASC", (task_id,)).fetchall()
            return [
                TaskRun(
                    run_id=r["run_id"],
                    task_id=r["task_id"],
                    agent_role=AgentRole(r["agent_role"]),
                    model_used=r["model_used"],
                    start_time=datetime.fromisoformat(r["start_time"]),
                    end_time=datetime.fromisoformat(r["end_time"]) if r["end_time"] else None,
                    status=r["status"],
                    prompt_tokens=r["prompt_tokens"],
                    completion_tokens=r["completion_tokens"],
                    estimated_cost_usd=r["estimated_cost_usd"],
                    logs=json.loads(r["logs_json"]),
                    error_message=r["error_message"]
                )
                for r in rows
            ]

    # --- Approval Requests ---

    def create_approval(self, approval: ApprovalRequest) -> ApprovalRequest:
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO approvals (
                    id, project_id, task_id, action_type, description, status,
                    requested_at, decided_at, decision_note
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    approval.id, approval.project_id, approval.task_id, approval.action_type,
                    approval.description, approval.status.value, approval.requested_at.isoformat(),
                    approval.decided_at.isoformat() if approval.decided_at else None,
                    approval.decision_note
                )
            )
        return approval

    def list_approvals_for_project(self, project_id: str) -> List[ApprovalRequest]:
        with self._get_connection() as conn:
            rows = conn.execute("SELECT * FROM approvals WHERE project_id = ? ORDER BY requested_at DESC", (project_id,)).fetchall()
            return [
                ApprovalRequest(
                    id=r["id"],
                    project_id=r["project_id"],
                    task_id=r["task_id"],
                    action_type=r["action_type"],
                    description=r["description"],
                    status=ApprovalStatus(r["status"]),
                    requested_at=datetime.fromisoformat(r["requested_at"]),
                    decided_at=datetime.fromisoformat(r["decided_at"]) if r["decided_at"] else None,
                    decision_note=r["decision_note"]
                )
                for r in rows
            ]

    def update_approval_status(self, approval_id: str, status: ApprovalStatus, note: Optional[str] = None) -> None:
        with self._get_connection() as conn:
            conn.execute(
                "UPDATE approvals SET status = ?, decided_at = ?, decision_note = ? WHERE id = ?",
                (status.value, datetime.now(timezone.utc).isoformat(), note, approval_id)
            )

    # --- Project Memory ---

    def add_memory_entry(self, entry: ProjectMemoryEntry) -> ProjectMemoryEntry:
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO memory_entries (
                    id, project_id, category, title, content, tags_json, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    entry.id, entry.project_id, entry.category.value, entry.title,
                    entry.content, json.dumps(entry.tags), entry.created_at.isoformat(),
                    entry.updated_at.isoformat()
                )
            )
        return entry

    def list_memory_entries(self, project_id: str, category: Optional[MemoryCategory] = None) -> List[ProjectMemoryEntry]:
        with self._get_connection() as conn:
            if category:
                rows = conn.execute(
                    "SELECT * FROM memory_entries WHERE project_id = ? AND category = ? ORDER BY created_at DESC",
                    (project_id, category.value)
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT * FROM memory_entries WHERE project_id = ? ORDER BY created_at DESC",
                    (project_id,)
                ).fetchall()
                
            return [
                ProjectMemoryEntry(
                    id=r["id"],
                    project_id=r["project_id"],
                    category=MemoryCategory(r["category"]),
                    title=r["title"],
                    content=r["content"],
                    tags=json.loads(r["tags_json"]),
                    created_at=datetime.fromisoformat(r["created_at"]),
                    updated_at=datetime.fromisoformat(r["updated_at"])
                )
                for r in rows
            ]

    # --- System State (Emergency Stop) ---

    def set_emergency_stop(self, stopped: bool) -> None:
        with self._get_connection() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO system_state (key, value) VALUES ('emergency_stop', ?)",
                ("true" if stopped else "false",)
            )

    def is_emergency_stopped(self) -> bool:
        with self._get_connection() as conn:
            row = conn.execute("SELECT value FROM system_state WHERE key = 'emergency_stop'").fetchone()
            if not row:
                return False
            return row["value"] == "true"

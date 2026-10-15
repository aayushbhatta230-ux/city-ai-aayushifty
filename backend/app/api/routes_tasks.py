"""FORGE AI Task Routes."""

from fastapi import APIRouter, HTTPException
from typing import List
from app.models.schemas import Task, TaskState
from app.models.database import Database
from app.config import config

router = APIRouter(prefix="/api/tasks", tags=["tasks"])
db = Database(config.DB_PATH)

@router.get("/project/{project_id}", response_model=List[Task])
def list_tasks_for_project(project_id: str):
    return db.list_tasks_for_project(project_id)

@router.get("/{task_id}", response_model=Task)
def get_task(task_id: str):
    t = db.get_task(task_id)
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")
    return t

@router.post("/{task_id}/retry")
def retry_task(task_id: str):
    t = db.get_task(task_id)
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")
    db.update_task_state(task_id, TaskState.READY, increment_retry=True)
    return {"status": "TASK_RESET_TO_READY", "task_id": task_id}

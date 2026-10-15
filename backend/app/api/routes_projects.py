"""FORGE AI Project Routes."""

import uuid
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Dict, Any
from app.models.schemas import Project, ProjectCreate, ProjectStatus
from app.models.database import Database
from app.config import config
from app.agents.orchestrator import Orchestrator

router = APIRouter(prefix="/api/projects", tags=["projects"])
db = Database(config.DB_PATH)

@router.post("", response_model=Project)
def create_project(payload: ProjectCreate):
    p_id = f"proj-{uuid.uuid4().hex[:8]}"
    ws_dir = str(config.WORKSPACES_DIR / p_id)
    project = Project(
        id=p_id,
        name=payload.name,
        description=payload.description,
        workspace_dir=ws_dir,
        budget_limit_usd=payload.budget_limit_usd,
        status=ProjectStatus.PLANNING
    )
    return db.create_project(project)

@router.get("", response_model=List[Project])
def list_projects():
    return db.list_projects()

@router.get("/{project_id}", response_model=Project)
def get_project(project_id: str):
    p = db.get_project(project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return p

@router.post("/{project_id}/execute")
async def start_autonomous_build(project_id: str, background_tasks: BackgroundTasks):
    p = db.get_project(project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
        
    orchestrator = Orchestrator(db, p.workspace_dir)
    
    # Run in background so request returns immediately
    async def _run():
        await orchestrator.run_pipeline(p, p.description)

    background_tasks.add_task(_run)
    return {"status": "PIPELINE_STARTED", "project_id": project_id}

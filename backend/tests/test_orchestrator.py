import pytest
from pathlib import Path
from app.models.schemas import Project, ProjectStatus
from app.models.database import Database
from app.agents.orchestrator import Orchestrator

@pytest.mark.asyncio
async def test_orchestrator_pipeline_execution(tmp_path):
    db_file = tmp_path / "test.db"
    db = Database(db_file)
    ws_dir = tmp_path / "proj_ws"
    
    project = Project(
        id="proj-orch-test",
        name="School Platform",
        description="Build a school management platform with students and courses",
        workspace_dir=str(ws_dir),
        status=ProjectStatus.PLANNING
    )
    db.create_project(project)
    
    orchestrator = Orchestrator(db, str(ws_dir))
    
    # Initialize pipeline
    init_res = await orchestrator.initialize_project_pipeline(project, project.description)
    assert "prd" in init_res
    assert len(init_res["tasks"]) > 0

    # Execute first task
    first_task = init_res["tasks"][0]
    result_task = await orchestrator.execute_task(first_task)
    assert result_task.state.value in ["COMPLETED", "VERIFYING"]

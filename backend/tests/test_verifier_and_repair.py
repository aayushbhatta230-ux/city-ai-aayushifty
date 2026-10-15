import pytest
from app.execution.workspace import WorkspaceManager
from app.execution.verifier import VerifierEngine
from app.execution.repair_loop import RepairLoopEngine
from app.models.schemas import Task, TaskState, AgentRole

@pytest.mark.asyncio
async def test_verifier_engine_success(tmp_path):
    ws_dir = tmp_path / "ws_verify"
    ws = WorkspaceManager(ws_dir)
    
    # Write a passing test
    ws.write_file("test_pass.py", "def test_ok(): assert 1 == 1\n")
    
    evidence = await VerifierEngine.verify_workspace(ws_dir, test_command="pytest -v test_pass.py")
    assert evidence.exit_code == 0
    assert evidence.passed_tests >= 1
    assert evidence.failed_tests == 0

@pytest.mark.asyncio
async def test_repair_loop_repairs_failing_code(tmp_path):
    ws_dir = tmp_path / "ws_repair"
    ws = WorkspaceManager(ws_dir)

    # Initial code has a bug
    ws.write_file("src/core.py", "def run_core():\n    return {'status': 'error'}\n")
    ws.write_file("tests/test_core.py", "from src.core import run_core\ndef test_run():\n    assert run_core()['status'] == 'success'\n")

    # Initial test should fail
    initial_evidence = await VerifierEngine.verify_workspace(ws_dir, test_command="pytest -v")
    assert initial_evidence.exit_code != 0

    task = Task(
        id="task-repair-test",
        project_id="p-1",
        title="Fix status return",
        objective="Ensure run_core returns status success",
        assigned_role=AgentRole.DEBUGGING_AGENT,
        acceptance_criteria=["run_core returns success status"]
    )

    # Trigger repair loop
    fixed_evidence = await RepairLoopEngine.attempt_repair(
        task=task,
        workspace=ws,
        initial_evidence=initial_evidence,
        test_command="pytest -v",
        max_attempts=2
    )

    assert fixed_evidence.exit_code == 0
    assert fixed_evidence.passed_tests >= 1

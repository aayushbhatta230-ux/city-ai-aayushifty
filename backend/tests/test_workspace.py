import pytest
from app.execution.workspace import WorkspaceManager

def test_workspace_file_operations_and_git(tmp_path):
    ws_dir = tmp_path / "test_ws"
    ws = WorkspaceManager(ws_dir)

    # Test file write and read
    file_path = ws.write_file("src/main.py", "print('hello forge')\n")
    assert file_path.exists()
    content = ws.read_file("src/main.py")
    assert content == "print('hello forge')\n"

    # Test list files
    files = ws.list_files()
    assert "src/main.py" in files

    # Test commit
    committed = ws.commit_changes("add main.py")
    assert committed is True

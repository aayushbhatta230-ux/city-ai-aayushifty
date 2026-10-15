import pytest
from pathlib import Path
from app.core.security import SecurityEngine, SecurityViolationError

def test_workspace_path_jail_containment(tmp_path):
    workspace = tmp_path / "sandbox"
    workspace.mkdir()

    # Valid internal path
    valid_target = workspace / "src" / "index.py"
    resolved = SecurityEngine.validate_path_in_workspace(valid_target, workspace)
    assert resolved == valid_target.resolve()

    # Directory traversal attack blocked
    escape_target = workspace / ".." / "system32"
    with pytest.raises(SecurityViolationError):
        SecurityEngine.validate_path_in_workspace(escape_target, workspace)

def test_command_policy_whitelist():
    # Allowed commands
    SecurityEngine.validate_command_policy("pytest -v tests/")
    SecurityEngine.validate_command_policy("python -m unittest")
    SecurityEngine.validate_command_policy("git status")

    # Blacklisted destructive commands
    with pytest.raises(SecurityViolationError):
        SecurityEngine.validate_command_policy("format c:")

    with pytest.raises(SecurityViolationError):
        SecurityEngine.validate_command_policy("rmdir /s /q c:\\")

    # Unauthorized executable
    with pytest.raises(SecurityViolationError):
        SecurityEngine.validate_command_policy("powershell -ExecutionPolicy Bypass")

def test_secret_redaction():
    text = "Connecting with key sk-1234567890abcdef1234567890 to backend"
    redacted = SecurityEngine.redact_secrets(text)
    assert "sk-1234567890" not in redacted
    assert "[REDACTED_SECRET]" in redacted

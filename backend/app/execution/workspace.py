"""FORGE AI Workspace Sandbox & Git Version Control Manager."""

import subprocess
from pathlib import Path
from typing import Dict, List, Optional
from app.core.security import SecurityEngine, SecurityViolationError

class WorkspaceManager:
    """Manages isolated project workspaces, file I/O within path jail, and git tracking."""

    def __init__(self, workspace_root: Path | str):
        self.root = Path(workspace_root).resolve()
        self.root.mkdir(parents=True, exist_ok=True)
        self._ensure_git()

    def _ensure_git(self) -> None:
        """Initializes a local git repository in the workspace if not present."""
        git_dir = self.root / ".git"
        if not git_dir.exists():
            try:
                subprocess.run(["git", "init"], cwd=self.root, capture_output=True, check=True)
                subprocess.run(["git", "config", "user.name", "FORGE AI"], cwd=self.root, capture_output=True)
                subprocess.run(["git", "config", "user.email", "forge@local.ai"], cwd=self.root, capture_output=True)
                readme = self.root / "README.md"
                if not readme.exists():
                    readme.write_text("# Project Workspace initialized by FORGE AI\n", encoding="utf-8")
                subprocess.run(["git", "add", "."], cwd=self.root, capture_output=True)
                subprocess.run(["git", "commit", "-m", "Initial workspace commit"], cwd=self.root, capture_output=True)
            except Exception:
                pass

    def resolve_path(self, relative_path: str | Path) -> Path:
        """Validates and resolves path strictly within the workspace boundaries."""
        return SecurityEngine.validate_path_in_workspace(relative_path, self.root)

    def write_file(self, relative_path: str | Path, content: str) -> Path:
        """Safely writes a file within the workspace."""
        target = self.resolve_path(relative_path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        return target

    def read_file(self, relative_path: str | Path) -> str:
        """Safely reads a file within the workspace."""
        target = self.resolve_path(relative_path)
        if not target.exists():
            raise FileNotFoundError(f"File not found in workspace: {relative_path}")
        return target.read_text(encoding="utf-8")

    def list_files(self) -> List[str]:
        """Lists all files relative to workspace root (excluding .git)."""
        files = []
        for p in self.root.rglob("*"):
            if p.is_file() and ".git" not in p.parts:
                files.append(str(p.relative_to(self.root)).replace("\\", "/"))
        return sorted(files)

    def get_git_diff(self) -> str:
        """Generates git diff of unstaged and staged changes."""
        try:
            res = subprocess.run(["git", "diff", "HEAD"], cwd=self.root, capture_output=True, text=True)
            return res.stdout
        except Exception:
            return ""

    def commit_changes(self, message: str) -> bool:
        """Stages and commits changes to git history."""
        try:
            subprocess.run(["git", "add", "."], cwd=self.root, capture_output=True, check=True)
            res = subprocess.run(["git", "commit", "-m", message], cwd=self.root, capture_output=True, text=True)
            return res.returncode == 0
        except Exception:
            return False

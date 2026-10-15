"""FORGE AI Subprocess Execution Runner with Security Guardrails & Timeouts."""

import asyncio
import os
import time
from pathlib import Path
from typing import Dict, List, Optional
from pydantic import BaseModel

from app.core.security import SecurityEngine

class ExecutionResult(BaseModel):
    command: str
    exit_code: int
    stdout: str
    stderr: str
    duration_ms: float
    timed_out: bool = False

class ProcessRunner:
    """Safely executes whitelisted CLI commands within a sandboxed working directory."""

    @classmethod
    async def run_command(
        cls,
        command: str,
        cwd: Path | str,
        timeout_seconds: int = 60,
        env: Optional[Dict[str, str]] = None
    ) -> ExecutionResult:
        SecurityEngine.validate_command_policy(command)

        work_dir = Path(cwd).resolve()
        exec_env = os.environ.copy()
        exec_env["PYTHONPATH"] = str(work_dir)
        if env:
            exec_env.update(env)

        start = time.perf_counter()
        timed_out = False

        try:
            process = await asyncio.create_subprocess_shell(
                command,
                cwd=str(work_dir),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=exec_env
            )

            try:
                stdout_data, stderr_data = await asyncio.wait_for(
                    process.communicate(), timeout=float(timeout_seconds)
                )
                exit_code = process.returncode if process.returncode is not None else -1
            except asyncio.TimeoutError:
                timed_out = True
                try:
                    process.kill()
                    await process.communicate()
                except Exception:
                    pass
                exit_code = -9
                stdout_data = b""
                stderr_data = f"Command execution timed out after {timeout_seconds} seconds.".encode()

        except Exception as e:
            return ExecutionResult(
                command=command,
                exit_code=-1,
                stdout="",
                stderr=f"Failed to spawn process: {str(e)}",
                duration_ms=0.0,
                timed_out=False
            )

        duration = (time.perf_counter() - start) * 1000.0
        stdout_str = stdout_data.decode("utf-8", errors="replace")
        stderr_str = stderr_data.decode("utf-8", errors="replace")

        return ExecutionResult(
            command=command,
            exit_code=exit_code,
            stdout=SecurityEngine.redact_secrets(stdout_str),
            stderr=SecurityEngine.redact_secrets(stderr_str),
            duration_ms=duration,
            timed_out=timed_out
        )

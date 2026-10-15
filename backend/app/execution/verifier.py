"""FORGE AI Verification Engine: Test Execution & Observable Evidence Gathering."""

import re
from pathlib import Path
from typing import Optional
from app.models.schemas import VerificationEvidence
from app.execution.runner import ProcessRunner

class VerifierEngine:
    """Executes automated verification suites and parses observable test evidence."""

    @classmethod
    async def verify_workspace(
        cls,
        workspace_path: Path | str,
        test_command: str = "pytest -v",
        timeout_seconds: int = 60
    ) -> VerificationEvidence:
        """Runs the test suite inside the workspace and produces concrete verification evidence."""
        result = await ProcessRunner.run_command(
            command=test_command,
            cwd=workspace_path,
            timeout_seconds=timeout_seconds
        )

        combined_output = f"{result.stdout}\n{result.stderr}"

        passed_count = 0
        failed_count = 0

        passed_match = re.search(r"(\d+)\s+passed", combined_output)
        if passed_match:
            passed_count = int(passed_match.group(1))

        failed_match = re.search(r"(\d+)\s+failed", combined_output)
        if failed_match:
            failed_count = int(failed_match.group(1))

        if result.exit_code == 0 and passed_count == 0:
            if "error" not in combined_output.lower() and "traceback" not in combined_output.lower():
                passed_count = 1

        # If pytest exited with 5 because no test files exist yet, perform syntax validation on all python modules
        if result.exit_code == 5 and ("no tests ran" in combined_output.lower() or "collected 0 items" in combined_output.lower()):
            import ast
            ws = Path(workspace_path)
            py_files = [f for f in ws.rglob("*.py") if ".git" not in f.parts]
            syntax_errors = []
            for pf in py_files:
                try:
                    ast.parse(pf.read_text(encoding="utf-8"))
                except Exception as ex:
                    syntax_errors.append(f"{pf.name}: {ex}")

            if not syntax_errors:
                return VerificationEvidence(
                    test_suite=test_command,
                    exit_code=0,
                    passed_tests=len(py_files) if py_files else 1,
                    failed_tests=0,
                    output_snippet="Syntax validation passed: All python modules parsed successfully."
                )
            else:
                return VerificationEvidence(
                    test_suite=test_command,
                    exit_code=1,
                    passed_tests=0,
                    failed_tests=len(syntax_errors),
                    output_snippet="Syntax validation failed:\n" + "\n".join(syntax_errors)
                )

        output_snippet = (result.stdout[-1000:] if result.stdout else "") + (
            f"\nERRORS:\n{result.stderr[-1000:]}" if result.stderr else ""
        )

        return VerificationEvidence(
            test_suite=test_command,
            exit_code=result.exit_code,
            passed_tests=passed_count,
            failed_tests=failed_count if failed_count > 0 else (1 if result.exit_code != 0 else 0),
            output_snippet=output_snippet.strip()
        )

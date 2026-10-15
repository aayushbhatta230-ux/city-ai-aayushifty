"""FORGE AI Task State Machine & Transition Rules."""

from enum import Enum
from typing import Set, Dict, Optional
from pydantic import BaseModel

class TaskState(str, Enum):
    QUEUED = "QUEUED"
    PLANNING = "PLANNING"
    READY = "READY"
    RUNNING = "RUNNING"
    VERIFYING = "VERIFYING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    BLOCKED = "BLOCKED"
    CANCELLED = "CANCELLED"
    NEEDS_APPROVAL = "NEEDS_APPROVAL"

class InvalidStateTransitionError(Exception):
    """Raised when an illegal task transition is attempted."""
    pass

class StateMachineValidator:
    """Enforces strict, deterministic task lifecycle transitions and safety invariants."""
    
    ALLOWED_TRANSITIONS: Dict[TaskState, Set[TaskState]] = {
        TaskState.QUEUED: {
            TaskState.PLANNING, TaskState.READY, TaskState.BLOCKED, TaskState.CANCELLED
        },
        TaskState.PLANNING: {
            TaskState.READY, TaskState.BLOCKED, TaskState.FAILED, TaskState.CANCELLED, TaskState.NEEDS_APPROVAL
        },
        TaskState.READY: {
            TaskState.RUNNING, TaskState.BLOCKED, TaskState.CANCELLED
        },
        TaskState.RUNNING: {
            TaskState.VERIFYING, TaskState.FAILED, TaskState.BLOCKED, TaskState.CANCELLED, TaskState.NEEDS_APPROVAL
        },
        TaskState.VERIFYING: {
            TaskState.COMPLETED, TaskState.RUNNING, TaskState.FAILED, TaskState.NEEDS_APPROVAL, TaskState.CANCELLED
        },
        TaskState.NEEDS_APPROVAL: {
            TaskState.READY, TaskState.RUNNING, TaskState.PLANNING, TaskState.CANCELLED, TaskState.FAILED
        },
        TaskState.BLOCKED: {
            TaskState.READY, TaskState.QUEUED, TaskState.CANCELLED, TaskState.FAILED
        },
        TaskState.FAILED: {
            TaskState.READY, TaskState.CANCELLED
        },
        TaskState.CANCELLED: {
            TaskState.QUEUED
        },
        TaskState.COMPLETED: {
            TaskState.READY  # for explicit re-opening or rework
        }
    }

    @classmethod
    def can_transition(cls, current: TaskState, target: TaskState) -> bool:
        if current == target:
            return True
        return target in cls.ALLOWED_TRANSITIONS.get(current, set())

    @classmethod
    def validate_transition(
        cls, 
        current: TaskState, 
        target: TaskState, 
        has_verification_evidence: bool = False
    ) -> None:
        """Validates that a transition from current to target state is legally allowed."""
        if current == target:
            return
            
        allowed = cls.ALLOWED_TRANSITIONS.get(current, set())
        if target not in allowed:
            raise InvalidStateTransitionError(
                f"Illegal state transition from {current.value} to {target.value}. Allowed: {[s.value for s in allowed]}"
            )
            
        # Invariant: COMPLETED requires verification evidence
        if target == TaskState.COMPLETED and not has_verification_evidence:
            raise InvalidStateTransitionError(
                "Cannot transition to COMPLETED without concrete verification evidence."
            )

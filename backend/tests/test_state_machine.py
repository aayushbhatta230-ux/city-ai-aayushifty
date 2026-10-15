import pytest
from app.core.state_machine import TaskState, StateMachineValidator, InvalidStateTransitionError

def test_legal_transitions():
    # QUEUED -> PLANNING -> READY -> RUNNING -> VERIFYING -> COMPLETED
    assert StateMachineValidator.can_transition(TaskState.QUEUED, TaskState.PLANNING)
    assert StateMachineValidator.can_transition(TaskState.PLANNING, TaskState.READY)
    assert StateMachineValidator.can_transition(TaskState.READY, TaskState.RUNNING)
    assert StateMachineValidator.can_transition(TaskState.RUNNING, TaskState.VERIFYING)
    assert StateMachineValidator.can_transition(TaskState.VERIFYING, TaskState.COMPLETED)

def test_illegal_transition_raises_error():
    # Cannot jump directly from QUEUED to COMPLETED
    with pytest.raises(InvalidStateTransitionError):
        StateMachineValidator.validate_transition(TaskState.QUEUED, TaskState.COMPLETED)

def test_completion_requires_verification_evidence():
    # From VERIFYING to COMPLETED without evidence must raise error
    with pytest.raises(InvalidStateTransitionError):
        StateMachineValidator.validate_transition(
            TaskState.VERIFYING, 
            TaskState.COMPLETED, 
            has_verification_evidence=False
        )

    # With evidence it must succeed
    StateMachineValidator.validate_transition(
        TaskState.VERIFYING, 
        TaskState.COMPLETED, 
        has_verification_evidence=True
    )

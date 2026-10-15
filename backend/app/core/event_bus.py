"""FORGE AI Event Bus: Pub/Sub event broadcasting for real-time agent telemetry."""

import asyncio
from datetime import datetime, timezone
from typing import Callable, Coroutine, Dict, List, Any
from pydantic import BaseModel, Field

class ForgeEvent(BaseModel):
    event_id: str
    topic: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    payload: Dict[str, Any] = Field(default_factory=dict)

class EventBus:
    """In-memory asynchronous pub/sub broker for system events and UI telemetry."""
    
    def __init__(self):
        self._subscribers: Dict[str, List[Callable[[ForgeEvent], Coroutine[Any, Any, None]]]] = {}
        self._global_subscribers: List[Callable[[ForgeEvent], Coroutine[Any, Any, None]]] = []
        self._history: List[ForgeEvent] = []
        self._max_history: int = 500

    def subscribe(self, topic: str, handler: Callable[[ForgeEvent], Coroutine[Any, Any, None]]) -> None:
        if topic not in self._subscribers:
            self._subscribers[topic] = []
        self._subscribers[topic].append(handler)

    def subscribe_all(self, handler: Callable[[ForgeEvent], Coroutine[Any, Any, None]]) -> None:
        self._global_subscribers.append(handler)

    def unsubscribe_all(self, handler: Callable[[ForgeEvent], Coroutine[Any, Any, None]]) -> None:
        if handler in self._global_subscribers:
            self._global_subscribers.remove(handler)
        for topic in self._subscribers:
            if handler in self._subscribers[topic]:
                self._subscribers[topic].remove(handler)

    async def publish(self, event: ForgeEvent) -> None:
        self._history.append(event)
        if len(self._history) > self._max_history:
            self._history.pop(0)
            
        handlers = list(self._global_subscribers)
        if event.topic in self._subscribers:
            handlers.extend(self._subscribers[event.topic])
            
        for handler in handlers:
            try:
                await handler(event)
            except Exception:
                pass

    def get_recent_events(self, limit: int = 50) -> List[ForgeEvent]:
        return self._history[-limit:]

event_bus = EventBus()

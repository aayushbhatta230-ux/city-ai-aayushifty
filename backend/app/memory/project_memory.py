"""FORGE AI Project Memory: Persistent Knowledge, ADRs, and Technical History."""

import uuid
from typing import List, Optional
from app.models.schemas import ProjectMemoryEntry, MemoryCategory
from app.models.database import Database

class ProjectMemoryStore:
    """Provides structured search and persistence for project architectural decisions and known issues."""

    def __init__(self, db: Database):
        self.db = db

    def record_adr(self, project_id: str, title: str, decision: str, rationale: str) -> ProjectMemoryEntry:
        content = f"### Decision\n{decision}\n\n### Rationale\n{rationale}"
        entry = ProjectMemoryEntry(
            id=f"adr-{uuid.uuid4().hex[:8]}",
            project_id=project_id,
            category=MemoryCategory.ADR,
            title=title,
            content=content,
            tags=["architecture", "decision"]
        )
        return self.db.add_memory_entry(entry)

    def record_known_bug(self, project_id: str, title: str, symptom: str, resolution: str) -> ProjectMemoryEntry:
        content = f"### Symptom\n{symptom}\n\n### Resolution / Avoidance\n{resolution}"
        entry = ProjectMemoryEntry(
            id=f"bug-{uuid.uuid4().hex[:8]}",
            project_id=project_id,
            category=MemoryCategory.KNOWN_BUG,
            title=title,
            content=content,
            tags=["bug", "learning"]
        )
        return self.db.add_memory_entry(entry)

    def get_context_summary(self, project_id: str) -> str:
        """Assembles all active ADRs and technical constraints into a context string for agents."""
        entries = self.db.list_memory_entries(project_id)
        if not entries:
            return "No prior project memory recorded."

        lines = ["# PROJECT MEMORY & ARCHITECTURAL CONSTRAINTS:"]
        for e in entries:
            lines.append(f"\n## [{e.category.value}] {e.title}")
            lines.append(e.content)
        return "\n".join(lines)

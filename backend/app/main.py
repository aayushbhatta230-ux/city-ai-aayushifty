"""FORGE AI FastAPI Application Entrypoint."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import config
from app.api.routes_projects import router as projects_router
from app.api.routes_tasks import router as tasks_router
from app.api.routes_misc import memory_router, approval_router, budget_router, ws_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    config.ensure_directories()
    yield

app = FastAPI(
    title="FORGE AI — Autonomous Software Engineering Factory",
    description="Model-agnostic engineering orchestration engine with verification and bounded self-repair.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects_router)
app.include_router(tasks_router)
app.include_router(memory_router)
app.include_router(approval_router)
app.include_router(budget_router)
app.include_router(ws_router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FORGE AI Platform",
        "version": "1.0.0"
    }

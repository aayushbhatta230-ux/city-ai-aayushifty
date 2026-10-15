# FORGE AI — Autonomous Software Engineering Factory

FORGE AI is a model-independent autonomous software engineering platform that manages complete software development workflows:
- Product specification and ambiguity clarification
- Architecture decomposition into dependency graphs (DAG)
- Sandboxed workspace isolation with Git version tracking
- Multi-agent coordination (Orchestrator, Product Analyst, Architect, Implementer, Tester, Debugger, Reviewer, Documenter)
- Automated verification via real test suites (exit codes, pass/fail counts, logs)
- Bounded self-repair loop
- Cost and performance guardrails with Global Emergency Stop
- Real-time engineering command center (React + Vite + TypeScript)

## Architecture Overview

```
FORGE AI
├── backend/       # FastAPI REST & WebSocket server, SQLite persistence, Agent Engine
├── frontend/      # High-density dark engineering command center (Vite + React + TS)
└── docs/          # Architecture RFCs, evaluation benchmarks, and security policies
```

## Quick Start

### Backend
```bash
cd backend
python run.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

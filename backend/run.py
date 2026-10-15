"""Launch script for FORGE AI Backend Server."""

import uvicorn
from app.config import config

if __name__ == "__main__":
    config.ensure_directories()
    uvicorn.run("app.main:app", host=config.HOST, port=config.PORT, reload=config.DEBUG)

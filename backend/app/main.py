from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.config import settings
from backend.app.database.session import init_db
from backend.app.utils.logger import logger
from backend.app.api.health import router as health_router
from backend.app.api.chat import router as chat_router
from backend.app.api.intent import router as intent_router
from backend.app.api.tools import router as tools_router
from backend.app.api.reminders import router as reminders_router
from backend.app.api.memory import router as memory_router
from backend.app.api.diagnostics import router as diagnostics_router
from backend.app.api.voice import router as voice_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle management."""
    logger.info("Initializing JARVIS Personal AI Assistant Backend...")
    try:
        init_db()
        logger.info("Database schemas verified.")
    except Exception as e:
        logger.error("Failed to initialize database: %s", e)

    logger.info("JARVIS Assistant Backend is ready on http://%s:%d", settings.HOST, settings.PORT)
    yield
    logger.info("JARVIS Assistant Backend shutting down cleanly.")

app = FastAPI(
    title="JARVIS Personal AI Assistant API",
    description="Futuristic Hybrid AI Architecture combining Custom ML Intent Classification, Safe Computer Tools, and Gemini LLM.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware for local frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled global exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred in JARVIS core.", "error": str(exc)}
    )

# Include API Routers
app.include_router(health_router)
app.include_router(chat_router)
app.include_router(intent_router)
app.include_router(tools_router)
app.include_router(reminders_router)
app.include_router(memory_router)
app.include_router(diagnostics_router)
app.include_router(voice_router)

@app.get("/")
def root():
    return {
        "system": "JARVIS Personal AI Assistant",
        "status": "ONLINE",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_check": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)

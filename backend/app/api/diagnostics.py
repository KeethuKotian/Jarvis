import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from backend.app.database.session import get_db
from backend.app.config import settings

router = APIRouter(prefix="/api/diagnostics", tags=["Developer Diagnostics"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent
EVAL_PATH = BASE_DIR / "models" / "evaluation_results.json"
EXP_PATH = BASE_DIR / "models" / "experiment_results.json"

@router.get("/evaluation")
def get_evaluation_results():
    """Returns actual measured ML evaluation metrics on held-out test data."""
    if not EVAL_PATH.exists():
        raise HTTPException(status_code=404, detail="ML evaluation results not yet generated.")
    with open(EVAL_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("/experiments")
def get_experiment_results():
    """Returns measured comparative benchmarks for Local ML vs Gemini vs Hybrid."""
    if not EXP_PATH.exists():
        raise HTTPException(status_code=404, detail="Experiment results not yet generated.")
    with open(EXP_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("/audit-logs")
def get_tool_audit_logs(limit: int = 50):
    """Returns the most recent computer tool execution audit records from SQLite."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, tool_name, parameters, status, execution_time_ms, error_message, created_at
            FROM tool_audit_logs
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()

    return {
        "total": len(rows),
        "audit_logs": [
            {
                "id": r["id"],
                "tool_name": r["tool_name"],
                "parameters": r["parameters"],
                "status": r["status"],
                "execution_time_ms": r["execution_time_ms"],
                "error_message": r["error_message"],
                "created_at": r["created_at"]
            }
            for r in rows
        ]
    }

@router.get("/system-summary")
def get_system_summary():
    """Returns high-level runtime metadata without leaking secrets."""
    return {
        "app_env": settings.APP_ENV,
        "gemini_model": settings.GEMINI_MODEL,
        "confidence_threshold": settings.CONFIDENCE_THRESHOLD,
        "allowed_applications_count": len(settings.ALLOWED_APPLICATIONS),
        "allowed_directories_count": len(settings.ALLOWED_DIRECTORIES),
        "secrets_configured": bool(settings.GEMINI_API_KEY)
    }

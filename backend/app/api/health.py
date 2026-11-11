import time
import psutil
from fastapi import APIRouter
from backend.app.config import settings
from backend.app.ml.predictor import predictor
from backend.app.services.gemini_service import gemini_service
from backend.app.database.session import get_db

router = APIRouter(prefix="/api/health", tags=["Health & Status"])

@router.get("")
def health_check():
    """Returns real-time health and operational readiness of JARVIS subsystems."""
    # Check Database
    db_ok = False
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            db_ok = True
    except Exception:
        db_ok = False

    # Check ML Model
    ml_ok = predictor.pipeline is not None

    # Check Gemini API status
    gemini_status = "CONFIGURED" if gemini_service.is_configured else "LOCAL_ONLY_MODE"

    # System telemetry
    cpu_usage = psutil.cpu_percent(interval=None)
    mem = psutil.virtual_memory()

    return {
        "status": "ONLINE" if (db_ok and ml_ok) else "DEGRADED",
        "system": "JARVIS AI Assistant",
        "environment": settings.APP_ENV,
        "database_connected": db_ok,
        "ml_classifier_loaded": ml_ok,
        "gemini_status": gemini_status,
        "gemini_model": settings.GEMINI_MODEL,
        "telemetry": {
            "cpu_percent": cpu_usage,
            "ram_percent": mem.percent,
            "ram_used_gb": round(mem.used / (1024**3), 2),
            "ram_total_gb": round(mem.total / (1024**3), 2)
        },
        "timestamp": time.time()
    }

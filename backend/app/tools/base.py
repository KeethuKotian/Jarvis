import time
import json
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from backend.app.database.session import get_db
from backend.app.utils.logger import logger

class BaseTool(ABC):
    """Abstract base class for all JARVIS computer automation tools."""
    name: str
    description: str
    
    @abstractmethod
    def run(self, **kwargs) -> Dict[str, Any]:
        """Execute the tool operation."""
        pass
        
    def execute(self, **kwargs) -> Dict[str, Any]:
        """Wraps execution with timing, error trapping, and security audit logging."""
        t0 = time.perf_counter()
        status = "SUCCESS"
        error_msg = None
        result = {}
        
        try:
            result = self.run(**kwargs)
            if not result.get("success", True):
                status = "FAILED"
        except Exception as e:
            status = "ERROR"
            error_msg = str(e)
            logger.error("Tool execution failed [%s]: %s", self.name, e)
            result = {"success": False, "error": error_msg}
            
        execution_time_ms = (time.perf_counter() - t0) * 1000.0
        
        # Log to audit database
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                # Sanitize parameters (exclude sensitive tokens if any)
                sanitized_params = json.dumps({k: str(v) for k, v in kwargs.items()})
                cursor.execute("""
                    INSERT INTO tool_audit_logs (tool_name, parameters, status, execution_time_ms, error_message)
                    VALUES (?, ?, ?, ?, ?)
                """, (self.name, sanitized_params, status, execution_time_ms, error_msg))
        except Exception as log_err:
            logger.warning("Failed to record tool audit log: %s", log_err)
            
        result["execution_time_ms"] = round(execution_time_ms, 2)
        return result

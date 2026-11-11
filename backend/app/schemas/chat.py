from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ChatRequest(BaseModel):
    message: str = Field(..., description="User voice transcript or typed text message")
    session_id: Optional[str] = Field("default", description="Conversation session ID")
    voice_enabled: bool = Field(False, description="Whether speech response is requested")
    bypass_ml: bool = Field(False, description="Optionally force direct Gemini routing for benchmarking")
    force_local: bool = Field(False, description="Optionally force local-only routing for benchmarking")

class DiagnosticsData(BaseModel):
    normalized_input: str
    predicted_intent: str
    confidence: float
    routing_decision: str # "LOCAL_TOOL", "GEMINI_FALLBACK", "LOCAL_FALLBACK", "CONFIRMATION_REQUIRED"
    gemini_called: bool
    tool_selected: Optional[str] = None
    tool_execution_status: Optional[str] = None
    processing_time_ms: float
    model_name: Optional[str] = None
    token_usage: Optional[Dict[str, Any]] = None
    errors: Optional[List[str]] = None

class ChatResponse(BaseModel):
    reply: str
    intent: str
    confidence: float
    routing: str
    tool_used: Optional[str] = None
    tool_result: Optional[Any] = None
    diagnostics: DiagnosticsData
    voice_audio_base64: Optional[str] = None
    requires_confirmation: bool = False
    confirmation_action: Optional[str] = None

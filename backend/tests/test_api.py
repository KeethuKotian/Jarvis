import pytest
from fastapi import HTTPException
from backend.app.api.health import health_check
from backend.app.api.intent import predict_intent
from backend.app.schemas.intent import IntentPredictionRequest
from backend.app.api.tools import get_allowed_applications
from backend.app.api.chat import handle_chat_message
from backend.app.schemas.chat import ChatRequest

def test_health_endpoint():
    data = health_check()
    assert data["status"] in ["ONLINE", "DEGRADED"]
    assert "telemetry" in data

def test_intent_predict_endpoint():
    req = IntentPredictionRequest(text="open notepad")
    data = predict_intent(req)
    assert data["intent"] == "OPEN_APPLICATION"
    assert data["confidence"] >= 0.4
    assert len(data["probabilities"]) > 0

def test_tools_allowed_apps_endpoint():
    data = get_allowed_applications()
    assert "notepad" in data["allowed_applications"]
    assert "calculator" in data["allowed_applications"]

def test_chat_endpoint_local_tool():
    req = ChatRequest(message="check my reminders")
    data = handle_chat_message(req)
    assert data.reply is not None
    assert data.diagnostics is not None
    assert data.diagnostics.predicted_intent in ["VIEW_REMINDERS", "ANSWER_QUESTION"]

def test_chat_endpoint_empty_message():
    req = ChatRequest(message="   ")
    with pytest.raises(HTTPException) as excinfo:
        handle_chat_message(req)
    assert excinfo.value.status_code == 400

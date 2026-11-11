import pytest
from backend.app.ml.preprocessor import normalize_text
from backend.app.ml.predictor import predictor

def test_text_normalization():
    raw = "What's up, Jarvis? Can't you open NOTEPAD?!?"
    cleaned = normalize_text(raw)
    assert "what is" in cleaned
    assert "can not" in cleaned
    assert "notepad" in cleaned
    assert "?" not in cleaned
    assert "!" not in cleaned

def test_intent_prediction_app_launcher():
    pred = predictor.predict("open notepad")
    assert pred["intent"] == "OPEN_APPLICATION"
    assert pred["confidence"] > 0.4
    assert pred["routing_decision"] == "LOCAL_TOOL"

def test_intent_prediction_system_control():
    pred = predictor.predict("lock my workstation")
    assert pred["intent"] == "SYSTEM_CONTROL"
    assert pred["confidence"] > 0.4

def test_intent_prediction_reminders():
    pred = predictor.predict("remind me to call John at 5 pm")
    assert pred["intent"] == "SET_REMINDER"

def test_low_confidence_or_unknown():
    # Random gibberish should route to Gemini fallback or unknown
    pred = predictor.predict("asdfghjkl zxcvbnm 123456")
    # Confidence should be low or intent UNKNOWN
    assert pred["routing_decision"] in ["GEMINI_FALLBACK", "LOCAL_FALLBACK"]

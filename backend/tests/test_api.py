import pytest

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["ONLINE", "DEGRADED"]
    assert "telemetry" in data

def test_intent_predict_endpoint(client):
    response = client.post("/api/intent/predict", json={"text": "open notepad"})
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "OPEN_APPLICATION"
    assert "confidence" in data
    assert "probabilities" in data

def test_tools_allowed_apps_endpoint(client):
    response = client.get("/api/tools/allowed-apps")
    assert response.status_code == 200
    data = response.json()
    assert "notepad" in data["allowed_applications"]
    assert "calculator" in data["allowed_applications"]

def test_chat_endpoint_local_tool(client):
    response = client.post("/api/chat", json={"message": "check my reminders"})
    assert response.status_code == 200
    data = response.json()
    assert data["reply"] is not None
    assert "diagnostics" in data
    assert data["diagnostics"]["predicted_intent"] in ["VIEW_REMINDERS", "ANSWER_QUESTION"]

def test_chat_endpoint_empty_message(client):
    response = client.post("/api/chat", json={"message": "   "})
    assert response.status_code == 400

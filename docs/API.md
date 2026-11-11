# JARVIS Backend REST API Reference

The backend exposes an interactive OpenAPI Swagger UI at `http://localhost:8000/docs`.

## 1. Subsystem Health
- `GET /api/health`: Operational readiness check for database, ML model, Gemini API, and system telemetry (CPU, RAM).

## 2. Conversation & Chat
- `POST /api/chat`: Submit text or voice transcript. Routes through ML intent classifier, executes computer tool or calls Gemini, and returns structured diagnostics.
  - Body: `{"message": str, "session_id": str, "voice_enabled": bool, "bypass_ml": bool, "force_local": bool}`
- `POST /api/chat/confirm?action={action}&original_message={msg}`: Explicit authorization endpoint for consequential operations.

## 3. ML Intent Classification
- `POST /api/intent/predict`: Direct inference debugging. Returns predicted intent, confidence score, probability distribution across all 10 classes, and recommended routing action.
- `GET /api/intent/metrics`: Empirical evaluation metrics measured on held-out test data.

## 4. Computer Automation Tools
- `GET /api/tools/allowed-apps`: Returns the application allowlist.
- `POST /api/tools/launch-app`: `{"app_name": "notepad"}`. Launches allowlisted app.
- `POST /api/tools/search-files`: `{"query": "report", "file_type": ".pdf", "max_results": 20}`. Searches permitted directories.
- `POST /api/tools/read-document`: `{"file_path": "Buildthis.md", "max_chars": 5000}`. Extracts text from TXT, MD, PDF, DOCX.
- `POST /api/tools/system-control`: `{"action": "lock" | "mute" | "unmute" | "get_stats", "confirm": bool}`.
- `POST /api/tools/web-search`: `{"query": "quantum computing news", "max_results": 5}`. Searches DuckDuckGo.

## 5. Reminders System
- `GET /api/reminders`: List all reminders (query filter `?status=PENDING`).
- `POST /api/reminders`: `{"title": "Review PR", "scheduled_time": "tomorrow at 10am"}`.
- `PUT /api/reminders/{id}/complete`: Marks reminder completed.
- `DELETE /api/reminders/{id}`: Deletes reminder.

## 6. Memory Vault
- `GET /api/memory`: List transparent user memories.
- `POST /api/memory`: `{"key": "user_name", "content": "Keerthan", "category": "user_preference"}`.
- `PUT /api/memory/{id}`: Edit memory item.
- `DELETE /api/memory/{id}`: Delete individual memory.
- `DELETE /api/memory`: Clear all memories.
- `POST /api/memory/toggle?enabled={bool}`: Enable/disable memory feature.

## 7. Developer Diagnostics
- `GET /api/diagnostics/evaluation`: Test accuracy, macro F1, per-class metrics, confusion matrix.
- `GET /api/diagnostics/experiments`: Empirical comparison between Local ML, Gemini, and Hybrid routing.
- `GET /api/diagnostics/audit-logs`: Tool execution audit logs.
- `GET /api/diagnostics/system-summary`: High-level operational metadata.

# JARVIS AI Assistant — Architecture Specification

## 1. System Overview

JARVIS is a hybrid personal AI assistant for Windows 11 combining a **local machine learning intent classifier** (scikit-learn) with a **cloud-hosted LLM** (Google Gemini API via official `google-genai` SDK) and **safe computer automation tools**.

```
                           +---------------------------+
                           |  User Input (Voice/Text)  |
                           +-------------+-------------+
                                         |
                                         v
                           +---------------------------+
                           |   Input Normalization     |
                           |   (Contraction/Punct)     |
                           +-------------+-------------+
                                         |
                                         v
                           +---------------------------+
                           |  Custom ML Intent Model   |
                           |  (TF-IDF + Logistic Reg)  |
                           +-------------+-------------+
                                         |
                       +-----------------+-----------------+
                       |                                   |
              Confidence >= Threshold              Confidence < Threshold
              & Supported Local Intent             OR Complex Reasoning Intent
                       |                                   |
                       v                                   v
        +------------------------------+     +-------------------------------+
        |  Safe Computer Tool Registry |     |       Google Gemini API       |
        |  • App Launcher (Allowlist)  |     |  • Deep Natural Conversation  |
        |  • File Search & Doc Reader  |     |  • General Knowledge QA       |
        |  • SQLite Reminders & Memory |     |  • Multi-turn Reasoning       |
        |  • System Telemetry / Lock   |     |  • Disambiguation Fallback    |
        +--------------+---------------+     +---------------+---------------+
                       |                                     |
                       +-----------------+-------------------+
                                         |
                                         v
                           +---------------------------+
                           |    Structured Response    |
                           |    + Dev Diagnostics      |
                           +-------------+-------------+
                                         |
                                         v
                           +---------------------------+
                           |  Futuristic UI / Speech   |
                           |  (Arc Reactor HUD + TTS)  |
                           +---------------------------+
```

## 2. Intelligence Layers

### Layer A: Local Scikit-Learn Intent Classifier
- **Model**: TF-IDF Vectorizer (unigrams + bigrams, sublinear term frequency) coupled with L2-regularized Logistic Regression with balanced class weights.
- **Trained Classes**: `OPEN_APPLICATION`, `SEARCH_FILES`, `READ_DOCUMENT`, `SET_REMINDER`, `VIEW_REMINDERS`, `SYSTEM_CONTROL`, `WEB_SEARCH`, `ANSWER_QUESTION`, `GENERAL_CHAT`, `UNKNOWN`.
- **Latency**: Sub-millisecond (~0.85 ms per query).
- **Offline Reliability**: Executes 100% locally without internet connectivity or consuming API tokens.
- **Calibrated Routing**: Uses empirical validation split to set confidence gates (`threshold = 0.40`).

### Layer B: Hosted Google Gemini API
- **Model**: `gemini-3.8-flash` via the official `google-genai` Python SDK.
- **Role**: Open-domain reasoning, summarization, deep QA, and ambiguous query disambiguation.
- **Local-Only Resiliency**: If credentials are unset or the network fails, the assistant enters Local-Only Mode gracefully without crashing.

## 3. Data Flow and Storage

- **Database**: SQLite (`backend/data/jarvis.db`).
- **Tables**:
  - `reminders`: Scheduled times, titles, completion state.
  - `memories`: Transparent user preferences, category tags, active state.
  - `tool_audit_logs`: Tool name, sanitized parameters, execution duration (ms), execution status.
  - `chat_history`: Conversation transcripts, predicted intents, routing paths.

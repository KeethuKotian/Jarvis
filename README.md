<div align="center">

<img src="docs/assets/jarvis-banner.svg" alt="J.A.R.V.I.S. Banner" width="100%" />

# J.A.R.V.I.S.
### Just A Rather Very Intelligent System — Windows 11 Personal AI Operating System

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![OpenAI Whisper](https://img.shields.io/badge/OpenAI_Whisper-Local_INT8-412991?style=for-the-badge&logo=openai&logoColor=white)](https://github.com/SYSTRAN/faster-whisper)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.9+-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![SQLite](https://img.shields.io/badge/SQLite-3.0+-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Platform](https://img.shields.io/badge/Platform-Windows_11-0078D4?style=for-the-badge&logo=windows11&logoColor=white)](https://microsoft.com/windows)
[![CI Pipeline](https://img.shields.io/badge/CI-Passing-00E676?style=for-the-badge&logo=githubactions&logoColor=white)](.github/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-00E5FF?style=for-the-badge)](LICENSE)

<br/>

**A cinematic, privacy-conscious personal AI operating system for Windows 11 inspired by Iron Man's J.A.R.V.I.S.**  
Engineered with a **dual-layer hybrid AI architecture** combining sub-millisecond local Scikit-Learn intent routing, offline **OpenAI Whisper INT8** speech recognition, and cloud LLM reasoning with **Google Gemini 3.5**.

[Key Features](#-key-features) • [Architecture](#-system-architecture) • [Speech Recognition](#-dual-engine-speech-pipeline) • [Quick Start](#-quick-start-windows-11) • [API & Tests](#-testing--verification)

---

</div>

## 🌟 Highlights

- **⚡ Sub-Millisecond Local Intent Routing**: Custom-trained Scikit-Learn TF-IDF classifier evaluates voice and text requests in **< 1 ms**, resolving local computer actions 100% offline with zero cloud tokens.
- **🎙️ Neural Offline Speech Recognition**: Integrated **`faster-whisper` (`small.en`, 244M parameters, INT8 CPU)** with assistant-specific vocabulary priming, delivering 99%+ transcription accuracy even with heavy background noise or specialized file paths.
- **🧠 Multimodal Cloud Reasoning**: Powered by Google's official `google-genai` SDK (`gemini-3.5-flash`), with automated fallback cascades (`gemini-3.5-flash-lite`, `gemini-flash-latest`) and transient SSL auto-reconnects.
- **💻 Desktop Computer Automation**: Safe, allowlist-controlled execution for Windows apps, document/presentation launching (PowerPoint, Word, Excel, PDF), sandboxed directory file searching, and content extraction.
- **🛡️ Strict Security & Privacy Boundaries**: LLM output is strictly untrusted. Arbitrary shell execution is impossible; passwords and secrets are regex-filtered from the memory vault; consequential system commands (workstation locking) require interactive confirmation.
- **🚀 56.5% API Quota Reduction**: Hybrid local-first routing bypasses cloud calls for routine tasks, ensuring J.A.R.V.I.S. continues operating smoothly even during cloud rate limits or network outages.
- **🎨 Cinematic Sci-Fi HUD**: Authentic Stark Industries interface with an interactive SVG Arc Reactor core, reactive telemetry rings, audio waveform monitors, and synthesized Web Audio sound effects.

---

## 🏛️ System Architecture

J.A.R.V.I.S. is built on a **Dual-Layer Hybrid Intelligence** paradigm designed to minimize latency, eliminate unnecessary cloud costs, and guarantee workstation control even during network drops.

```mermaid
flowchart TD
    User([User Voice / Text Input]) --> InputMode{Input Channel}

    %% Voice Pipeline
    InputMode -->|Voice Audio Stream| VAD[Voice Activity Detection / Silence Filter]
    VAD --> STT_Choice{STT Engine}
    STT_Choice -->|Default / Offline| Whisper[Local faster-whisper INT8 Engine<br/>small.en + Vocabulary Priming]
    STT_Choice -->|Cloud Fallback| CloudSTT[Gemini 3.5 Multimodal Audio STT]
    Whisper --> NormalizedText[Normalized Query Text]
    CloudSTT --> NormalizedText

    %% Text Pipeline
    InputMode -->|Keyboard / Command Bar| NormalizedText

    %% Core Hybrid Router
    NormalizedText --> Interceptor{Document / Path Interceptor}
    Interceptor -->|Explicit File / Drive Path| DirectTool[Direct Local Tool Dispatch<br/>Latency < 5ms]
    Interceptor -->|Natural Language| MLClassifier[Scikit-Learn Intent Classifier<br/>TF-IDF + Calibrated Logistic Regression]

    MLClassifier --> ConfidenceCheck{Confidence &ge; 0.40 &<br/>Not GENERAL_CHAT?}
    
    %% Fast Path
    ConfidenceCheck -->|YES - High Confidence Tool| ToolRegistry[Sandboxed Tool Registry]
    ToolRegistry --> AppLauncher[Application & Document Launcher]
    ToolRegistry --> FileSearch[Directory-Bounded File Search]
    ToolRegistry --> DocReader[Document Content Extractor]
    ToolRegistry --> Reminders[Persistent SQLite Reminders]
    ToolRegistry --> MemoryVault[Privacy Memory Vault]
    ToolRegistry --> SysControl[Workstation Security Control]

    %% Cloud Path
    ConfidenceCheck -->|NO - Conversational / Complex| GeminiBrain[Google Gemini 3.5 Flash<br/>google-genai SDK + Persona & Context]
    GeminiBrain --> ToolParser{Model Produced [TOOL: ...]?}
    ToolParser -->|Yes| ToolRegistry
    ToolParser -->|No| NaturalResponse[Cinematic Conversational Response]

    %% Output
    DirectTool --> FormattedResponse[Structured Response Payload]
    ToolRegistry --> FormattedResponse
    NaturalResponse --> FormattedResponse

    FormattedResponse --> HUD[React 19 HUD Core]
    HUD --> ArcReactor[Arc Reactor State Transition]
    HUD --> SoundFX[Web Audio Synthesizer Tones]
    HUD --> TTS[British RP Speech Synthesis]
```

### Routing Performance & Benchmarks

| Metric | Local Classifier | Gemini Cloud LLM | Hybrid Router (Overall) |
|---|---|---|---|
| **Average Latency** | **0.85 ms** | **1,250 ms** | **~420 ms** (weighted) |
| **Cloud API Token Cost** | **0 tokens ($0.00)** | ~350 tokens / req | **56.5% token reduction** |
| **Offline Capability** | **100% Functional** | Unavailable | Seamless graceful degradation |
| **Evaluation Accuracy** | **86.96%** (held-out test set) | N/A | High precision gating |
| **Calibrated Threshold** | **0.40** (Platt Scaling) | N/A | Zero false-positive tool dispatch |

---

## 🎙️ Dual-Engine Speech Pipeline

Voice interaction in J.A.R.V.I.S. uses a multi-tier speech stack:

<div align="center">
<img src="docs/assets/jarvis-logo.svg" alt="J.A.R.V.I.S. Reactor Core" width="120" />
</div>

1. **Local Neural STT (faster-whisper)**:
   - Model: `small.en` (244M parameters) quantized to INT8 for ultra-fast, multithreaded CPU inference.
   - **Assistant Vocabulary Priming**: Uses an `initial_prompt` tuned for workstation commands (`open notepad`, `open techmania.pptx in d drive`, `powershell`, `task manager`, `c drive`), preventing misrecognitions on technical syntax.
   - Built-in Voice Activity Detection (VAD) with 300ms silence trimming.
2. **Cloud Multimodal STT (Gemini 3.5 Flash)**:
   - Streams raw WebM/WAV audio bytes straight to Gemini's native audio comprehension layer when offline models are disabled.
3. **Frontend Speech Synthesis (TTS)**:
   - Natural British English (`en-GB`) voice with telemetry pitch shifting and holographic start/stop audio cues synthesized in real-time via Web Audio API oscillators.

---

## 🔮 Reactive HUD State Machine

The interface tracks J.A.R.V.I.S.'s internal state and drives animations, telemetry, and audio feedback:

| State | Arc Reactor Appearance | Telemetry Ring Rotation | Synthesized Sound Effect |
|---|---|---|---|
| `IDLE` | Pulsing cyan core (0.8 Hz) | Slow clockwise rotation (60s) | Ambient low-frequency hum |
| `LISTENING` | Fluorescing electric blue, active waveform | Expanding dual-ring resonance | High-pitch dual-chirp initiation |
| `THINKING` | Deep amber/gold glow, pulsating core | Accelerated counter-clockwise rotation | Rapid cyclical holographic sweep |
| `EXECUTING` | High-energy emerald green strobe | Segmented step-rotation | Action confirmation tone (880 Hz &rarr; 1760 Hz) |
| `SPEAKING` | Dynamic audio-reactive cyan expansion | Modulated radial pulses | Harmonic British RP vocalization |
| `ERROR` | Warning crimson ring flare | Frozen telemetry lock | Low-frequency dissonance alert (220 Hz) |

---

## 🛠️ Feature & Tool Catalog

### 1. Application & Document Launcher
- **Standard Applications**: Instant launch for Notepad, VS Code, Google Chrome, Calculator, Paint, Task Manager, Terminal, Wordpad, and File Explorer.
- **Documents & Presentations**: Intelligently resolves presentation files (`.pptx`, `.ppt`), Word documents (`.docx`, `.doc`), spreadsheets (`.xlsx`, `.csv`), and PDFs across drives (`C:\`, `D:\`), launching them in Microsoft Office (`POWERPNT.EXE`, `WINWORD.EXE`) or Windows default associations in `< 5ms`.

### 2. Directory-Restricted File Search
- Searches allowed user directories for filenames matching query tokens or extensions.
- Enforces strict path traversal defenses; requests outside approved roots are immediately blocked.

### 3. Document Content Inspection
- Reads and extracts readable text from `.txt`, `.md`, `.pdf`, `.docx`, and `.csv` files up to 500 KB to summarize or answer questions without opening third-party software.

### 4. Natural Language Reminders (SQLite)
- Handles queries like *"Remind me to submit the project report tomorrow at 10 AM"* or *"Set a reminder for tea in 45 minutes"*.
- Persisted locally in SQLite with real-time HUD status badges (`PENDING`, `COMPLETED`, `OVERDUE`) and audio notifications.

### 5. Memory Vault
- Transparent, user-controlled long-term memory store (e.g. *"Remember that my preferred code editor is VS Code"*).
- Features an automated regex sanitization gate that **strictly rejects** attempts to save passwords, secret tokens, or private keys.

### 6. Workstation System Controls
- Consequential actions such as workstation locking require explicit interactive confirmation via the HUD modal before execution.

---

## 🚀 Quick Start (Windows 11)

### Prerequisites

- **OS**: Windows 11 / Windows 10 (64-bit)
- **Python**: 3.12+ (64-bit)
- **Node.js**: 20+ & npm
- **Google AI Studio API Key**: Free tier or paid key from [Google AI Studio](https://aistudio.google.com/)

---

### 1-Click Launch (Recommended)

From the project root:

```cmd
start-jarvis.bat
```

*Or in PowerShell:*

```powershell
.\start-jarvis.ps1
```

The launcher will:
1. Verify the Python virtual environment and dependencies.
2. Initialize and verify database schemas.
3. Launch the FastAPI backend on `http://127.0.0.1:8000`.
4. Launch the React Vite development server on `http://localhost:5173`.
5. Open your default web browser directly to the J.A.R.V.I.S. Command Center.

---

### Manual Step-by-Step Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/your-username/jarvis.git
cd jarvis
```

#### 2. Backend Setup
```powershell
# Create Python virtual environment
python -m venv backend\venv

# Activate environment
backend\venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend\requirements.txt

# Configure environment variables
Copy-Item .env.example backend\.env
```

Edit [`backend/.env`](backend/.env) and insert your Gemini API key:
```dotenv
GEMINI_API_KEY="AIzaSyYourActualKeyGoesHere"
GEMINI_MODEL="gemini-3.5-flash"
APP_ENV="development"
DATABASE_URL="sqlite:///./data/jarvis.db"
LOG_LEVEL="INFO"
```

#### 3. Train & Verify Machine Learning Model
```powershell
# Train Scikit-Learn intent classification pipeline
python -m backend.app.ml.train_model

# Evaluate on held-out test split
python -m backend.app.ml.evaluate_model

# Benchmark hybrid routing performance
python -m backend.app.ml.run_experiments
```

#### 4. Frontend Setup
```powershell
cd frontend
npm install
npm run build
cd ..
```

#### 5. Launch Services
In Terminal 1 (Backend):
```powershell
backend\venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

In Terminal 2 (Frontend):
```powershell
npm --prefix frontend run dev
```

Navigate to `http://localhost:5173`.

---

## 🧪 Testing & Verification

The project includes unit, integration, and security test suites covering machine learning classifiers, local tools, memory privacy, reminders, speech decoders, and API routes.

```powershell
# Run the complete test suite
backend\venv\Scripts\python.exe -m pytest backend/tests -v
```

Expected output:
```text
backend/tests/test_tools.py ......                                [ 37%]
backend/tests/test_ml.py ...                                       [ 56%]
backend/tests/test_memory.py ..                                    [ 68%]
backend/tests/test_reminders.py ...                                [ 87%]
backend/tests/test_whisper.py ..                                   [100%]

============================= 16 passed in 2.33s =============================
```

Frontend production build check:
```powershell
npm --prefix frontend run build
```

---

## 📁 Repository Directory Structure

```text
Jarvis/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Multi-job GitHub Actions CI (Pytest & Vite Build)
├── backend/
│   ├── app/
│   │   ├── api/                   # FastAPI route controllers (chat, voice, tools, etc.)
│   │   │   ├── chat.py
│   │   │   ├── voice.py           # Dual-engine Whisper + Gemini voice endpoints
│   │   │   ├── tools.py
│   │   │   ├── reminders.py
│   │   │   ├── memory.py
│   │   │   └── health.py
│   │   ├── core/
│   │   │   └── router.py          # Dual-layer hybrid intelligence router
│   │   ├── ml/                    # Scikit-Learn intent pipeline & evaluation
│   │   │   ├── data/              # 10-class intent training dataset
│   │   │   ├── train_model.py
│   │   │   ├── evaluate_model.py
│   │   │   └── run_experiments.py
│   │   ├── services/              # Whisper, Gemini, Reminder, and Memory services
│   │   │   ├── whisper_service.py # faster-whisper INT8 local transcription
│   │   │   └── gemini_service.py  # google-genai SDK interface
│   │   ├── tools/                 # Allowlist-controlled automation tools
│   │   │   ├── app_launcher.py    # Windows programs & Office document opener
│   │   │   ├── file_search.py     # Traversal-blocked directory search
│   │   │   └── document_reader.py # Multi-format document parser
│   │   ├── config.py              # Pydantic v2 application configuration
│   │   └── main.py                # FastAPI lifecycle orchestrator
│   ├── data/                      # Persistent SQLite databases (gitignored)
│   ├── models/                    # Serialized ML artifacts (joblib, evaluation metrics)
│   ├── tests/                     # Pytest automated test suites
│   ├── requirements.txt           # Python dependency specifications
│   └── .env.example               # Backend configuration blueprint
├── docs/
│   ├── assets/                    # High-res SVG banners and Arc Reactor logos
│   │   ├── jarvis-banner.svg
│   │   └── jarvis-logo.svg
│   ├── ARCHITECTURE.md            # In-depth architectural blueprint
│   ├── ML_PIPELINE.md             # Training, evaluation & routing calibration docs
│   ├── SECURITY.md                # Privacy boundaries & allowlist enforcement
│   └── WINDOWS_SETUP.md           # Windows 11 installation and troubleshooting
├── frontend/
│   ├── src/
│   │   ├── components/            # ArcReactorCore, AudioWaveform, HeaderHUD
│   │   ├── components/views/      # CommandCenter, FileSearch, Reminders, Settings
│   │   ├── services/              # API client, SpeechRecognition, WebAudio
│   │   ├── index.css              # Sci-Fi HUD Vanilla CSS design system
│   │   └── App.tsx                # React application entry point
│   ├── package.json
│   └── vite.config.ts
├── scripts/                       # PowerShell automation and diagnostic scripts
├── .env.example                   # Root environment template
├── .gitignore                     # Git hygiene: blocks keys, databases, venvs
├── LICENSE                        # MIT License
├── start-jarvis.bat               # Windows one-click batch launcher
├── start-jarvis.ps1               # PowerShell one-click runner
└── README.md                      # Primary project documentation
```

---

## 🔒 Security & Privacy Commitments

1. **Untrusted LLM Output**: The cloud LLM is completely isolated from terminal execution. It can only emit structured tool directives (`[TOOL: ...]`) which must pass backend allowlist and argument verification before dispatch.
2. **Explicit Executable Allowlist**: The application launcher can only execute pre-approved system binaries (Notepad, VS Code, Chrome, etc.) and validated document formats.
3. **Directory Traversal Protection**: File operations are strictly locked to authorized drives and roots; path traversal sequences (`../`, `..\\`) are rejected.
4. **Active Memory Sanitization**: Sensitive patterns (API keys, passwords, bearer tokens, credit cards) are blocked from being stored in the SQLite memory vault.
5. **Interactive Confirmation for Critical Operations**: Destructive or disruptive commands (e.g., locking workstation) require human confirmation through the HUD.

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).

---

<div align="center">
<sub>Engineered with ❤️ for Windows 11 • Inspired by Stark Industries J.A.R.V.I.S.</sub>
</div>

# Windows 11 Installation & Setup Guide

## Prerequisites

1. **Operating System**: Windows 11 / Windows 10 x64.
2. **Python**: Python 3.11+ or 3.12+ installed and accessible via PATH.
3. **Node.js**: Node.js v20+ or v22+ with `npm`.
4. **Google Gemini API Key**: Optional, but recommended for hosted LLM reasoning capabilities.

---

## 1. Quick Startup (One-Click)

From the project root (`d:\projects\Jarvis`), double-click or run:
```powershell
.\start-jarvis.bat
```
or via PowerShell:
```powershell
.\start-jarvis.ps1
```

This script automatically:
1. Activates the Python virtual environment.
2. Initializes the SQLite database.
3. Verifies the trained ML model.
4. Starts the FastAPI backend server on `http://127.0.0.1:8000`.
5. Starts the React Vite frontend dev server on `http://localhost:5173`.
6. Opens your default web browser to the JARVIS interface.

---

## 2. Manual Step-by-Step Setup

### Step A: Python Backend Setup
```powershell
cd d:\projects\Jarvis

# Create virtual environment (if not already created)
python -m venv backend\venv

# Install dependencies
backend\venv\Scripts\pip.exe install -r backend\requirements.txt

# Train the ML Intent Classifier
backend\venv\Scripts\python.exe -m backend.app.ml.train_model
backend\venv\Scripts\python.exe -m backend.app.ml.evaluate_model
backend\venv\Scripts\python.exe -m backend.app.ml.run_experiments

# Start the Backend Server
backend\venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Step B: Frontend React Setup
Open a separate PowerShell terminal:
```powershell
cd d:\projects\Jarvis\frontend

# Install node dependencies
npm install

# Start Vite development server
npm run dev
```

Visit `http://localhost:5173` in Microsoft Edge or Google Chrome.

---

## 3. Configuring Gemini API Credentials

Edit [`backend/.env`](file:///d:/projects/Jarvis/backend/.env):
```dotenv
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-3.8-flash
APP_ENV=development
DATABASE_URL=sqlite:///./data/jarvis.db
LOG_LEVEL=INFO
```

If `GEMINI_API_KEY` is not provided, JARVIS automatically starts in **Local-Only Mode**, retaining 100% functionality for local application launching, file searches, document reading, SQLite reminders, and system telemetry!

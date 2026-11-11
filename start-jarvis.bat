@echo off
title JARVIS Personal AI Assistant
echo =========================================================
echo       J.A.R.V.I.S. Personal AI Assistant Launcher
echo =========================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Python virtual environment...
if not exist "backend\venv\Scripts\python.exe" (
    echo Virtual environment not found. Creating backend\venv...
    python -m venv backend\venv
    backend\venv\Scripts\pip.exe install -r backend\requirements.txt
)

echo [2/3] Checking trained ML model artifacts...
if not exist "backend\models\intent_classifier.joblib" (
    echo Training local intent classification model...
    backend\venv\Scripts\python.exe -m backend.app.ml.train_model
    backend\venv\Scripts\python.exe -m backend.app.ml.evaluate_model
    backend\venv\Scripts\python.exe -m backend.app.ml.run_experiments
)

echo [3/3] Launching JARVIS Backend & Frontend...
start "JARVIS Backend Server" cmd /k "backend\venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"
timeout /t 2 /nobreak >nul

cd frontend
start "JARVIS Futuristic HUD" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

start http://localhost:5173

echo.
echo JARVIS is active at http://localhost:5173
echo Backend API documentation at http://127.0.0.1:8000/docs
echo.
pause

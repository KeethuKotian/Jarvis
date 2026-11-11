Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "      J.A.R.V.I.S. Personal AI Assistant Launcher        " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Virtual Environment & Requirements
if (!(Test-Path "$Root\backend\venv\Scripts\python.exe")) {
    Write-Host "[1/3] Setting up Python virtual environment..." -ForegroundColor Yellow
    python -m venv "$Root\backend\venv"
    & "$Root\backend\venv\Scripts\pip.exe" install -r "$Root\backend\requirements.txt"
} else {
    Write-Host "[1/3] Python virtual environment ready." -ForegroundColor Green
}

# 2. Check ML model
if (!(Test-Path "$Root\backend\models\intent_classifier.joblib")) {
    Write-Host "[2/3] Training custom intent classification model..." -ForegroundColor Yellow
    & "$Root\backend\venv\Scripts\python.exe" -m backend.app.ml.train_model
    & "$Root\backend\venv\Scripts\python.exe" -m backend.app.ml.evaluate_model
    & "$Root\backend\venv\Scripts\python.exe" -m backend.app.ml.run_experiments
} else {
    Write-Host "[2/3] Local ML model artifact loaded." -ForegroundColor Green
}

# 3. Launch Backend & Frontend
Write-Host "[3/3] Launching JARVIS Core Subsystems..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root'; & '$Root\backend\venv\Scripts\python.exe' -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"
Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\frontend'; npm run dev"
Start-Sleep -Seconds 3

Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "JARVIS operating system active on http://localhost:5173" -ForegroundColor Green
Write-Host "Backend API docs available at http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host ""

$Root = Split-Path -Parent $PSScriptRoot
Write-Host "Starting JARVIS Backend Server..." -ForegroundColor Cyan
Set-Location $Root
& "$Root\backend\venv\Scripts\python.exe" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

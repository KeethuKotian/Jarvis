$Root = Split-Path -Parent $PSScriptRoot
Write-Host "Running JARVIS Automated Test Suite..." -ForegroundColor Cyan
Set-Location $Root
& "$Root\backend\venv\Scripts\python.exe" -m pytest backend/tests -v

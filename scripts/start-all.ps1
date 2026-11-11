$Root = Split-Path -Parent $PSScriptRoot
Write-Host "Launching All JARVIS Subsystems..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-File", "$PSScriptRoot\start-backend.ps1"
Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList "-NoExit", "-File", "$PSScriptRoot\start-frontend.ps1"
Start-Sleep -Seconds 3

Start-Process "http://localhost:5173"

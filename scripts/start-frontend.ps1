$Root = Split-Path -Parent $PSScriptRoot
Write-Host "Starting JARVIS Futuristic Frontend Dev Server..." -ForegroundColor Cyan
Set-Location "$Root\frontend"
npm run dev

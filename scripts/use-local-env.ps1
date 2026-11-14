# Activa desarrollo: copia .env.development → .env
$FrontendRoot = Split-Path $PSScriptRoot -Parent
$devFile = Join-Path $FrontendRoot ".env.development"
$activeFile = Join-Path $FrontendRoot ".env"

if (-not (Test-Path $devFile)) {
    Write-Error "No se encontró .env.development. Copia .env.development.example a .env.development."
    exit 1
}

Copy-Item $devFile $activeFile -Force
Write-Host "Frontend en modo DESARROLLO (.env.development → .env)."
Write-Host "VITE_API_URL según .env.development."
Write-Host "Para producción: .\scripts\use-production-env.ps1"

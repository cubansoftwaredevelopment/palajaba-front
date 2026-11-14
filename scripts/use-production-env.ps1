# Activa producción: copia .env.production → .env
$FrontendRoot = Split-Path $PSScriptRoot -Parent
$productionFile = Join-Path $FrontendRoot ".env.production"
$activeFile = Join-Path $FrontendRoot ".env"

if (-not (Test-Path $productionFile)) {
    Write-Error "No se encontró .env.production. Copia .env.production.example a .env.production."
    exit 1
}

Copy-Item $productionFile $activeFile -Force
Write-Host "Frontend en modo PRODUCCIÓN (.env.production → .env)."

# Restaura la configuración de producción desde .env.production
$FrontendRoot = Split-Path $PSScriptRoot -Parent
$productionFile = Join-Path $FrontendRoot ".env.production"
$activeFile = Join-Path $FrontendRoot ".env"

if (-not (Test-Path $productionFile)) {
    Write-Error "No existe frontend/.env.production. Ejecuta primero use-local-env.ps1 o crea el respaldo manualmente."
    exit 1
}

Copy-Item $productionFile $activeFile -Force
Write-Host "Frontend en modo PRODUCCIÓN (.env.production restaurado)."

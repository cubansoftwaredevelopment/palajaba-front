# Activa desarrollo local. Guarda .env actual en .env.production si aún no existe.
$FrontendRoot = Split-Path $PSScriptRoot -Parent
$productionFile = Join-Path $FrontendRoot ".env.production"
$localFile = Join-Path $FrontendRoot ".env.local.dev"
$activeFile = Join-Path $FrontendRoot ".env"

if (-not (Test-Path $localFile)) {
    Write-Error "No se encontró .env.local.dev"
    exit 1
}

if (-not (Test-Path $productionFile)) {
    if (Test-Path $activeFile) {
        Copy-Item $activeFile $productionFile
        Write-Host "Respaldo de producción creado: frontend/.env.production"
    } else {
        Write-Warning "No había .env activo; no se creó respaldo."
    }
}

Copy-Item $localFile $activeFile -Force
Write-Host "Frontend en modo LOCAL (VITE_API_URL -> backend :8081)."
Write-Host "Para volver a producción: .\scripts\use-production-env.ps1"

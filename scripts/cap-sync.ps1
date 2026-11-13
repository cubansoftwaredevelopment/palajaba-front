# Build web + cap sync, con Node 22 (Capacitor CLI 8 no arranca en Node 20).
$ErrorActionPreference = "Stop"
$FrontRoot = Split-Path -Parent $PSScriptRoot

. (Join-Path $PSScriptRoot "ensure-node22.ps1")
Ensure-Node22
Set-Location $FrontRoot

Write-Output "Node $(node -v)"
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx cap sync
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

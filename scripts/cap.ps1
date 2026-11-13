# Ejecuta la CLI de Capacitor con Node 22.
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$CapArgs
)

$ErrorActionPreference = "Stop"
$FrontRoot = Split-Path -Parent $PSScriptRoot

. (Join-Path $PSScriptRoot "ensure-node22.ps1")
Ensure-Node22
Set-Location $FrontRoot

if (-not $CapArgs -or $CapArgs.Count -eq 0) {
    throw "Falta el comando de Capacitor. Ejemplo: open android"
}

Write-Output "Node $(node -v)"
npx cap @CapArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

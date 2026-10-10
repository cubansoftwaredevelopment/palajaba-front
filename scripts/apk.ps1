# Genera el bundle web, lo copia a Android e iOS, y deja el APK de prueba.
$ErrorActionPreference = "Stop"
$FrontRoot = Split-Path -Parent $PSScriptRoot

function Ensure-Node22 {
    $version = $null
    try {
        $version = (& node -v)
    } catch {
        $version = $null
    }

    if ($version -match '^v(\d+)' -and [int]$Matches[1] -ge 22) {
        return
    }

    $portable = Join-Path $env:LOCALAPPDATA "Programs\node-v22.23.3-win-x64"
    $portableNode = Join-Path $portable "node.exe"
    if (Test-Path $portableNode) {
        $env:PATH = "$portable;" + $env:PATH
        return
    }

    throw "Capacitor necesita Node.js 22 o superior. La versión actual es $version."
}

function Ensure-JavaHome {
    if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME "bin\java.exe"))) {
        return
    }

    $studioJdk = "C:\Program Files\Android\Android Studio\jbr"
    if (Test-Path (Join-Path $studioJdk "bin\java.exe")) {
        $env:JAVA_HOME = $studioJdk
        $env:PATH = "$(Join-Path $studioJdk 'bin');" + $env:PATH
        return
    }

    throw "No se encontró Java. Instala Android Studio o define JAVA_HOME."
}

Ensure-Node22
Ensure-JavaHome
Set-Location $FrontRoot

Write-Output "Node $(node -v)"
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx cap sync
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Push-Location (Join-Path $FrontRoot "android")
try {
    .\gradlew.bat assembleDebug
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
    Pop-Location
}

$apkSource = Join-Path $FrontRoot "android\app\build\outputs\apk\debug\app-debug.apk"
$apkDir = Join-Path $FrontRoot "apk"
New-Item -ItemType Directory -Force -Path $apkDir | Out-Null
$apkTarget = Join-Path $apkDir "PaLaJaba.apk"
Copy-Item $apkSource $apkTarget -Force

Write-Output ""
Write-Output "APK Android: $apkTarget"
Write-Output "Bundle iOS: $(Join-Path $FrontRoot 'ios\App\App\public')"
Write-Output "El IPA de iOS se compila en un Mac con Xcode; aquí quedó el bundle web actualizado."

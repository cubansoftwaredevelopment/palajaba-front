# Genera el bundle web, sincroniza Capacitator y deja el APK de prueba.
# IMPORTANTE: no usar -Version (lo consume powershell.exe). Usar -AppVersion.
# Entorno: -Prod / -Dev  (o -Env prod|dev). Copia .env.production / .env.development → .env
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[0-9A-Za-z][0-9A-Za-z._+-]*$')]
    [Alias('V')]
    [string]$AppVersion,

    [int]$VersionCode = 0,

    [ValidateSet('dev', 'prod', 'development', 'production')]
    [string]$Env = '',

    [switch]$Prod,
    [switch]$Dev
)

$ErrorActionPreference = "Stop"
$FrontRoot = Split-Path -Parent $PSScriptRoot

. (Join-Path $PSScriptRoot "ensure-node22.ps1")

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

function Update-AndroidVersion {
    param(
        [string]$GradlePath,
        [string]$VersionName,
        [int]$Code
    )

    if (-not (Test-Path $GradlePath)) {
        throw "No existe $GradlePath"
    }

    $content = Get-Content -Raw -Path $GradlePath
    if ($content -notmatch 'versionCode\s+\d+') {
        throw "No se encontró versionCode en $GradlePath"
    }
    if ($content -notmatch 'versionName\s+"[^"]+"') {
        throw "No se encontró versionName en $GradlePath"
    }

    $currentCode = [int]([regex]::Match($content, 'versionCode\s+(\d+)').Groups[1].Value)
    $nextCode = if ($Code -gt 0) { $Code } else { [Math]::Max($currentCode + 1, 1) }

    $updated = [regex]::Replace($content, 'versionCode\s+\d+', "versionCode $nextCode")
    $updated = [regex]::Replace($updated, 'versionName\s+"[^"]+"', "versionName `"$VersionName`"")
    Set-Content -Path $GradlePath -Value $updated -NoNewline
    return $nextCode
}

function Update-IosMarketingVersion {
    param(
        [string]$PlistPath,
        [string]$VersionName
    )

    if (-not (Test-Path $PlistPath)) {
        Write-Output "Aviso: no se encontró Info.plist iOS; se omite."
        return
    }

    $plist = Get-Content -Raw -Path $PlistPath
    if ($plist -match 'CFBundleShortVersionString') {
        $plist = [regex]::Replace(
            $plist,
            '(?s)(<key>CFBundleShortVersionString</key>\s*<string>)[^<]*(</string>)',
            "`${1}$VersionName`${2}"
        )
        Set-Content -Path $PlistPath -Value $plist -NoNewline
    }
}

function Resolve-ViteMode {
    if ($Prod -and $Dev) {
        throw "Usa solo uno: -Prod o -Dev."
    }
    if ($Prod) { return 'production' }
    if ($Dev) { return 'development' }
    if ($Env) {
        if ($Env -in @('dev', 'development')) { return 'development' }
        return 'production'
    }
    throw "Indica el entorno: -Prod o -Dev (ej. npm run apk:prod -- -AppVersion 1.0.7)."
}

function Use-FrontEnvFile {
    param([string]$Mode)

    $sourceName = ".env.$Mode"
    $sourcePath = Join-Path $FrontRoot $sourceName
    $activePath = Join-Path $FrontRoot ".env"
    if (-not (Test-Path $sourcePath)) {
        $example = Join-Path $FrontRoot "$sourceName.example"
        throw "No existe $sourceName. Copia $sourceName.example a $sourceName y ajústalo."
    }

    Copy-Item $sourcePath $activePath -Force

    Get-Content $sourcePath | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith('#')) { return }
        $eq = $line.IndexOf('=')
        if ($eq -lt 1) { return }
        $key = $line.Substring(0, $eq).Trim()
        $value = $line.Substring($eq + 1).Trim()
        Set-Item -Path "Env:$key" -Value $value
    }

    Write-Output "Entorno: $Mode ($sourceName → .env)"
    Write-Output "VITE_API_URL=$($env:VITE_API_URL)"
}

function Invoke-FrontProductionBuild {
    param([string]$Mode)

    npx vite build --mode $Mode
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    node scripts/copy-spa-fallback.mjs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    node scripts/generate-sitemap.mjs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    node scripts/generate-store-seo-pages.mjs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    node scripts/verify-sitemap.mjs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    node scripts/verify-store-seo-pages.mjs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    node scripts/verify-checkout-flow.mjs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Ensure-Node22
Ensure-JavaHome
Set-Location $FrontRoot

$viteMode = Resolve-ViteMode
Use-FrontEnvFile -Mode $viteMode

$gradlePath = Join-Path $FrontRoot "android\app\build.gradle"
$iosPlist = Join-Path $FrontRoot "ios\App\App\Info.plist"
$appliedCode = Update-AndroidVersion -GradlePath $gradlePath -VersionName $AppVersion -Code $VersionCode
Update-IosMarketingVersion -PlistPath $iosPlist -VersionName $AppVersion

Write-Output "Node $(node -v)"
Write-Output "Android versionName=$AppVersion versionCode=$appliedCode"
Invoke-FrontProductionBuild -Mode $viteMode

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
$apkFileName = "palajaba$AppVersion.apk"
$apkTarget = Join-Path $apkDir $apkFileName
Copy-Item $apkSource $apkTarget -Force

Write-Output ""
Write-Output "APK Android: $apkTarget"
Write-Output "Modo Vite: $viteMode"
Write-Output "versionName embebido: $AppVersion (versionCode $appliedCode)"
Write-Output "Sube este APK en Admin → Apps con versión exacta: $AppVersion"
Write-Output "Bundle iOS: $(Join-Path $FrontRoot 'ios\App\App\public')"
Write-Output "El IPA de iOS se compila en un Mac con Xcode; aquí quedó el bundle web actualizado."

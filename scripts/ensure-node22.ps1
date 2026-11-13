# Capacitor CLI 8 exige Node.js 22 o superior.
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

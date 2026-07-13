$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$profile = Join-Path $root '.edge-render-profile'
$version = (Get-Content -Raw (Join-Path $root 'VERSION')).Trim()
$edgeCandidates = @(
    'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    'C:\Program Files\Microsoft\Edge\Application\msedge.exe'
)
$edge = $edgeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $edge) { throw 'Microsoft Edge is required for the rendered-page check.' }

function Get-FreePort {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
    $listener.Start()
    try { return ([System.Net.IPEndPoint]$listener.LocalEndpoint).Port }
    finally { $listener.Stop() }
}

function Stop-TestEdge {
    param([string]$ProfilePath)
    for ($attempt = 0; $attempt -lt 5; $attempt++) {
        $matches = Get-CimInstance Win32_Process | Where-Object {
            $_.Name -eq 'msedge.exe' -and $_.CommandLine -like "*$ProfilePath*"
        }
        foreach ($process in $matches) {
            Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
        }
        if (-not $matches) { break }
        Start-Sleep -Milliseconds 500
    }
}

$workspace = (Resolve-Path -LiteralPath $root).Path
if (-not $profile.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'Unsafe browser profile path.'
}
$webPort = Get-FreePort
$debugPort = Get-FreePort
$server = $null

try {
    $server = Start-Process -FilePath 'python' -ArgumentList @('-m', 'http.server', "$webPort", '--bind', '127.0.0.1') -WorkingDirectory $workspace -WindowStyle Hidden -PassThru
    $probe = $null
    for ($attempt = 0; $attempt -lt 20 -and -not $probe; $attempt++) {
        try { $probe = Invoke-WebRequest -Uri "http://127.0.0.1:$webPort/index.html" -TimeoutSec 1 }
        catch { Start-Sleep -Milliseconds 200 }
    }
    if (-not $probe -or $probe.StatusCode -ne 200) { throw 'Local test server did not start.' }

    Start-Process -FilePath $edge -ArgumentList @(
        '--headless=new',
        '--disable-gpu',
        '--disable-background-networking',
        "--remote-debugging-port=$debugPort",
        "--user-data-dir=$profile",
        "http://127.0.0.1:$webPort/index.html"
    ) -WindowStyle Hidden | Out-Null

    $target = $null
    for ($attempt = 0; $attempt -lt 40 -and -not $target; $attempt++) {
        try {
            $tabs = Invoke-RestMethod -Uri "http://127.0.0.1:$debugPort/json/list" -TimeoutSec 1
            $target = $tabs | Where-Object {
                $_.type -eq 'page' -and $_.url -like "http://127.0.0.1:$webPort/index.html*"
            } | Select-Object -First 1
        }
        catch {}
        if (-not $target) { Start-Sleep -Milliseconds 250 }
    }
    if (-not $target) { throw 'Edge did not expose the local page for inspection.' }

    $env:EDGE_CDP_WS = $target.webSocketDebuggerUrl
    $env:SITE_EXPECTED_VERSION = $version
    & node (Join-Path $PSScriptRoot 'check-render.mjs')
    if ($LASTEXITCODE -ne 0) { throw 'Rendered DOM or computed-style check failed.' }
    Write-Output "Rendered website v$version verified in Microsoft Edge."
}
finally {
    Remove-Item Env:EDGE_CDP_WS -ErrorAction SilentlyContinue
    Remove-Item Env:SITE_EXPECTED_VERSION -ErrorAction SilentlyContinue
    Stop-TestEdge -ProfilePath $profile
    if ($server -and -not $server.HasExited) {
        Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
    Stop-TestEdge -ProfilePath $profile
    if (Test-Path -LiteralPath $profile) {
        $resolved = (Resolve-Path -LiteralPath $profile).Path
        if (-not $resolved.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw 'Unsafe browser profile cleanup path.'
        }
        for ($attempt = 0; $attempt -lt 5 -and (Test-Path -LiteralPath $resolved); $attempt++) {
            try { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }
            catch {
                Stop-TestEdge -ProfilePath $profile
                Start-Sleep -Milliseconds 500
            }
        }
        if (Test-Path -LiteralPath $resolved) { throw 'Browser profile cleanup failed.' }
    }
}

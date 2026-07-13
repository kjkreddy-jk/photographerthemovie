$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$reportDir = Join-Path $root '.lighthouseci'
$reportPath = Join-Path $reportDir 'homepage.report.json'
$errorPath = Join-Path $reportDir 'lighthouse.stderr.log'
$browserCandidates = @(
    'C:\Program Files\Google\Chrome\Application\chrome.exe',
    'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
    'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    'C:\Program Files\Microsoft\Edge\Application\msedge.exe'
)
$browser = $browserCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $browser) { throw 'Microsoft Edge or Google Chrome is required for Lighthouse.' }

function Get-FreePort {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
    $listener.Start()
    try { return ([System.Net.IPEndPoint]$listener.LocalEndpoint).Port }
    finally { $listener.Stop() }
}

$port = Get-FreePort
$server = $null
Push-Location $root
try {
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
    $server = Start-Process -FilePath 'python' -ArgumentList @('-m', 'http.server', "$port", '--bind', '127.0.0.1') -WorkingDirectory $root -WindowStyle Hidden -PassThru
    $probe = $null
    for ($attempt = 0; $attempt -lt 20 -and -not $probe; $attempt++) {
        try { $probe = Invoke-WebRequest -Uri "http://127.0.0.1:$port/index.html" -TimeoutSec 1 }
        catch { Start-Sleep -Milliseconds 200 }
    }
    if (-not $probe -or $probe.StatusCode -ne 200) { throw 'Local Lighthouse server did not start.' }

    $env:CHROME_PATH = $browser
    if (Test-Path -LiteralPath $reportPath) { Remove-Item -LiteralPath $reportPath -Force }
    if (Test-Path -LiteralPath $errorPath) { Remove-Item -LiteralPath $errorPath -Force }
    & npx --yes 'lighthouse@13.3.0' "http://127.0.0.1:$port/index.html" '--only-categories=accessibility,best-practices,seo' '--output=json' "--output-path=$reportPath" '--chrome-flags=--headless=new --no-sandbox' '--quiet' 2> $errorPath
    if (-not (Test-Path -LiteralPath $reportPath)) {
        if (Test-Path -LiteralPath $errorPath) { Get-Content -LiteralPath $errorPath | Write-Output }
        throw 'Lighthouse collection failed before producing a report.'
    }
    if ($LASTEXITCODE -ne 0) { Write-Warning 'Lighthouse produced a complete report but its browser launcher could not remove a temporary Windows profile.' }
    & node (Join-Path $PSScriptRoot 'assert-lighthouse.mjs') $reportPath
    if ($LASTEXITCODE -ne 0) { throw 'Lighthouse assertions failed.' }
}
finally {
    Remove-Item Env:CHROME_PATH -ErrorAction SilentlyContinue
    if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue }
    Pop-Location
}

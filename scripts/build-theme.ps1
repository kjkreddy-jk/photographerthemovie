param(
    [switch]$CheckOnly
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$themeDir = Join-Path $root 'wp-theme\photographer-official-theme'
$zipPath = Join-Path $root 'wp-theme\photographer-official-theme.zip'
$version = (Get-Content -Raw (Join-Path $root 'VERSION')).Trim()
$sharedFiles = @('index.html', 'site.css', 'site-content.js', 'support.js', 'VERSION')

function Assert-Condition {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw $Message }
}

Push-Location $root
try {
    & node '.\scripts\verify-site.mjs'
    Assert-Condition ($LASTEXITCODE -eq 0) 'Root-site verification failed.'

    $themeStyle = Get-Content -Raw (Join-Path $themeDir 'style.css')
    Assert-Condition ($themeStyle -match "(?m)^Version:\s*$([regex]::Escape($version))\s*$") 'Theme style.css version does not match VERSION.'

    if (-not $CheckOnly) {
        foreach ($file in $sharedFiles) {
            Copy-Item -LiteralPath (Join-Path $root $file) -Destination (Join-Path $themeDir $file) -Force
        }
        Compress-Archive -Path $themeDir -DestinationPath $zipPath -CompressionLevel Optimal -Force
    }

    foreach ($file in $sharedFiles) {
        $sourceHash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $root $file)).Hash
        $themeHash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $themeDir $file)).Hash
        Assert-Condition ($sourceHash -eq $themeHash) "Theme copy is stale: $file"
    }

    $frontPage = Get-Content -Raw (Join-Path $themeDir 'front-page.php')
    foreach ($asset in @('site.css', 'site-content.js', 'support.js')) {
        Assert-Condition ($frontPage.Contains($asset)) "WordPress loader is missing $asset"
    }

    Assert-Condition (Test-Path -LiteralPath $zipPath) 'Theme ZIP is missing.'
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
    try {
        $entries = @($zip.Entries | ForEach-Object FullName)
        foreach ($file in @($sharedFiles + @('front-page.php', 'functions.php', 'index.php', 'style.css'))) {
            Assert-Condition ($entries -contains "photographer-official-theme/$file") "Theme ZIP is missing $file"
        }
    }
    finally {
        $zip.Dispose()
    }

    Write-Output "WordPress theme v$version verified: synchronized directory and ZIP package."
}
finally {
    Pop-Location
}

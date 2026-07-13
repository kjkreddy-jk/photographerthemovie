param(
    [switch]$CheckOnly
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$themeDir = Join-Path $root 'wp-theme\photographer-official-theme'
$themeGeneratedDir = Join-Path $themeDir 'assets\generated'
$zipPath = Join-Path $root 'wp-theme\photographer-official-theme.zip'
$version = (Get-Content -Raw (Join-Path $root 'VERSION')).Trim()
$componentFiles = @('HeaderSection.dc.html', 'HeroSection.dc.html', 'ReleaseSection.dc.html', 'StorySection.dc.html', 'TicketsSection.dc.html', 'VideosSection.dc.html', 'ShortsSection.dc.html', 'CastSection.dc.html', 'FooterSection.dc.html')
$sharedFiles = @('index.html', 'site.css', 'site-content.js', 'component-resources.js', 'support.js', 'VERSION') + $componentFiles
$generatedAssets = @(Get-ChildItem -LiteralPath (Join-Path $root 'assets\generated') -File | ForEach-Object Name)

function Assert-Condition {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw $Message }
}

Push-Location $root
try {
    & node '.\scripts\build-content.mjs' '--check'
    Assert-Condition ($LASTEXITCODE -eq 0) 'Structured content is invalid or stale.'
    & node '.\scripts\verify-site.mjs'
    Assert-Condition ($LASTEXITCODE -eq 0) 'Root-site verification failed.'

    $themeStyle = Get-Content -Raw (Join-Path $themeDir 'style.css')
    Assert-Condition ($themeStyle -match "(?m)^Version:\s*$([regex]::Escape($version))\s*$") 'Theme style.css version does not match VERSION.'

    if (-not $CheckOnly) {
        foreach ($file in $sharedFiles) {
            Copy-Item -LiteralPath (Join-Path $root $file) -Destination (Join-Path $themeDir $file) -Force
        }
        New-Item -ItemType Directory -Path $themeGeneratedDir -Force | Out-Null
        foreach ($staleFile in @(Get-ChildItem -LiteralPath $themeGeneratedDir -File | Where-Object Name -NotIn $generatedAssets)) {
            Remove-Item -LiteralPath $staleFile.FullName -Force
        }
        foreach ($file in $generatedAssets) {
            Copy-Item -LiteralPath (Join-Path $root "assets\generated\$file") -Destination (Join-Path $themeGeneratedDir $file) -Force
        }
        Compress-Archive -Path $themeDir -DestinationPath $zipPath -CompressionLevel Optimal -Force
    }

    foreach ($file in $sharedFiles) {
        $sourceHash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $root $file)).Hash
        $themeHash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $themeDir $file)).Hash
        Assert-Condition ($sourceHash -eq $themeHash) "Theme copy is stale: $file"
    }
    foreach ($file in $generatedAssets) {
        $sourceHash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $root "assets\generated\$file")).Hash
        $themeHash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $themeDir "assets\generated\$file")).Hash
        Assert-Condition ($sourceHash -eq $themeHash) "Theme generated asset is stale: $file"
    }
    $staleGeneratedAssets = @(Get-ChildItem -LiteralPath $themeGeneratedDir -File | Where-Object Name -NotIn $generatedAssets)
    Assert-Condition ($staleGeneratedAssets.Count -eq 0) 'Theme contains generated assets that are no longer in the source directory.'

    $frontPage = Get-Content -Raw (Join-Path $themeDir 'front-page.php')
    foreach ($asset in @('site.css', 'site-content.js', 'component-resources.js', 'support.js')) {
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
        foreach ($file in $generatedAssets) {
            Assert-Condition ($entries -contains "photographer-official-theme/assets/generated/$file") "Theme ZIP is missing generated asset $file"
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

param(
    [string]$Url = 'https://photographerthemovie.com/',
    [string]$ExpectedVersion
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
if (-not $ExpectedVersion) {
    $ExpectedVersion = (Get-Content -Raw (Join-Path $root 'VERSION')).Trim()
}

$response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 30
$headerVersion = [string]$response.Headers.'X-Photographer-Site-Version'
$metaVersion = ([regex]::Match($response.Content, '<meta name="site-version" content="([^"]+)"')).Groups[1].Value
$footerPresent = $response.Content -match ('Site v' + [regex]::Escape($ExpectedVersion))
$assetVersionPresent = $response.Content -match ('site-content\.js\?ver=' + [regex]::Escape($ExpectedVersion))
$observedVersion = if ($headerVersion) { $headerVersion } elseif ($metaVersion) { $metaVersion } else { 'legacy/unversioned' }
$cacheStatus = @($response.Headers.'X-Cache', $response.Headers.'CF-Cache-Status', $response.Headers.'X-Hcdn-Cache-Status') | Where-Object { $_ } | Select-Object -First 1

$result = [ordered]@{
    Url = $Url
    Status = $response.StatusCode
    ExpectedVersion = $ExpectedVersion
    ObservedVersion = $observedVersion
    HeaderVersion = $headerVersion
    MetaVersion = $metaVersion
    FooterMarker = $footerPresent
    CacheBustedAsset = $assetVersionPresent
    Server = [string]$response.Headers.Server
    CacheStatus = [string]$cacheStatus
    CacheControl = [string]$response.Headers.'Cache-Control'
    Age = [string]$response.Headers.Age
    ResponseDate = [string]$response.Headers.Date
}
$result.GetEnumerator() | ForEach-Object { Write-Output "$($_.Key)=$($_.Value)" }

if ($response.StatusCode -ne 200 -or $headerVersion -ne $ExpectedVersion -or $metaVersion -ne $ExpectedVersion -or -not $footerPresent -or -not $assetVersionPresent) {
    throw "Live site is not fully serving version $ExpectedVersion. Publish the synchronized theme and purge caches."
}

Write-Output "Live deployment verified at version $ExpectedVersion."

param(
    [string]$EnvFile = ".env.production"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $EnvFile)) {
    throw "Missing $EnvFile. Create it from .env.production.example first."
}

$requiredKeys = @(
    "JWT_SECRET",
    "POSTGRES_DB",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "GHCR_REPOSITORY",
    "IMAGE_TAG",
    "PUBLIC_DOMAIN",
    "LETSENCRYPT_EMAIL"
)

$pairs = @{}
Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }
    $k = $line.Substring(0, $idx).Trim()
    $v = $line.Substring($idx + 1).Trim()
    $pairs[$k] = $v
}

$missing = @()
foreach ($key in $requiredKeys) {
    if (-not $pairs.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($pairs[$key])) {
        $missing += $key
    }
}

if ($missing.Count -gt 0) {
    throw "Missing required keys in ${EnvFile}: $($missing -join ', ')"
}

if ($pairs["JWT_SECRET"].Length -lt 32) {
    throw "JWT_SECRET must be at least 32 characters."
}

if ($pairs["PUBLIC_DOMAIN"] -match "example\.com$") {
    throw "PUBLIC_DOMAIN still uses example placeholder."
}

if ($pairs["GHCR_REPOSITORY"] -match "^your-org/") {
    throw "GHCR_REPOSITORY still uses placeholder value."
}

Write-Output "Preflight passed: $EnvFile has required production keys and non-placeholder values."

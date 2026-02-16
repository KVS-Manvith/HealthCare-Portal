param(
    [Parameter(Mandatory = $true)]
    [string]$GhcrRepository,

    [Parameter(Mandatory = $true)]
    [string]$PublicDomain,

    [Parameter(Mandatory = $true)]
    [string]$LetsencryptEmail,

    [string]$OutputPath = ".env.production"
)

$ErrorActionPreference = "Stop"

function New-RandomSecret([int]$bytes = 64) {
    $data = New-Object byte[] $bytes
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $rng.GetBytes($data)
    } finally {
        $rng.Dispose()
    }
    return [Convert]::ToBase64String($data)
}

$jwtSecret = New-RandomSecret

$lines = @(
    "JWT_SECRET=$jwtSecret",
    "POSTGRES_DB=healthcare_db",
    "POSTGRES_USER=healthcare",
    "POSTGRES_PASSWORD=$(New-RandomSecret 36)",
    "GHCR_REPOSITORY=$GhcrRepository",
    "IMAGE_TAG=latest",
    "PUBLIC_DOMAIN=$PublicDomain",
    "LETSENCRYPT_EMAIL=$LetsencryptEmail",
    "POSTGRES_BACKUP_SCHEDULE=@daily",
    "POSTGRES_BACKUP_KEEP_DAYS=7",
    "POSTGRES_BACKUP_KEEP_WEEKS=4",
    "POSTGRES_BACKUP_KEEP_MONTHS=6"
)

Set-Content -Path $OutputPath -Value ($lines -join "`n") -NoNewline
Write-Output "Wrote production env file to: $OutputPath"

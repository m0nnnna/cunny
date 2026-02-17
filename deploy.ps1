<#
.SYNOPSIS
    Build and deploy NekoChat with auto-generated LiveKit keys.

.DESCRIPTION
    Every run:
      1. Generates fresh LiveKit API key + secret (via Docker)
      2. Writes them into .env (preserving your other settings)
      3. Builds and starts all containers (docker compose up --build)

    Keys flow from .env → docker-compose env vars → both LiveKit and token server.
    No manual key syncing needed.

.PARAMETER KeepKeys
    Skip key generation and reuse existing keys from .env.

.PARAMETER Down
    Stop and remove all containers instead of starting them.

.EXAMPLE
    .\deploy.ps1                  # Generate new keys + build + start
    .\deploy.ps1 -KeepKeys        # Rebuild without rotating keys
    .\deploy.ps1 -Down            # Stop everything
#>

param(
    [switch]$KeepKeys,
    [switch]$Down
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $projectRoot

try {
    # ── Stop mode ──────────────────────────────────────────────────────
    if ($Down) {
        Write-Host "`n=== Stopping NekoChat ===" -ForegroundColor Yellow
        docker compose down
        Write-Host "All containers stopped.`n" -ForegroundColor Green
        exit 0
    }

    Write-Host "`n=== NekoChat Deploy ===" -ForegroundColor Cyan

    # ── Ensure .env exists ─────────────────────────────────────────────
    if (-not (Test-Path '.env')) {
        if (Test-Path 'env.example') {
            Write-Host "  Creating .env from env.example..." -ForegroundColor Yellow
            Copy-Item 'env.example' '.env'
            Write-Host ""
            Write-Host "  IMPORTANT: Edit .env and set HOST_IP, LIVEKIT_WS_URL, TOKEN_ENDPOINT, ALLOWED_ORIGINS" -ForegroundColor Red
            Write-Host "  Then run this script again.`n" -ForegroundColor Red
            exit 1
        } else {
            Write-Error ".env not found and no env.example to copy from."
        }
    }

    # ── Parse existing .env into ordered lines ─────────────────────────
    $envLines = Get-Content '.env'

    # Helper: read a value from .env lines
    function Get-EnvValue($lines, $key) {
        foreach ($line in $lines) {
            if ($line -match "^${key}=(.+)$") { return $Matches[1].Trim() }
        }
        return $null
    }

    # Helper: set a value in .env lines (preserving order and comments)
    function Set-EnvValue($lines, $key, $value) {
        $found = $false
        $result = @()
        foreach ($line in $lines) {
            if ($line -match "^${key}=") {
                $result += "${key}=${value}"
                $found = $true
            } else {
                $result += $line
            }
        }
        if (-not $found) { $result += "${key}=${value}" }
        return $result
    }

    # ── Generate fresh LiveKit keys ────────────────────────────────────
    # Keys are generated locally (instant, no Docker pull needed).
    # Format matches LiveKit's own output: API{hex} + base64 secret.
    if (-not $KeepKeys) {
        Write-Host "  Generating fresh LiveKit API keys..." -ForegroundColor Cyan

        # Generate API key: "API" + 18 random hex chars (uppercase)
        $keyBytes = New-Object byte[] 9
        [System.Security.Cryptography.RandomNumberGenerator]::Fill($keyBytes)
        $newKey = "API" + ([BitConverter]::ToString($keyBytes) -replace '-','')

        # Generate API secret: 32 random bytes, base64 encoded
        $secretBytes = New-Object byte[] 32
        [System.Security.Cryptography.RandomNumberGenerator]::Fill($secretBytes)
        $newSecret = [Convert]::ToBase64String($secretBytes)

        $envLines = Set-EnvValue $envLines 'LIVEKIT_API_KEY' $newKey
        $envLines = Set-EnvValue $envLines 'LIVEKIT_API_SECRET' $newSecret
        $envLines | Set-Content '.env' -Encoding UTF8
        Write-Host "  New API Key:    $($newKey.Substring(0, [Math]::Min(8, $newKey.Length)))..." -ForegroundColor Green
        Write-Host "  New API Secret: $($newSecret.Substring(0, [Math]::Min(4, $newSecret.Length)))..." -ForegroundColor Green
    } else {
        Write-Host "  Keeping existing keys from .env (-KeepKeys)" -ForegroundColor DarkGray
    }

    # ── Validate required settings ─────────────────────────────────────
    $envLines = Get-Content '.env'
    $hostIp = Get-EnvValue $envLines 'HOST_IP'
    $wsUrl = Get-EnvValue $envLines 'LIVEKIT_WS_URL'
    $tokenEndpoint = Get-EnvValue $envLines 'TOKEN_ENDPOINT'
    $apiKey = Get-EnvValue $envLines 'LIVEKIT_API_KEY'
    $apiSecret = Get-EnvValue $envLines 'LIVEKIT_API_SECRET'

    $missing = @()
    if (-not $hostIp -or $hostIp -eq 'your-server-ip') { $missing += 'HOST_IP' }
    if (-not $wsUrl -or $wsUrl -match 'your-domain') { $missing += 'LIVEKIT_WS_URL' }
    if (-not $tokenEndpoint -or $tokenEndpoint -match 'your-domain') { $missing += 'TOKEN_ENDPOINT' }
    if (-not $apiKey) { $missing += 'LIVEKIT_API_KEY' }
    if (-not $apiSecret) { $missing += 'LIVEKIT_API_SECRET' }

    if ($missing.Count -gt 0) {
        Write-Host ""
        Write-Host "  Missing or placeholder values in .env:" -ForegroundColor Red
        foreach ($m in $missing) { Write-Host "    - $m" -ForegroundColor Red }
        Write-Host "  Edit .env and run again.`n" -ForegroundColor Red
        exit 1
    }

    # ── Show config summary ────────────────────────────────────────────
    Write-Host ""
    Write-Host "  Configuration:" -ForegroundColor Cyan
    Write-Host "    Host IP:         $hostIp"
    Write-Host "    LiveKit WS URL:  $wsUrl"
    Write-Host "    Token Endpoint:  $tokenEndpoint"
    Write-Host "    API Key:         $($apiKey.Substring(0, [Math]::Min(8, $apiKey.Length)))..."
    Write-Host ""

    # ── Build and start ────────────────────────────────────────────────
    Write-Host "  Building and starting containers..." -ForegroundColor Cyan
    Write-Host ""
    docker compose up --build -d

    Write-Host ""
    Write-Host "=== NekoChat Running ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Services:" -ForegroundColor Cyan
    Write-Host "    LiveKit Server:  ports 7880 (WS), 7881 (TCP), 7882 (UDP)"
    Write-Host "    Token Server:    port 3001"
    Write-Host "    Cunny:           port 8080"
    Write-Host ""
    Write-Host "  Logs:    docker compose logs -f" -ForegroundColor DarkGray
    Write-Host "  Stop:    .\deploy.ps1 -Down" -ForegroundColor DarkGray
    Write-Host "  Rebuild: .\deploy.ps1           (rotates keys)" -ForegroundColor DarkGray
    Write-Host "  Rebuild: .\deploy.ps1 -KeepKeys (same keys)" -ForegroundColor DarkGray
    Write-Host ""

} finally {
    Pop-Location
}

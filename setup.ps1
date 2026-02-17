# Cunny Voice Channels Setup (Windows)
# Creates .env from env.example if missing, generates LiveKit keys, and keeps .env and livekit.yaml in sync.

$ErrorActionPreference = "Stop"

Write-Host "========================================"
Write-Host "Cunny Voice Channels Setup"
Write-Host "========================================"
Write-Host ""

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootDir

$envPath = Join-Path $rootDir ".env"
$examplePath = Join-Path $rootDir "env.example"
$livekitPath = Join-Path $rootDir "livekit.yaml"

# Create .env from template if missing
if (-not (Test-Path $envPath)) {
    Write-Host "Creating .env file from template..."
    Copy-Item $examplePath $envPath

    # Generate LiveKit keys via Docker
    Write-Host "Generating LiveKit API keys..."
    try {
        $keysOutput = docker run --rm livekit/livekit-server generate-keys 2>&1
        $apiKeyLine = $keysOutput | Select-String -Pattern "API Key:\s*(.+)" | ForEach-Object { $_.Matches.Groups[1].Value.Trim() }
        $apiSecretLine = $keysOutput | Select-String -Pattern "API Secret:\s*(.+)" | ForEach-Object { $_.Matches.Groups[1].Value.Trim() }
        $API_KEY = ($apiKeyLine | Select-Object -First 1)
        $API_SECRET = ($apiSecretLine | Select-Object -First 1)
    } catch {
        $API_KEY = $null
        $API_SECRET = $null
    }

    if ($API_KEY -and $API_SECRET) {
        # Update .env
        (Get-Content $envPath) -replace 'LIVEKIT_API_KEY=devkey', "LIVEKIT_API_KEY=$API_KEY" `
                              -replace 'LIVEKIT_API_SECRET=secret', "LIVEKIT_API_SECRET=$API_SECRET" | Set-Content $envPath
        Write-Host "Updated .env with new API keys."

        # Update livekit.yaml so LiveKit server and token server use the same keys
        if (Test-Path $livekitPath) {
            $yaml = Get-Content $livekitPath -Raw
            $yaml = $yaml -replace '(\r?\n\s*)devkey:\s*secret', "`n  ${API_KEY}: $API_SECRET"
            Set-Content $livekitPath $yaml -NoNewline
            Write-Host "Updated livekit.yaml with same API keys (token server and LiveKit server must match)."
        }

        Write-Host "Generated new API keys."
    } else {
        Write-Host "Warning: Could not generate keys (Docker or livekit-server image may be missing)."
        Write-Host "Set them manually in .env and in livekit.yaml (under keys: section) so they match."
    }

    # Try to detect a local IP for HOST_IP
    $hostIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch "Loopback" } | Select-Object -First 1).IPAddress
    if ($hostIP) {
        (Get-Content $envPath) -replace 'HOST_IP=your-server-ip', "HOST_IP=$hostIP" | Set-Content $envPath
        Write-Host "Set HOST_IP to $hostIP in .env"
    }

    Write-Host ""
    Write-Host "IMPORTANT: Edit .env and set:"
    Write-Host "  - LIVEKIT_WS_URL (your public WebSocket URL)"
    Write-Host "  - TOKEN_ENDPOINT (your public token endpoint URL)"
    Write-Host "  - ALLOWED_ORIGINS (your Cunny domain)"
    Write-Host ""
    Read-Host "Press Enter after editing .env, or Ctrl+C to exit"
}

Write-Host ""
Write-Host "Building and starting services..."
Write-Host ""

docker compose build
docker compose up -d

Write-Host ""
Write-Host "========================================"
Write-Host "Setup Complete"
Write-Host "========================================"
Write-Host ""
Write-Host "Services: LiveKit 7880/7881/7882, Token Server 3001, Cunny 8080"
Write-Host "Configure Cunny: Settings > Voice Channels (Server URL, Token Endpoint)"
Write-Host ""

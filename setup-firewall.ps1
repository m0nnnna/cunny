#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Opens Windows Firewall ports required for NekoChat (Cinny Voice) with LiveKit.

.DESCRIPTION
    Creates inbound firewall rules for:
    - LiveKit server ports (if running LiveKit on this machine via Docker)
    - WebRTC client ports (so the browser can receive media from LiveKit)

    Run this script as Administrator:
        Right-click PowerShell -> "Run as Administrator"
        Then: .\setup-firewall.ps1

    To remove all rules created by this script:
        .\setup-firewall.ps1 -Remove
#>

param(
    [switch]$Remove
)

$RulePrefix = "NekoChat"

$Rules = @(
    # ── LiveKit Server (Docker) ──────────────────────────────────────────
    @{
        Name        = "$RulePrefix - LiveKit API (TCP 7880)"
        Protocol    = "TCP"
        LocalPort   = "7880"
        Description = "LiveKit HTTP/WebSocket API endpoint"
    },
    @{
        Name        = "$RulePrefix - LiveKit RTC/TURN (TCP 7881)"
        Protocol    = "TCP"
        LocalPort   = "7881"
        Description = "LiveKit RTC over TCP and built-in TURN relay"
    },
    @{
        Name        = "$RulePrefix - LiveKit UDP (UDP 7882)"
        Protocol    = "UDP"
        LocalPort   = "7882"
        Description = "LiveKit UDP signaling"
    },
    @{
        Name        = "$RulePrefix - LiveKit Media (UDP 50000-60000)"
        Protocol    = "UDP"
        LocalPort   = "50000-60000"
        Description = "LiveKit WebRTC media port range (RTC)"
    },

    # ── Token Server ─────────────────────────────────────────────────────
    @{
        Name        = "$RulePrefix - Token Server (TCP 3001)"
        Protocol    = "TCP"
        LocalPort   = "3001"
        Description = "LiveKit token server API"
    },

    # ── Cinny Web UI ─────────────────────────────────────────────────────
    @{
        Name        = "$RulePrefix - Cinny Web (TCP 8080)"
        Protocol    = "TCP"
        LocalPort   = "8080"
        Description = "Cinny voice web UI (Docker)"
    },

    # ── WebRTC Client (Browser) ──────────────────────────────────────────
    # Browsers use ephemeral UDP ports to receive RTC media.
    # This range covers the typical ephemeral port range on Windows.
    @{
        Name        = "$RulePrefix - WebRTC Client Media (UDP 49152-65535)"
        Protocol    = "UDP"
        LocalPort   = "49152-65535"
        Description = "Inbound UDP for browser WebRTC media (ICE candidates)"
    }
)

if ($Remove) {
    Write-Host "`n=== Removing NekoChat firewall rules ===" -ForegroundColor Yellow
    foreach ($rule in $Rules) {
        $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
        if ($existing) {
            Remove-NetFirewallRule -DisplayName $rule.Name
            Write-Host "  Removed: $($rule.Name)" -ForegroundColor Red
        } else {
            Write-Host "  Not found (skip): $($rule.Name)" -ForegroundColor DarkGray
        }
    }
    Write-Host "`nAll NekoChat firewall rules removed.`n" -ForegroundColor Yellow
    exit 0
}

Write-Host "`n=== Setting up NekoChat firewall rules ===" -ForegroundColor Cyan
Write-Host "Creating inbound allow rules for LiveKit, token server, and WebRTC...`n"

foreach ($rule in $Rules) {
    $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "  Already exists: $($rule.Name)" -ForegroundColor DarkGray
        continue
    }

    New-NetFirewallRule `
        -DisplayName $rule.Name `
        -Description $rule.Description `
        -Direction Inbound `
        -Action Allow `
        -Protocol $rule.Protocol `
        -LocalPort $rule.LocalPort `
        -Profile Any `
        -Enabled True | Out-Null

    Write-Host "  Created: $($rule.Name)" -ForegroundColor Green
}

# Also allow Chrome and Firefox executables through the firewall for WebRTC
$Browsers = @(
    @{
        Name = "$RulePrefix - Chrome WebRTC"
        Path = "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"
    },
    @{
        Name = "$RulePrefix - Chrome WebRTC (x86)"
        Path = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
    },
    @{
        Name = "$RulePrefix - Chrome WebRTC (User)"
        Path = "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    },
    @{
        Name = "$RulePrefix - Firefox WebRTC"
        Path = "$env:ProgramFiles\Mozilla Firefox\firefox.exe"
    },
    @{
        Name = "$RulePrefix - Firefox WebRTC (x86)"
        Path = "${env:ProgramFiles(x86)}\Mozilla Firefox\firefox.exe"
    }
)

Write-Host ""
foreach ($browser in $Browsers) {
    if (-not (Test-Path $browser.Path)) {
        continue
    }
    $existing = Get-NetFirewallRule -DisplayName $browser.Name -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "  Already exists: $($browser.Name)" -ForegroundColor DarkGray
        continue
    }

    New-NetFirewallRule `
        -DisplayName $browser.Name `
        -Description "Allow browser inbound for WebRTC voice (NekoChat)" `
        -Direction Inbound `
        -Action Allow `
        -Program $browser.Path `
        -Profile Any `
        -Enabled True | Out-Null

    Write-Host "  Created: $($browser.Name)" -ForegroundColor Green
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan
Write-Host "Firewall rules are active. Voice calls should now work without disabling the firewall."
Write-Host "To remove all rules later: .\setup-firewall.ps1 -Remove`n"

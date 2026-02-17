# Cunny with Voice Channels

A modified version of [Cinny](https://cinny.in/) Matrix client (branded as Cunny) with Discord-like voice channels powered by [LiveKit](https://livekit.io/).

## Features

- Join/leave voice channels directly from room headers
- Mute/deafen controls
- See who's in voice and who's speaking
- Persistent voice channels per Matrix room
- Self-hosted, no external services required

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Cunny       │────▶│  Token Server   │     │    Matrix       │
│  (Web Client)   │     │   (Express)     │     │   Homeserver    │
└────────┬────────┘     └─────────────────┘     └─────────────────┘
         │
         │ WebRTC
         ▼
┌─────────────────┐
│  LiveKit Server │
│   (WebRTC SFU)  │
└─────────────────┘
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- A domain with SSL (for production)
- Your existing Matrix homeserver

### 1. Clone and Setup

**Linux / macOS**

```bash
git clone <this-repo>
cd <repo>

chmod +x setup.sh
./setup.sh
```

**Windows (PowerShell)**

```powershell
# From the project root
.\setup.ps1
```

The setup script creates `.env` from `env.example` if missing, generates LiveKit API keys (via Docker), and writes them to both `.env` and `livekit.yaml` so they stay in sync. If you skip the script, create `.env` yourself from `env.example` and keep the keys in sync (see below).

### 2. Configure Environment

Edit `.env` with your settings:

```env
# Generated API keys (setup.sh creates these)
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# Your server's public IP
HOST_IP=203.0.113.1

# Public URLs (use your domain)
LIVEKIT_WS_URL=wss://livekit.yourdomain.com
TOKEN_ENDPOINT=https://chat.yourdomain.com/api/livekit/token

# CORS
ALLOWED_ORIGINS=https://chat.yourdomain.com
```

### 3. Deploy

```bash
docker compose up -d
```

### 4. Configure Reverse Proxy (Production)

See `nginx-proxy.conf.example` for nginx configuration with SSL. For a concrete example with subdomains, see `chatui.conf`, `token.frennet.xyz.conf`, and `livekit.frennet.xyz.conf`.

**Voice to work you need:**

| What | Where |
|------|--------|
| **LiveKit WebSocket** | nginx must proxy `wss://livekit.yourdomain.com` → `http://127.0.0.1:7880` with `Upgrade` / `Connection: upgrade`. Use `livekit.frennet.xyz.conf` as a template. |
| **Token server CORS** | Set `ALLOWED_ORIGINS` in `.env` to `*` or to your app origin(s). One pattern is supported: `https://*.yourdomain.com` allows any `https://subdomain.yourdomain.com`. |
| **RTC ports** | LiveKit needs **UDP 50000–60000** and **TCP 7881** reachable on `HOST_IP` (firewall / NAT). nginx only proxies 7880 (WS); media goes direct to the server. |

Key points:
- Cunny on port 8080 → `chat.yourdomain.com`
- Token server on port 3001 → `chat.yourdomain.com/api/livekit/` or a dedicated subdomain
- LiveKit on port 7880 → `livekit.yourdomain.com` (WebSocket upgrade required)

## Services

| Service | Port | Description |
|---------|------|-------------|
| Cunny | 8080 | Web client with voice channels |
| Token Server | 3001 | Generates LiveKit access tokens |
| LiveKit | 7880 | WebSocket/HTTP API |
| LiveKit | 7881 | WebRTC TCP |
| LiveKit | 7882/udp | WebRTC UDP |

## Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `LIVEKIT_API_KEY` | LiveKit API key (must match `livekit.yaml` `keys:`) | `APIxxxxxxxx` |
| `LIVEKIT_API_SECRET` | LiveKit API secret (must match `livekit.yaml` `keys:`) | `xxxxxxxxxxxxx` |
| `HOST_IP` | Server's public IP | `203.0.113.1` |
| `LIVEKIT_WS_URL` | Public WebSocket URL | `wss://livekit.example.com` |
| `TOKEN_ENDPOINT` | Public token endpoint | `https://chat.example.com/api/livekit/token` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `https://chat.example.com` |
| `VITE_BRAND_NAME` | Optional. App name shown in UI (tab title, login, about). Does not affect storage or internal keys. | `Cunny` or `My Chat` |

### Custom branding

Set **`VITE_BRAND_NAME`** in `.env` to change the name shown in the UI (browser tab, login screen, About, device name when logging in, etc.). Rebuild the web client for the change to apply (`docker compose build cinny`). You can also set **`brandName`** in `config.json` (in the built app’s `config.json`) to override at runtime without rebuilding.

### LiveKit API keys (auth)

The **same** key/secret must be configured in two places or voice connections will be rejected:

| Where | Purpose |
|-------|---------|
| **`.env`** | Token server reads `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` (used to sign JWTs). |
| **`livekit.yaml`** | LiveKit server reads `keys:` (e.g. `api_key: api_secret`) to verify tokens. |

- **When is `.env` created?** Only when you run the setup script: `setup.sh` (Linux/macOS) or `setup.ps1` (Windows). The script copies `env.example` → `.env`, generates keys with `docker run --rm livekit/livekit-server generate-keys`, and writes them into both `.env` and `livekit.yaml`. If you don’t run the script, create `.env` yourself from `env.example`.
- **Keeping them in sync:** If you edit `.env` and change `LIVEKIT_API_KEY` or `LIVEKIT_API_SECRET`, update `livekit.yaml` the same way: under `keys:` put one line `  your_key: your_secret` (same values as in `.env`).  
  - **Windows:** Run `.\sync-livekit-keys.ps1` to copy the key/secret from `.env` into `livekit.yaml`.  
  - **Linux/macOS:** Run `./sync-livekit-keys.sh` (or edit `livekit.yaml` by hand).  
  Then restart: `docker compose restart livekit token-server`.

See `docs/LIVEKIT-AUTH-REVIEW.md` for full details.

### Generating LiveKit Keys

```bash
docker run --rm livekit/livekit-server generate-keys
```

### "In voice" in room list

To show how many people are in voice per room in the sidebar, the token server exposes a webhook and a participants API. Configure LiveKit to send webhooks to your token server (see commented `webhook` section in `livekit.yaml`). Set the webhook URL to your token server (e.g. `https://chat.yourdomain.com/api/livekit/webhook`). The token server will then track participants and the client can show "N in voice" per room.

## Manual Configuration

If the voice channels don't auto-configure:

1. Open Cunny in your browser
2. Go to **Settings** → **Voice Channels**
3. Enter:
   - **LiveKit Server URL**: Your WebSocket URL (e.g., `wss://livekit.example.com`)
   - **Token Endpoint**: Your token server URL (e.g., `https://chat.example.com/api/livekit/token`)
4. Click **Save Settings**

## Usage

1. Open any Matrix room
2. Click the phone icon in the room header
3. Allow microphone access
4. You're now in voice!

Controls:
- 🎤 Toggle mute
- 🔇 Toggle deafen (mutes you and others)
- 📞 Disconnect

## Firewall Rules

Ensure these ports are open:

```bash
# Required
7880/tcp  # LiveKit HTTP/WebSocket
7881/tcp  # LiveKit WebRTC TCP
7882/udp  # LiveKit WebRTC UDP

# Optional (if not using reverse proxy)
8080/tcp  # Cunny web
3001/tcp  # Token server
```

## Troubleshooting

### Voice button doesn't appear
- Check Settings → Voice Channels configuration
- Verify LIVEKIT_WS_URL and TOKEN_ENDPOINT are set

### Can't connect to voice
- Check browser console for errors (CORS, token fetch, or "could not establish pc connection").
- **CORS:** If the app is on `https://chatui.frennet.xyz`, set `ALLOWED_ORIGINS` to `https://chatui.frennet.xyz` or `https://*.frennet.xyz` (token server supports one `*` pattern). Restart token-server after changing `.env`.
- **WebSocket:** Ensure nginx proxies `wss://livekit.yourdomain.com` to `http://127.0.0.1:7880` with WebSocket upgrade (see `livekit.frennet.xyz.conf`).
- **RTC (PC connection):** "Could not establish pc connection" usually means the client cannot reach the LiveKit server for media. Open **UDP 50000–60000** and **TCP 7881** on `HOST_IP` (and any NAT port forwarding). LiveKit uses `HOST_IP` from `.env` in the container for ICE candidates.
- Verify LiveKit server is running: `docker compose logs livekit`
- Check token server: `curl http://localhost:3001/health`

### Audio not working
- Check microphone permissions in browser
- Ensure UDP port 7882 is open for WebRTC

### "Failed to get token" error
- Verify TOKEN_ENDPOINT is accessible from browser
- Check CORS settings in ALLOWED_ORIGINS

## Development

### Building Cunny locally

```bash
cd cinny
npm install
npm run start
```

### Modifying voice channel code

Key files:
- `cinny/src/app/state/voiceChannel.ts` - State management
- `cinny/src/app/features/voice-channel/` - UI components
- `cinny/src/app/features/settings/voice/` - Settings page

## License

- Cunny (based on Cinny): AGPL-3.0 (original license preserved)
- Voice channel additions: AGPL-3.0
- LiveKit: Apache 2.0

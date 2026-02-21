# NekoChat (with Voice Channels)

A Matrix client based on [Cinny](https://github.com/cinnyapp/cinny), branded as **NekoChat**, with Discord-like voice channels powered by [LiveKit](https://livekit.io/). Self-hosted, with a cute neko theme and optional in-app mascot.

---

## Features

### Matrix messaging

- **Rooms** — Create and join rooms, browse community rooms, search rooms by keyword.
- **Direct messages** — One-to-one chats with any Matrix user.
- **Spaces** — Organize rooms and DMs into spaces with a hierarchy; create and manage spaces.
- **Explore** — Discover featured communities, spaces, and rooms (configurable via `config.json`).
- **Message search** — Search messages by keyword across rooms; filter by room and time.
- **Rich messaging** — Markdown, code blocks, replies, threads, reactions, edits, URL previews, image/video/audio/file attachments.
- **Message layouts** — Modern, compact, or bubble layout; adjustable message spacing.
- **Pinned messages** — Pin messages in a room and jump to them from the room header.
- **Jump to date** — Navigate the timeline by date.

### Voice channels

- **In-room voice** — Join and leave voice channels directly from the room header (phone icon).
- **Mute / deafen** — Toggle microphone and speakers; see who is speaking.
- **Persistent channels** — One voice channel per Matrix room; participants shown in the room list and in a collapsible panel.
- **Self-hosted** — Uses your own LiveKit server and token endpoint; no third-party voice service required.
- **Voice server address book** — Save multiple LiveKit/token server combinations (Settings → Voice Channels). Choose which server to use when joining voice; everyone must use the same server + room to be in the same chat.
- **Invite to voice via DM** — From a room’s menu (⋮), use **Invite to voice**, enter a Matrix user ID, and send. They receive a DM with a voice-invite message: **Add to address book** adds your voice server to their list, **Join room** opens the room so they can join the same voice channel.

### People & account

- **Members list** — Show or hide the room members drawer; sort and filter members.
- **Contact / address book** — Set and view your contact information (Settings → Account → Contact information).
- **Profile** — Display name, avatar, Matrix ID; manage account and security (devices, verification, backup).

### Notifications & inbox

- **Notifications** — Per-room notification modes (all messages, mentions, mute); keyword and special-message notifications.
- **Inbox** — Central place for notifications and invites (room and space invites).
- **System notifications** — Optional browser/system notifications and sounds (configurable in Settings).

### Theming & appearance

- **Neko themes** — **Neko Dark** and **Neko Light** (default: Neko Dark): liquid glass / aero-style UI, neko-themed copy and emoticons, optional mascot.
- **Other themes** — Light, Silver, Dark, Butter.
- **System theme** — Automatically switch between light and dark (e.g. Neko Light / Neko Dark) based on OS preference.
- **IRC mode** — Narrower sidebar and compact list for an IRC-like layout.
- **Neko mascot** — Cute cat-girl silhouette that appears randomly in a corner when using a Neko theme (can be disabled in config).

### Settings & configuration

- **General** — Theme, system theme, zoom, markdown, toolbar, clock format, date format, message layout and spacing, media and URL previews, developer tools, IRC mode.
- **Account** — Profile, contact information, security (devices, verification, key backup).
- **Notifications** — Notification modes, sounds, keyword alerts.
- **Voice channels** — Voice server address book (add/edit/remove LiveKit + token endpoint entries), default server, and device options (mic/speaker, volumes, join muted, push-to-talk).
- **Devices** — Sessions, verification, local key backup.
- **Emojis & stickers** — Custom emoji and sticker packs.
- **Developer tools** — Account data, send custom events, etc.
- **About** — App name, version, thanks to Cinny team; clear cache.

### Branding (one place)

- **config.json** (e.g. `cinny/public/config.json`) — Set `brandName`, `appVersion`, and `showNekoMascot`. Single place to edit branding and version for the UI.
- **.env** — Optional build-time overrides: `VITE_BRAND_NAME`, `VITE_APP_VERSION`.

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   NekoChat      │────▶│  Token Server   │     │    Matrix       │
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

---

## Quick Start

### Prerequisites

- Docker and Docker Compose
- A domain with SSL (for production)
- Your existing Matrix homeserver

### 1. Clone and setup

**Linux / macOS**

```bash
git clone <this-repo>
cd <repo>
chmod +x setup.sh
./setup.sh
```

**Windows (PowerShell)**

```powershell
.\setup.ps1
```

The setup script creates `.env` from `env.example` if missing, generates LiveKit API keys (via Docker), and writes them to both `.env` and `livekit.yaml`.

### 2. Configure environment

Edit `.env`:

```env
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
HOST_IP=203.0.113.1
LIVEKIT_WS_URL=wss://livekit.yourdomain.com
TOKEN_ENDPOINT=https://chat.yourdomain.com/api/livekit/token
ALLOWED_ORIGINS=https://chat.yourdomain.com
```

Optional: `VITE_BRAND_NAME`, `VITE_APP_VERSION` for build-time branding (otherwise use `config.json` at runtime).

### 3. Deploy

```bash
docker compose up -d
```

### 4. Reverse proxy (production)

Example nginx configs (copy and fill in your domain and SSL paths):
- **nginx-proxy.conf.example** — all-in-one (app + token path + LiveKit)
- **livekit.nginx.conf.example** — LiveKit WebSocket only
- **token.nginx.conf.example** — Token server only

For voice you need:

| What | Where |
|------|--------|
| **LiveKit WebSocket** | Proxy `wss://livekit.yourdomain.com` → `http://127.0.0.1:7880` with WebSocket upgrade. |
| **Token server CORS** | Set `ALLOWED_ORIGINS` in `.env` to your app origin(s). |
| **RTC ports** | **UDP 50000–60000** and **TCP 7881** on `HOST_IP` (firewall / NAT). |

---

## Services

| Service      | Port  | Description                |
|-------------|-------|----------------------------|
| NekoChat    | 8080  | Web client with voice      |
| Token Server| 3001  | LiveKit access tokens      |
| LiveKit     | 7880  | WebSocket/HTTP API         |
| LiveKit     | 7881  | WebRTC TCP                 |
| LiveKit     | 7882/udp | WebRTC UDP              |

---

## Configuration

### Environment variables

| Variable | Description |
|----------|-------------|
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | Must match `livekit.yaml` `keys:` |
| `HOST_IP` | Server public IP |
| `LIVEKIT_WS_URL` | Public WebSocket URL |
| `TOKEN_ENDPOINT` | Public token URL (e.g. `https://chat.example.com/api/livekit/token`) |
| `ALLOWED_ORIGINS` | CORS origins for token server |
| `VITE_BRAND_NAME` | Optional app name (build-time) |
| `VITE_APP_VERSION` | Optional app version (build-time) |

### Branding and version

- **Runtime:** In `config.json` (e.g. in `cinny/public/config.json` or your deployed `config.json`) set:
  - `brandName` — e.g. `"NekoChat"`
  - `appVersion` — e.g. `"1.0.0"`
  - `showNekoMascot` — `true` or `false`
- **Build-time:** Set `VITE_BRAND_NAME` and `VITE_APP_VERSION` in `.env`, then rebuild.

### LiveKit keys

The same key/secret must be in **`.env`** (token server) and **`livekit.yaml`** (LiveKit server). After changing keys, run `./sync-livekit-keys.sh` (or `.\sync-livekit-keys.ps1` on Windows) and restart: `docker compose restart livekit token-server`.

See `docs/LIVEKIT-AUTH-REVIEW.md` for details.

---

## Manual voice configuration

If voice does not auto-configure:

1. Open NekoChat → **Settings** → **Voice Channels**
2. Set **LiveKit Server URL** (e.g. `wss://livekit.example.com`) and **Token Endpoint** (e.g. `https://chat.example.com/api/livekit/token`)
3. Save

---

## Usage

1. Log in with your Matrix account.
2. Open **Home** for rooms, **Direct** for DMs, or a **Space**.
3. Add at least one voice server in **Settings** → **Voice Channels** (LiveKit URL + token endpoint).
4. Open a room and click the **phone** icon in the header to join voice. If you have multiple servers, pick one from the menu.
5. Use mute, deafen, and disconnect as needed.

**Inviting others to voice:** Room menu (⋮) → **Invite to voice** → enter their Matrix ID. They get a DM with an invite; they click **Add to address book** to add your server, then **Join room** to open the room and join the same voice channel.

---

## Development

```bash
cd cinny
npm install
npm run start
```

Relevant areas:

- `cinny/src/app/state/voiceChannel.ts` — Voice state
- `cinny/src/app/features/voice-channel/` — Voice UI
- `cinny/src/app/features/settings/voice/` — Voice settings
- `cinny/src/app/config/brand.ts` — Default brand/version
- `cinny/public/config.json` — Runtime branding

---

## License

- NekoChat (based on Cinny): AGPL-3.0 (original Cinny license preserved)
- Voice channel additions: AGPL-3.0
- LiveKit: Apache 2.0

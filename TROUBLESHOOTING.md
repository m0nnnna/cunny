# Voice (LiveKit) troubleshooting

## The "could not establish pc connection" error

```
ConnectionError: could not establish pc connection
```

This means the browser's **WebRTC PeerConnection** (ICE negotiation) failed — the browser opened the WebSocket to LiveKit but could never establish the actual media path.

---

## Root cause: privacy browsers block UDP WebRTC

**Affected browsers**: ungoogled-chromium, Zen (Firefox fork), Brave (strict mode), and similar privacy-focused browsers.

**Not affected**: stock Firefox, Edge, stock Chrome, mobile browsers.

Privacy browsers ship with a WebRTC IP handling policy set to **"Disable non-proxied UDP"**. This blocks the direct UDP connections that WebRTC relies on. The result:

- The WebSocket to LiveKit succeeds (you see "Connecting...").
- ICE candidate negotiation fails because all UDP candidates are blocked.
- You get `could not establish pc connection`.
- It may be **hit or miss** depending on whether the TCP fallback (port 7881) kicks in fast enough.

Regular Firefox, Edge, and Chrome don't have this restriction, which is why they work fine. Phones work because mobile browsers don't apply this policy.

---

## Fix 1: Browser flag (immediate fix for your desktop)

### Ungoogled Chromium

1. Go to `chrome://flags/#webrtc-ip-handling-policy`
2. Change from **"Disable non-proxied UDP"** to **"Default"**
3. Relaunch the browser

You can verify WebRTC works with: https://theanam.github.io/webrtc-test-suite/

### Zen Browser

1. Go to `about:config`
2. Search for `media.peerconnection.ice.proxy_only`
3. Set to **`false`**
4. Also check `media.peerconnection.ice.no_host` — set to **`false`** if it's true
5. Restart Zen

### Brave

1. Go to `brave://settings/privacy`
2. Under WebRTC IP Handling Policy, select **"Default"**
3. Or go to `brave://flags/#webrtc-ip-handling-policy` and set to **"Default"**

---

## Fix 2: Server-side TCP fallback (already applied)

The `livekit.yaml` has been updated to ensure the TCP fallback is as reliable as possible:

```yaml
rtc:
  tcp_port: 7881                # ICE/TCP fallback
  use_external_ip: false
  node_ip: 108.174.48.199       # pinned public IP
  allow_tcp_fallback: true       # explicit
```

**Why `node_ip` is pinned**: `use_external_ip: true` uses STUN to discover the public IP. Some privacy browsers also block STUN requests, which means ICE candidates would contain no valid IP at all. Pinning `node_ip` ensures the server always advertises the correct public IP in ICE candidates regardless of STUN.

**Why `allow_tcp_fallback` is explicit**: When UDP is blocked by the browser's policy, the client needs to fall back to ICE/TCP on port 7881. This is on by default but being explicit makes it clear and prevents accidental breakage.

After applying this config change, **restart the LiveKit server** (e.g. `docker compose restart livekit`).

---

## Fix 3 (optional): Enable TURN for the most restrictive networks

If some users are behind corporate proxies that also block TCP on non-standard ports, TURN/TLS on port 443 is the nuclear option. Uncomment the `turn:` section in `livekit.yaml`:

```yaml
turn:
  enabled: true
  domain: turn.frennet.xyz
  tls_port: 443
  udp_port: 3478
```

This requires:
- A DNS record for `turn.frennet.xyz` pointing to the LiveKit server
- A TLS certificate for that domain (set `cert_file`/`key_file`, or use `external_tls: true` behind a L4 load balancer)
- Ports 443/tcp and 3478/udp open on the server

---

## Quick reference

| Symptom | Cause | Fix |
|---------|-------|-----|
| `could not establish pc connection` on ungoogled-chromium | WebRTC policy blocks UDP | `chrome://flags/#webrtc-ip-handling-policy` → "Default" |
| Same error on Zen browser | `media.peerconnection.ice.proxy_only` is true | `about:config` → set to `false` |
| Hit or miss — sometimes connects, sometimes doesn't | TCP fallback race | Pin `node_ip` + explicit `allow_tcp_fallback` in server config |
| Works on phone, fails on desktop | Desktop has privacy browser | Fix the browser flag (see above) |
| Works on Firefox/Edge, fails on ungoogled-chrome/Zen | Same | Same |
| Fails even after browser fix | Server missing `node_ip`, or STUN blocked | Ensure `node_ip` is pinned in livekit.yaml, restart server |
| Fails behind corporate proxy | Proxy blocks all non-443 traffic | Enable TURN/TLS on port 443 |

---

## Other issues

### Chrome: "Microphone access denied"

- Click the padlock/info icon for the site → Site settings → Microphone → **Allow**
- The site must be served over **HTTPS** (or `localhost`)

### "Failed to get token" / "Cannot reach token server"

- Check that **Token Endpoint** in Settings → Voice matches your token server URL
- The token server must be running and allow CORS from your app's origin
- LiveKit API key/secret in `.env` must match what the token server uses

### Windows Firewall (if running LiveKit on the same Windows machine)

Run `setup-firewall.ps1` as Administrator to open the needed ports. This is only needed if the LiveKit server itself runs on a Windows desktop, not for clients.

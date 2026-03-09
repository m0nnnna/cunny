# Screen Share: Where the bottleneck can be

## Pipeline (streamer → server → viewer)

```
Streamer (GPU encode)  →  LiveKit server (forward only)  →  Viewer (GPU decode)
     H.264                    RTP forward only                  H.264
```

- **Streamer**: Browser uses **GPU** to encode screen capture to H.264. No GPU on server is not relevant for encoding.
- **Server**: LiveKit is an **SFU** (Selective Forwarding Unit). It **does not decode or re-encode** video. It receives RTP packets from the publisher and forwards them to subscribers. So the server **does not need a GPU**. It only does:
  - DTLS/SRTP **decrypt** (incoming from streamer)
  - DTLS/SRTP **encrypt** (outgoing to viewer)
  - Packet copying per subscriber
- **Viewer**: Browser uses **GPU** to decode H.264 and render. No GPU on server is not relevant for decoding.

So **“server has no GPU” is fine** for this pipeline. The server never touches the video pixels.

## What *can* bottleneck

### 1. Server CPU (no GPU, but still does crypto)

The server is CPU-bound on **packet crypto and forwarding**. Work scales with:

- **Bitrate** → higher bitrate = more packets/sec = more decrypt/encrypt work.
- **Number of subscribers** → each subscriber gets a copy (encrypt per subscriber).

Rough order of magnitude at 30 Mbps: ~2500 packets/sec each way. A weak CPU might struggle. If the server is a low-spec box, high bitrate can be the bottleneck.

**Mitigation**: Cap max bitrate so the server sees fewer packets. In `voiceChannelRoomOptions.ts` you can set `SERVER_MAX_BITRATE_CAP` (see comment there); the dynamic sender will never exceed it, so server load is limited.

### 2. Streamer (encoder)

- **GPU contention**: If the game uses the GPU heavily, the hardware encoder can be starved → lower FPS.
- **Content**: High motion / camera movement = harder to encode = more dropped frames.

We already:

- Use **maintain-framerate** so the encoder prefers FPS over resolution.
- Switch to **720p30** when encoded FPS drops so the encoder has less work.
- Ramp bitrate (16 → 22 → 30 Mbps) when we detect load.

### 3. Viewer (decoder)

- **GPU decode** is usually fine.
- We use a **4 s jitter buffer** and **dynamic keyframe (PLI) requests** so the viewer can recover from choppy periods.

### 4. Network

- Latency and packet loss affect smoothness. The 4 s jitter buffer helps absorb jitter; it doesn’t fix loss.

## Summary

| Component   | Needs GPU? | Typical bottleneck |
|------------|------------|---------------------|
| Streamer   | Yes (encode) | GPU busy with game; we use 720p30 + maintain-framerate to help. |
| **Server** | **No**      | **CPU**: packet crypto/forward. High bitrate = more packets. Use `SERVER_MAX_BITRATE_CAP` if server is weak. |
| Viewer     | Yes (decode) | Usually fine; we use jitter buffer + PLI. |

So the server not having a GPU is expected and correct. If you still see bottlenecks, the next place to look is **server CPU** (try lowering max bitrate) or **streamer GPU** (game + encode competing for the same GPU).

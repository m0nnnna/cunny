import express from 'express';
import cors from 'cors';
import { AccessToken, WebhookReceiver } from 'livekit-server-sdk';

const app = express();

// Configuration from environment variables.
// LIVEKIT_API_KEY and LIVEKIT_API_SECRET MUST be set (in .env or docker-compose environment).
// They must match the keys: section in livekit.yaml exactly, or tokens will be rejected.
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.error('FATAL: LIVEKIT_API_KEY and LIVEKIT_API_SECRET environment variables are required.');
  console.error('Set them in .env (must match the keys: section in livekit.yaml).');
  process.exit(1);
}

if (LIVEKIT_API_KEY === 'devkey' || LIVEKIT_API_SECRET === 'secret') {
  console.warn('WARNING: Using default insecure API key/secret. Generate secure keys for production:');
  console.warn('  docker run --rm livekit/livekit-server generate-keys');
}
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS_RAW = process.env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean) || ['*'];

// CORS: allow * or exact origins, or patterns like https://*.frennet.xyz (one * as subdomain)
function corsOriginAllowed(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS_RAW[0] === '*') return true;
  for (const entry of ALLOWED_ORIGINS_RAW) {
    if (entry === '*') return true;
    if (entry === origin) return true;
    if (entry.includes('*')) {
      const [prefix, suffix] = entry.split('*');
      if (prefix && suffix && origin.startsWith(prefix) && origin.endsWith(suffix) && origin.length > prefix.length + suffix.length) return true;
    }
  }
  return false;
}

// In-memory store: LiveKit room name -> Set of participant identities (Matrix user IDs)
// Updated by LiveKit webhooks (participant_joined / participant_left / room_finished)
const roomParticipants = new Map();

function getParticipantIdentity(event) {
  return event.participant?.identity;
}

function getRoomName(event) {
  return event.room?.name;
}

// Middleware: must parse JSON for most routes
app.use(express.json());
// CORS: support * or exact origins or patterns like https://*.frennet.xyz
app.use(cors({
  origin: (origin, callback) => {
    if (corsOriginAllowed(origin)) {
      callback(null, origin || true);
    } else {
      callback(null, false);
    }
  },
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true,
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'livekit-token-server' });
});

// Token generation endpoint
app.post('/api/livekit/token', async (req, res) => {
  try {
    const { roomName, participantName } = req.body;

    if (!roomName || !participantName) {
      return res.status(400).json({
        error: 'Missing required fields: roomName and participantName',
      });
    }

    // Create access token
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
      name: participantName,
      // Token expires in 24 hours
      ttl: 60 * 60 * 24,
    });

    // Grant permissions for the room
    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();

    console.log(`Token generated for ${participantName} in room ${roomName}`);

    res.json({ token: jwt });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Alternative GET endpoint for simpler testing
app.get('/api/livekit/token', async (req, res) => {
  try {
    const { roomName, participantName } = req.query;

    if (!roomName || !participantName) {
      return res.status(400).json({
        error: 'Missing required query params: roomName and participantName',
      });
    }

    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
      name: participantName,
      ttl: 60 * 60 * 24,
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();

    res.json({ token: jwt });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// ---------- Webhook: receive participant_joined / participant_left / room_finished ----------
// LiveKit sends raw JSON with Content-Type application/webhook+json; we need raw body for signature verification
const webhookReceiver = new WebhookReceiver(LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

app.post(
  '/api/livekit/webhook',
  express.raw({ type: 'application/webhook+json' }),
  async (req, res) => {
    try {
      const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body ?? '');
      const event = await webhookReceiver.receive(rawBody, req.get('Authorization'));
      const roomName = getRoomName(event);
      const identity = getParticipantIdentity(event);
      if (!roomName) {
        return res.status(200).send();
      }
      if (event.event === 'participant_joined' && identity) {
        if (!roomParticipants.has(roomName)) roomParticipants.set(roomName, new Set());
        roomParticipants.get(roomName).add(identity);
      } else if (event.event === 'participant_left' && identity) {
        const set = roomParticipants.get(roomName);
        if (set) {
          set.delete(identity);
          if (set.size === 0) roomParticipants.delete(roomName);
        }
      } else if (event.event === 'room_finished') {
        roomParticipants.delete(roomName);
      }
      res.status(200).send();
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(400).send();
    }
  }
);

// ---------- GET participants in voice per room (for "in voice" in room list) ----------
// Query: ?roomIds=!abc:server,!def:server (Matrix room IDs). LiveKit room names are matrix-{roomId}.
// Response: { "!abc:server": ["@user1:server"], "!def:server": [] }
app.get('/api/livekit/rooms/participants', (req, res) => {
  const roomIdsParam = req.query.roomIds;
  if (!roomIdsParam || typeof roomIdsParam !== 'string') {
    return res.status(400).json({ error: 'Missing roomIds query (comma-separated Matrix room IDs)' });
  }
  const roomIds = roomIdsParam.split(',').map((id) => id.trim()).filter(Boolean);
  const result = {};
  for (const matrixRoomId of roomIds) {
    const livekitRoomName = `matrix-${matrixRoomId}`;
    const set = roomParticipants.get(livekitRoomName);
    result[matrixRoomId] = set ? [...set] : [];
  }
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`LiveKit token server running on port ${PORT}`);
  console.log(`API Key configured: ${LIVEKIT_API_KEY.substring(0, 4)}...`);
});

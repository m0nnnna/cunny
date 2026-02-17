#!/bin/bash
# NekoChat deploy script — generates fresh LiveKit keys and builds/starts all containers.
# Usage:
#   ./setup.sh              # Generate new keys + build + start
#   ./setup.sh --keep-keys  # Rebuild without rotating keys
#   ./setup.sh --down       # Stop everything

set -e
cd "$(dirname "$0")"

# ── Flags ──────────────────────────────────────────────────────────
KEEP_KEYS=false
DOWN=false
for arg in "$@"; do
    case "$arg" in
        --keep-keys) KEEP_KEYS=true ;;
        --down)      DOWN=true ;;
    esac
done

# ── Stop mode ──────────────────────────────────────────────────────
if [ "$DOWN" = true ]; then
    echo ""
    echo "=== Stopping NekoChat ==="
    docker compose down
    echo "All containers stopped."
    exit 0
fi

echo ""
echo "=== NekoChat Deploy ==="
echo ""

# ── Ensure .env exists ─────────────────────────────────────────────
if [ ! -f .env ]; then
    if [ -f env.example ]; then
        echo "  Creating .env from env.example..."
        cp env.example .env
        echo ""
        echo "  IMPORTANT: Edit .env and set HOST_IP, LIVEKIT_WS_URL, TOKEN_ENDPOINT, ALLOWED_ORIGINS"
        echo "  Then run this script again."
        echo ""
        exit 1
    else
        echo "ERROR: .env not found and no env.example to copy from." >&2
        exit 1
    fi
fi

# ── Helper: read value from .env ───────────────────────────────────
get_env() { grep "^$1=" .env 2>/dev/null | head -1 | cut -d= -f2- | xargs; }

# ── Generate fresh LiveKit keys ────────────────────────────────────
# Keys are generated locally with openssl (instant, no Docker pull needed).
# Format matches LiveKit's own generate-keys output: API{hex} + base64 secret.
if [ "$KEEP_KEYS" = false ]; then
    echo "  Generating fresh LiveKit API keys..."
    NEW_KEY="API$(openssl rand -hex 9 | tr '[:lower:]' '[:upper:]')"
    NEW_SECRET="$(openssl rand -base64 32)"

    sed -i "s|^LIVEKIT_API_KEY=.*|LIVEKIT_API_KEY=$NEW_KEY|" .env
    sed -i "s|^LIVEKIT_API_SECRET=.*|LIVEKIT_API_SECRET=$NEW_SECRET|" .env
    echo "  New API Key:    ${NEW_KEY:0:8}..."
    echo "  New API Secret: ${NEW_SECRET:0:4}..."
else
    echo "  Keeping existing keys from .env (--keep-keys)"
fi

# ── Validate required settings ─────────────────────────────────────
MISSING=""
HOST_IP=$(get_env HOST_IP)
WS_URL=$(get_env LIVEKIT_WS_URL)
TOKEN_EP=$(get_env TOKEN_ENDPOINT)
API_KEY=$(get_env LIVEKIT_API_KEY)
API_SECRET=$(get_env LIVEKIT_API_SECRET)

[ -z "$HOST_IP" ] || [ "$HOST_IP" = "your-server-ip" ] && MISSING="$MISSING HOST_IP"
[ -z "$WS_URL" ] || echo "$WS_URL" | grep -q 'your-domain' && MISSING="$MISSING LIVEKIT_WS_URL"
[ -z "$TOKEN_EP" ] || echo "$TOKEN_EP" | grep -q 'your-domain' && MISSING="$MISSING TOKEN_ENDPOINT"
[ -z "$API_KEY" ] && MISSING="$MISSING LIVEKIT_API_KEY"
[ -z "$API_SECRET" ] && MISSING="$MISSING LIVEKIT_API_SECRET"

if [ -n "$MISSING" ]; then
    echo ""
    echo "  Missing or placeholder values in .env:"
    for m in $MISSING; do echo "    - $m"; done
    echo "  Edit .env and run again."
    echo ""
    exit 1
fi

# ── Show config summary ────────────────────────────────────────────
echo ""
echo "  Configuration:"
echo "    Host IP:         $HOST_IP"
echo "    LiveKit WS URL:  $WS_URL"
echo "    Token Endpoint:  $TOKEN_EP"
echo "    API Key:         ${API_KEY:0:8}..."
echo ""

# ── Build and start ────────────────────────────────────────────────
echo "  Building and starting containers..."
echo ""
docker compose up --build -d

echo ""
echo "=== NekoChat Running ==="
echo ""
echo "  Services:"
echo "    LiveKit Server:  ports 7880 (WS), 7881 (TCP), 7882 (UDP)"
echo "    Token Server:    port 3001"
echo "    Cunny:           port 8080"
echo ""
echo "  Logs:    docker compose logs -f"
echo "  Stop:    ./setup.sh --down"
echo "  Rebuild: ./setup.sh           (rotates keys)"
echo "  Rebuild: ./setup.sh --keep-keys (same keys)"
echo ""

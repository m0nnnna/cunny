# Cunny Voice - Security Setup Guide

## Overview

This guide explains the security measures implemented for the Cunny Voice system with LiveKit integration.

## Security Architecture

```
Cunny Frontend (Browser)
         │
         ├─> Token Server (with auth + rate limiting)
         │        │
         │        └─> Validates TOKEN_SHARED_SECRET
         │               │
         │               └─> Generates LiveKit tokens
         │
         └─> LiveKit Server (audio/video)
```

## Security Features

### 1. Secure API Credentials

**Secure LiveKit Keys** (automatically generated):
```
LIVEKIT_API_KEY=API042937E03FB8573A
LIVEKIT_API_SECRET=MJ76dITnBykWLbVVASxgQVklKrutvGF70qYJTJd8dBg=
```

### 2. Token Server Authentication

The token server now requires authentication via shared secret:
```javascript
Authorization: Bearer <TOKEN_SHARED_SECRET>
```

**Benefits**:
- Only authorized Cunny clients can request tokens
- Prevents abuse of the token endpoint
- Adds audit trail to token generation

### 3. Rate Limiting

Token requests are limited to 50 requests per 15 minutes per IP:
- Prevents brute force attacks
- Mitigates token endpoint abuse
- Configurable in `livekit-token-server/server.js`

### 4. Security Headers

Added via Helmet middleware:
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

### 5. Input Validation & Sanitization

- Room names must start with "matrix-"
- Participant names sanitized to prevent injection
- Request body limited to 10KB

### 6. Shorter Token TTL

Tokens now expire after 2 hours (instead of 24):
- Reduces window of abuse if tokens are compromised
- Users re-authenticate periodically

## Environment Variables

### Required Variables (.env)

```bash
# LiveKit API Credentials
LIVEKIT_API_KEY=<your-generated-api-key>
LIVEKIT_API_SECRET=<your-generated-secret>

# Shared secret for Cunny ↔ Token Server authentication
TOKEN_SHARED_SECRET=<your-random-base64-secret>

# Server Configuration
HOST_IP=<your-server-ip>
LIVEKIT_WS_URL=wss://livekit.yourdomain.com
TOKEN_ENDPOINT=https://token.yourdomain.com/api/livekit/token

# CORS Security
ALLOWED_ORIGINS=https://chatui.yourdomain.com
```

## Generating Secure Secrets

### Option 1: Using LiveKit Docker
```bash
docker run --rm livekit/livekit-server generate-keys
```

### Option 2: Using Node.js
```bash
# Generate API key
node -e "console.log('API' + require('crypto').randomBytes(8).toString('hex').toUpperCase())"

# Generate API secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate shared secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Option 3: Using OpenSSL
```bash
# Generate 32-byte random secret
openssl rand -base64 32
```

## Deployment

### Using the Deployment Script

**Windows**:
```cmd
deploy-secure.bat
```

**Linux/Mac**:
```bash
chmod +x deploy-secure.sh
./deploy-secure.sh
```

### Manual Deployment

```bash
# 1. Stop and remove everything
docker-compose down --rmi all --volumes --remove-orphans

# 2. Clear build cache
docker builder prune -af

# 3. Build fresh
docker-compose build --no-cache

# 4. Start services
docker-compose up -d
```

## Verification

### 1. Check Browser Network Tab

When joining a voice channel, check for the token request:

**Request Headers**:
```
Authorization: Bearer <your-shared-secret>
Content-Type: application/json
```

**Request Body**:
```json
{
  "roomName": "matrix-!roomid:server.com",
  "participantName": "username"
}
```

### 2. Check Server Logs

```bash
# View token server logs
docker-compose logs -f token-server

# Look for successful token generation:
# "Token generated for username in room matrix-!roomid:server.com from IP: 1.2.3.4"
```

### 3. Test Authentication

Try making a request without the secret:
```bash
curl -X POST https://token.frennet.xyz/api/livekit/token \
  -H "Content-Type: application/json" \
  -d '{"roomName":"test","participantName":"test"}'
```

Expected response:
```json
{
  "error": "Missing authorization header"
}
```

## Monitoring

### Token Server Logs

Monitor for:
- Invalid authorization attempts
- Unusual request patterns
- Failed token generation
- Rate limit hits

```bash
# Monitor for unauthorized attempts
docker-compose logs token-server | grep "Invalid authorization"
```

### VPS Nginx Logs

```bash
# On VPS
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## Security Best Practices

### ✅ DO

1. **Rotate secrets regularly** (every 3-6 months)
2. **Restrict .env file permissions**:
   ```bash
   chmod 600 .env
   ```
3. **Add .env to .gitignore**
4. **Use HTTPS everywhere**
5. **Enable CloudFlare/WAF for additional protection**
6. **Set up alerts for suspicious activity**
7. **Keep dependencies updated**
8. **Monitor token generation patterns**

### ❌ DON'T

1. **Never commit .env to version control**
2. **Don't use weak secrets** (password, secret, etc.)
3. **Don't share secrets publicly**
4. **Don't skip updates to dependencies**
5. **Don't disable rate limiting in production**

## Troubleshooting

### "Server not configured properly"

**Cause**: TOKEN_SHARED_SECRET not set in .env

**Fix**: Add TOKEN_SHARED_SECRET to .env file and redeploy

### "Missing authorization header"

**Cause**: Cunny not sending the authenticated request

**Fix**: Check that TOKEN_SHARED_SECRET is being passed to the Cunny container in docker-compose.yml

### "Too many requests"

**Cause**: Rate limit exceeded

**Fix**: Wait 15 minutes or increase limit in server.js

### Build not using latest code

**Cause**: Docker cache issue

**Fix**: Use `--no-cache` flag when building

## Additional Security Recommendations

### 1. WireGuard Hardening

```ini
# WireGuard config
[Peer]
AllowedIPs = 192.168.1.100/32  # Restrict to specific IPs instead of 0.0.0.0/0
PersistentKeepalive = 25
```

### 2. Nginx Security Headers (VPS)

```nginx
# Add to nginx config
server_tokens off;
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "no-referrer";
```

### 3. Firewall Configuration

```bash
# On internal server: Only allow necessary ports  
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 51820/udp  # WireGuard
ufw enable
```

### 4. Fail2Ban Setup

Monitor and block suspicious IP addresses attempting to abuse endpoints.

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify .env configuration
3. Ensure all secrets match between services
4. Test authentication with curl commands

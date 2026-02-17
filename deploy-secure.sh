#!/bin/bash
# Secure Deployment Script for Cunny Voice
# This script ensures a clean rebuild with all security measures

echo "=== Cunny Voice Secure Deployment ==="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Please create a .env file based on env.example with secure values."
    exit 1
fi

# Check if TOKEN_SHARED_SECRET is set
if ! grep -q "TOKEN_SHARED_SECRET=CHANGE_ME" .env && ! grep -q "^TOKEN_SHARED_SECRET=" .env; then
    echo "WARNING: TOKEN_SHARED_SECRET not found in .env file"
    echo "Security will be compromised! Add TOKEN_SHARED_SECRET to .env"
fi

echo "Step 1: Stopping and removing all containers..."
docker-compose down --rmi all --volumes --remove-orphans

echo ""
echo "Step 2: Pruning Docker build cache..."
docker builder prune -af

echo ""
echo "Step 3: Building services with no cache..."
docker-compose build --no-cache --progress=plain

echo ""
echo "Step 4: Starting services..."
docker-compose up -d

echo ""
echo "Step 5: Waiting for services to be healthy..."
sleep 10

echo ""
echo "Step 6: Checking service status..."
docker-compose ps

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Next steps:"
echo "1. Verify all containers are running: docker-compose logs"
echo "2. Test the voice channel connection"
echo "3. Check browser Network tab for Authorization header"
echo ""
echo "Security reminders:"
echo "- Keep .env file permissions restricted (chmod 600 .env)"
echo "- Do not commit .env to version control"
echo "- Rotate secrets periodically"
echo "- Monitor token server logs for unauthorized access"
echo ""

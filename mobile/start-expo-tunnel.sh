#!/bin/sh
set -e

echo "=========================================="
echo "Starting Expo in Tunnel Mode"
echo "=========================================="
echo "Mode: Tunnel (cross-network development)"
echo "Port: 8081"
echo "=========================================="

# Wait for backend tunnel URL (max 30 seconds)
BACKEND_TUNNEL_URL=""
MAX_ATTEMPTS=6
ATTEMPT=0

echo "→ Waiting for backend tunnel to initialize..."
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if [ -f /tmp/backend-tunnel-url.txt ]; then
    BACKEND_TUNNEL_URL=$(cat /tmp/backend-tunnel-url.txt)

    # Verify the URL is not empty
    if [ -n "$BACKEND_TUNNEL_URL" ]; then
      echo "✓ Backend tunnel URL found: $BACKEND_TUNNEL_URL"

      # Export backend tunnel URL for mobile app to use
      export EXPO_PUBLIC_API_URL="$BACKEND_TUNNEL_URL"
      export EXPO_PUBLIC_WS_URL="${BACKEND_TUNNEL_URL/https/wss}"

      echo "→ Mobile app will connect to:"
      echo "   API: $EXPO_PUBLIC_API_URL"
      echo "   WS:  $EXPO_PUBLIC_WS_URL"
      break
    fi
  fi

  ATTEMPT=$((ATTEMPT + 1))
  if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
    echo "   Waiting for backend tunnel... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
    sleep 5
  fi
done

# If we exhausted all attempts, fail explicitly
if [ -z "$BACKEND_TUNNEL_URL" ]; then
  echo ""
  echo "❌ ERROR: Backend tunnel URL not found after 30 seconds"
  echo ""
  echo "Possible causes:"
  echo "  1. Backend container not started or not in tunnel mode"
  echo "  2. ngrok failed to initialize"
  echo "  3. Shared volume /tmp not working"
  echo ""
  echo "To fix:"
  echo "  1. Check backend logs: docker logs music-room-backend"
  echo "  2. Verify backend is running: docker ps"
  echo "  3. Restart services: make stop && make dev-tunnel"
  echo ""
  exit 1
fi

echo "=========================================="
echo "Starting Expo Metro bundler with tunnel..."
echo "=========================================="
echo ""
echo "⚠️  Note: Tunnel mode requires EAS login"
echo "   If prompted, please login with your EAS account"
echo ""

# Start Expo with tunnel mode (cannot use --offline with --tunnel)
# @expo/ngrok is now installed locally, so no interactive prompt
# Force --host tunnel explicitly
npx expo start --host tunnel --port 8081

echo ""
echo "Expo tunnel stopped"

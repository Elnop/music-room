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
  if [ -f /tmp/shared/backend-tunnel-url.txt ]; then
    BACKEND_TUNNEL_URL=$(cat /tmp/shared/backend-tunnel-url.txt)

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
  echo "Debugging information:"
  echo "  Shared volume mount: $(ls -la /tmp/shared 2>/dev/null || echo 'NOT FOUND')"
  echo "  Backend tunnel file: $(ls -l /tmp/shared/backend-tunnel-url.txt 2>/dev/null || echo 'NOT FOUND')"
  echo ""
  echo "Possible causes:"
  echo "  1. Backend container not started or not in tunnel mode"
  echo "  2. ngrok failed to initialize (check: docker logs zumik-backend)"
  echo "  3. Shared volume not mounted correctly"
  echo "  4. Permission issues (files not readable by mobile container)"
  echo ""
  echo "To fix:"
  echo "  1. Check backend logs: make logs-backend"
  echo "  2. Verify backend container: docker ps"
  echo "  3. Check tunnel file: docker exec zumik-backend cat /tmp/shared/backend-tunnel-url.txt"
  echo "  4. Rebuild and restart: make stop && docker compose down -v && make dev-tunnel"
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

#!/bin/sh
set -e

echo "=========================================="
echo "Starting Expo in Tunnel Mode"
echo "=========================================="
echo "Mode: Tunnel (cross-network development)"
echo "Port: 8081"
echo "=========================================="

# Check if backend tunnel URL is available
BACKEND_TUNNEL_URL=""
if [ -f /tmp/backend-tunnel-url.txt ]; then
  BACKEND_TUNNEL_URL=$(cat /tmp/backend-tunnel-url.txt)
  echo "✓ Backend tunnel URL found: $BACKEND_TUNNEL_URL"

  # Export backend tunnel URL for mobile app to use
  export EXPO_PUBLIC_API_URL="$BACKEND_TUNNEL_URL"
  export EXPO_PUBLIC_WS_URL="${BACKEND_TUNNEL_URL/https/wss}"

  echo "→ Mobile app will connect to:"
  echo "   API: $EXPO_PUBLIC_API_URL"
  echo "   WS:  $EXPO_PUBLIC_WS_URL"
else
  echo "⚠️  Backend tunnel URL not found"
  echo "   Using default: http://localhost:3000"
  echo "   Make sure backend is running in tunnel mode"
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

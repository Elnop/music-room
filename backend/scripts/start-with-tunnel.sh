#!/bin/sh
set -e

echo "=========================================="
echo "Starting Backend with ngrok Tunnel"
echo "=========================================="

# In Docker /tmp/shared is the tunnel-info volume; outside Docker
# (npm run dev:tunnel) it is a plain directory shared with
# mobile/scripts/start-expo-tunnel.sh on the same machine.
mkdir -p /tmp/shared

# The shared volume outlives the container: drop the previous run's URL so the
# mobile container never picks it up while ngrok starts (#225).
rm -f /tmp/shared/backend-tunnel-url.txt

# Docker passes backend/.env as the environment; outside Docker read the token
# from it (the script runs from backend/).
if [ -z "$NGROK_AUTHTOKEN" ] && [ -f .env ]; then
  NGROK_AUTHTOKEN=$(sed -n 's/^NGROK_AUTHTOKEN=//p' .env | tail -1 | tr -d "\"'")
fi

# Check if NGROK_AUTHTOKEN is set
if [ -z "$NGROK_AUTHTOKEN" ]; then
  echo "❌ Error: NGROK_AUTHTOKEN not set"
  echo ""
  echo "To fix:"
  echo "  1. Sign up for ngrok: https://dashboard.ngrok.com/signup"
  echo "  2. Get your authtoken: https://dashboard.ngrok.com/get-started/your-authtoken"
  echo "  3. Add to backend/.env:"
  echo "     NGROK_AUTHTOKEN=your_authtoken_here"
  echo ""
  exit 1
fi

# Start ngrok tunnel in background
echo "→ Starting ngrok tunnel on port 3000..."
npx ngrok http 3000 --authtoken "$NGROK_AUTHTOKEN" --log stdout --log-level info > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

echo "→ Waiting for ngrok tunnel to initialize..."
sleep 5

# Extract tunnel URL from ngrok logs (API method doesn't work reliably in Docker)
TUNNEL_URL=""
for i in 1 2 3 4 5; do
  TUNNEL_URL=$(grep -o 'url=https://[^[:space:]]*' /tmp/ngrok.log 2>/dev/null | head -1 | cut -d'=' -f2)
  if [ -n "$TUNNEL_URL" ]; then
    break
  fi
  echo "→ Attempt $i: Waiting for tunnel..."
  sleep 2
done

if [ -z "$TUNNEL_URL" ]; then
  echo "❌ Failed to get ngrok tunnel URL"
  echo "→ Check ngrok logs at /tmp/ngrok.log"
  kill $NGROK_PID 2>/dev/null || true
  exit 1
fi

echo "=========================================="
echo "✓ Backend Tunnel Active"
echo "=========================================="
echo "🌐 Tunnel URL: $TUNNEL_URL"
echo "📍 Local URL:  http://localhost:3000"
echo "🔍 ngrok Web Interface: http://localhost:4040"
echo "=========================================="

# Save tunnel URL to the shared directory for mobile to read
echo "$TUNNEL_URL" > /tmp/shared/backend-tunnel-url.txt
chmod 644 /tmp/shared/backend-tunnel-url.txt
echo "✓ Tunnel URL saved: /tmp/shared/backend-tunnel-url.txt"

# Export for CORS configuration
export TUNNEL_URL

# Start backend with hot reload
echo "→ Starting backend server..."
npm run dev

#!/bin/sh
set -e

echo "=========================================="
echo "Starting Backend with ngrok Tunnel"
echo "=========================================="

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

# Extract tunnel URL from ngrok API
TUNNEL_URL=""
for i in 1 2 3 4 5; do
  TUNNEL_URL=$(wget -qO- http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*"' | grep -o 'https://[^"]*' | head -1)
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

# Save tunnel URL to file for mobile to read
echo "$TUNNEL_URL" > /tmp/backend-tunnel-url.txt

# Export for CORS configuration
export TUNNEL_URL

# Start backend with hot reload
echo "→ Starting backend server..."
npm run dev

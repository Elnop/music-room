#!/bin/sh
# Automatic EAS initialization using EXPO_TOKEN from .env
# No interactive login needed!

set -e

echo "=========================================="
echo "EAS Auto-Setup (Token-Based)"
echo "=========================================="

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ Error: mobile/.env not found"
  exit 1
fi

# Load EXPO_TOKEN from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep '^EXPO_TOKEN=' | xargs)
fi

# Check if EXPO_TOKEN is set
if [ -z "$EXPO_TOKEN" ]; then
  echo "❌ Error: EXPO_TOKEN not found in .env"
  echo ""
  echo "To fix:"
  echo "  1. Go to https://expo.dev/settings/access-tokens"
  echo "  2. Create a new Personal Access Token"
  echo "  3. Add to mobile/.env:"
  echo "     EXPO_TOKEN=expo_your_token_here"
  echo ""
  exit 1
fi

# Verify token works
echo "→ Verifying EXPO_TOKEN..."
WHOAMI_OUTPUT=$(npx eas whoami 2>&1)
if echo "$WHOAMI_OUTPUT" | grep -q "authenticated using EXPO_TOKEN"; then
  EXPO_USER=$(echo "$WHOAMI_OUTPUT" | head -n 1)
  echo "✓ Authenticated as: $EXPO_USER"
else
  echo "❌ EXPO_TOKEN is invalid or expired"
  echo "   Create a new token at: https://expo.dev/settings/access-tokens"
  echo "   Output was: $WHOAMI_OUTPUT"
  exit 1
fi

# Check if project is initialized
if [ ! -f app.config.js ] || ! grep -q "projectId" app.config.js 2>/dev/null; then
  echo "→ Initializing EAS project..."
  npx eas init --non-interactive || echo "⚠️  Init may have failed, continuing..."
else
  echo "✓ EAS project already initialized"
fi

echo "=========================================="
echo "✓ EAS Setup Complete"
echo "=========================================="

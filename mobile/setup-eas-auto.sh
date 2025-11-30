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
if npx eas whoami 2>/dev/null | grep -q "@"; then
  EXPO_USER=$(npx eas whoami)
  echo "✓ Authenticated as: $EXPO_USER"
else
  echo "❌ EXPO_TOKEN is invalid or expired"
  echo "   Create a new token at: https://expo.dev/settings/access-tokens"
  exit 1
fi

# Check if project is initialized
if [ ! -f app.json ] || ! grep -q "projectId" app.json 2>/dev/null; then
  echo "→ Initializing EAS project..."
  npx eas init --non-interactive || echo "⚠️  Init may have failed, continuing..."
else
  echo "✓ EAS project already initialized"
fi

echo "=========================================="
echo "✓ EAS Setup Complete"
echo "=========================================="

#!/bin/sh
# Automatic EAS login and initialization using credentials from .env
# This script automates the EAS setup process for tunnel mode

set -e

echo "=========================================="
echo "EAS Auto-Setup"
echo "=========================================="

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ Error: mobile/.env not found"
  exit 1
fi

# Extract EAS credentials from .env
EAS_EMAIL=$(grep "# eas email" .env | sed 's/.*: //')
EAS_PASSWORD=$(grep "# eas mdp" .env | sed 's/.*: //')

if [ -z "$EAS_EMAIL" ] || [ -z "$EAS_PASSWORD" ]; then
  echo "❌ Error: EAS credentials not found in .env"
  echo "   Add: # eas email : your@email.com"
  echo "   Add: # eas mdp : YourPassword"
  exit 1
fi

# Check if already logged in
if npx eas whoami 2>/dev/null | grep -q "$EAS_EMAIL"; then
  echo "✓ Already logged in as: $EAS_EMAIL"
else
  echo "→ Logging in to EAS as: $EAS_EMAIL"

  # Auto-login using expect (handles interactive prompts)
  npx expect << EOF
set timeout 30
spawn npx eas login
expect "Email or username"
send "$EAS_EMAIL\r"
expect "Password"
send "$EAS_PASSWORD\r"
expect eof
EOF

  if [ $? -eq 0 ]; then
    echo "✓ EAS login successful"
  else
    echo "❌ EAS login failed"
    exit 1
  fi
fi

# Check if project is initialized
if [ ! -f app.json ] || ! grep -q "projectId" app.json 2>/dev/null; then
  echo "→ Initializing EAS project..."
  npx eas init --id auto || echo "⚠️  Init may have failed, continuing..."
else
  echo "✓ EAS project already initialized"
fi

echo "=========================================="
echo "✓ EAS Setup Complete"
echo "=========================================="

#!/bin/bash
# ==============================================================================
# Build APK with Docker - Simplified Script
# ==============================================================================
# Usage: ./scripts/build-apk-docker.sh [tunnel-url]
# Example: ./scripts/build-apk-docker.sh https://abc123.ngrok-free.app
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Icons
ICON_SUCCESS="✓"
ICON_ERROR="✗"
ICON_INFO="ℹ"
ICON_ROCKET="🚀"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MOBILE_DIR="$PROJECT_ROOT/mobile"
OUTPUT_DIR="$PROJECT_ROOT/build"

echo ""
echo -e "${BLUE}=========================================="
echo "🏗️  Build APK with Docker"
echo -e "==========================================${NC}"
echo ""

# Check if tunnel URL is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}${ICON_INFO} No tunnel URL provided${NC}"
    echo -e "${YELLOW}${ICON_INFO} Checking for existing tunnel...${NC}"

    # Try to get tunnel URL from running backend
    if [ -f "/tmp/shared/backend-tunnel-url.txt" ]; then
        TUNNEL_URL=$(cat /tmp/shared/backend-tunnel-url.txt | tr -d '\n\r' | xargs)
        echo -e "${GREEN}${ICON_SUCCESS} Found tunnel URL: $TUNNEL_URL${NC}"
    else
        echo -e "${YELLOW}${ICON_INFO} Using placeholder URL (will fail to connect)${NC}"
        TUNNEL_URL="https://placeholder.ngrok-free.app"
    fi
else
    TUNNEL_URL="$1"
    echo -e "${GREEN}${ICON_SUCCESS} Using provided tunnel URL: $TUNNEL_URL${NC}"
fi

# Extract WebSocket URL
WS_URL=$(echo "$TUNNEL_URL" | sed 's/https/wss/g')

echo ""
echo -e "${BLUE}${ICON_INFO} Configuration:${NC}"
echo "   API URL: $TUNNEL_URL"
echo "   WS URL:  $WS_URL"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Build Docker image
echo -e "${YELLOW}${ICON_INFO} Building Docker image...${NC}"
docker build \
    -f "$MOBILE_DIR/Dockerfile.android-build" \
    -t zumik-apk-builder \
    "$PROJECT_ROOT"

echo ""
echo -e "${YELLOW}${ICON_INFO} Running APK build...${NC}"
echo -e "${YELLOW}   This may take 5-10 minutes...${NC}"
echo ""

# Run build
docker run --rm \
    -v "$OUTPUT_DIR:/output" \
    -e EXPO_PUBLIC_API_URL="$TUNNEL_URL" \
    -e EXPO_PUBLIC_WS_URL="$WS_URL" \
    zumik-apk-builder

echo ""
echo -e "${GREEN}=========================================="
echo "${ICON_SUCCESS} Build Complete!"
echo -e "==========================================${NC}"
echo ""
echo -e "${GREEN}📦 APK Location:${NC}"
echo "   $OUTPUT_DIR/app-release.apk"
echo ""
echo -e "${BLUE}📡 Configured Backend:${NC}"
echo "   $TUNNEL_URL"
echo ""
echo -e "${YELLOW}📱 Install on Device:${NC}"
echo "   adb install $OUTPUT_DIR/app-release.apk"
echo ""
echo -e "${BLUE}${ICON_INFO} Or transfer the APK to your device manually${NC}"
echo ""

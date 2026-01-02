#!/bin/bash
# ==============================================================================
# Generate Network Security Configuration for Android
# ==============================================================================
# Purpose: Allow cleartext HTTP connections to localhost and ngrok domains
# Usage: ./scripts/generate-network-config.sh
# ==============================================================================

set -e

# Extract domain from EXPO_PUBLIC_API_URL
NGROK_DOMAIN=""
if [ -n "$EXPO_PUBLIC_API_URL" ]; then
    NGROK_DOMAIN=$(echo "$EXPO_PUBLIC_API_URL" | sed -E 's|https?://([^/]+).*|\1|')
fi

# Path to network security config
NETWORK_CONFIG_PATH="android/app/src/main/res/xml/network_security_config.xml"

# Create xml directory if it doesn't exist
mkdir -p "$(dirname "$NETWORK_CONFIG_PATH")"

# Generate network security config
cat > "$NETWORK_CONFIG_PATH" <<EOF
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Allow cleartext traffic for localhost -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">127.0.0.1</domain>
EOF

# Add ngrok domain if available
if [ -n "$NGROK_DOMAIN" ]; then
    cat >> "$NETWORK_CONFIG_PATH" <<EOF
        <!-- ngrok domain -->
        <domain includeSubdomains="true">$NGROK_DOMAIN</domain>
        <domain includeSubdomains="true">ngrok-free.app</domain>
EOF
fi

# Close the XML
cat >> "$NETWORK_CONFIG_PATH" <<EOF
    </domain-config>
</network-security-config>
EOF

echo "Network security config generated at: $NETWORK_CONFIG_PATH"
if [ -n "$NGROK_DOMAIN" ]; then
    echo "  - Allowed domain: $NGROK_DOMAIN"
fi
echo "  - Allowed: localhost, 10.0.2.2, 127.0.0.1, ngrok-free.app"

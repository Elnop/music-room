#!/bin/bash
# Script to dynamically generate Android network security config
# Reads backend URL from .env and extracts hostname

set -e

echo "🔧 Generating dynamic network security config..."

# Paths
MANIFEST_PATH="android/app/src/main/AndroidManifest.xml"
XML_DIR="android/app/src/main/res/xml"
NETWORK_CONFIG_PATH="$XML_DIR/network_security_config.xml"
ENV_FILE=".env"

# Check if manifest exists
if [ ! -f "$MANIFEST_PATH" ]; then
    echo "❌ AndroidManifest.xml not found at $MANIFEST_PATH"
    exit 1
fi

# Extract API URL from .env
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env file not found"
    exit 1
fi

API_URL=$(grep "^EXPO_PUBLIC_API_URL=" "$ENV_FILE" | cut -d'=' -f2- | tr -d ' ')

if [ -z "$API_URL" ]; then
    echo "❌ EXPO_PUBLIC_API_URL not found in .env"
    exit 1
fi

echo "📝 Found API URL: $API_URL"

# Extract hostname from URL using awk
HOSTNAME=$(echo "$API_URL" | awk -F[/:] '{print $4}')

if [ -z "$HOSTNAME" ]; then
    echo "❌ Could not extract hostname from $API_URL"
    exit 1
fi

echo "📝 Extracted hostname: $HOSTNAME"

# Build domain list
DOMAINS=("localhost" "10.0.2.2")

# Add backend hostname if not localhost or emulator
if [ "$HOSTNAME" != "localhost" ] && [ "$HOSTNAME" != "10.0.2.2" ]; then
    DOMAINS+=("$HOSTNAME")
    echo "✅ Added backend domain: $HOSTNAME"
else
    echo "ℹ️  Backend is localhost/emulator, using defaults only"
fi

# Step 1: Add usesCleartextTraffic and networkSecurityConfig to manifest
echo "📝 Patching AndroidManifest.xml..."

# Check if already patched
if grep -q 'android:usesCleartextTraffic="true"' "$MANIFEST_PATH"; then
    echo "✅ Manifest already patched (usesCleartextTraffic found)"
else
    # Add usesCleartextTraffic and networkSecurityConfig to <application> tag
    sed -i 's/<application /<application android:usesCleartextTraffic="true" android:networkSecurityConfig="@xml\/network_security_config" /' "$MANIFEST_PATH"
    echo "✅ Added usesCleartextTraffic and networkSecurityConfig to manifest"
fi

# Step 2: Create network_security_config.xml dynamically
echo "📝 Creating network_security_config.xml..."

# Create xml directory if it doesn't exist
mkdir -p "$XML_DIR"

# Generate domain entries
DOMAIN_ENTRIES=""
for domain in "${DOMAINS[@]}"; do
    DOMAIN_ENTRIES+="        <domain includeSubdomains=\"true\">$domain</domain>\n"
done

# Write network security config
cat > "$NETWORK_CONFIG_PATH" << EOF
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Allow cleartext traffic for local development -->
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <!-- Dynamically configured domains -->
    <domain-config cleartextTrafficPermitted="true">
$(echo -e "$DOMAIN_ENTRIES")    </domain-config>
</network-security-config>
EOF

echo "✅ Created $NETWORK_CONFIG_PATH"
echo "✅ Allowed domains: ${DOMAINS[@]}"
echo "✅ Android network configuration generated successfully!"

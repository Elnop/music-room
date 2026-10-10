#!/bin/sh
set -e

echo "=========================================="
echo "Starting Expo Development Server"
echo "=========================================="
echo "Host IP: ${REACT_NATIVE_PACKAGER_HOSTNAME:-0.0.0.0}"
echo "Port: 8081"
echo "Mode: Offline (no login, hot reload enabled)"
echo "=========================================="

# Start Expo with --offline flag only
# Cannot use --lan with --offline (conflict), but REACT_NATIVE_PACKAGER_HOSTNAME env var handles IP
# Skips login prompts while keeping hot reload/fast refresh active
# --dev-client: the app runs as the Zumik debug build, not in Expo Go (its
# native modules are missing there); Metro serves the same bundle either way
npx expo start --offline --dev-client --port 8081

echo "Expo server stopped"

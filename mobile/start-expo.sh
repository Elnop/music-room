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
npx expo start --offline --port 8081

echo "Expo server stopped"

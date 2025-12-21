# ==============================================================================
# Configuration & Variables
# ==============================================================================
# Shared configuration used across all Makefile modules

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Status indicators
ICON_SUCCESS := ✓
ICON_ERROR := ✗
ICON_WARNING := ⚠️
ICON_ARROW := →
ICON_BULLET := •
ICON_INFO := ℹ

# Docker Compose command (detect version)
DOCKER_COMPOSE := $(shell command -v docker-compose 2>/dev/null)
ifeq ($(DOCKER_COMPOSE),)
	DOCKER_COMPOSE := docker compose
endif

# Service names
BACKEND_SERVICE := backend
MOBILE_SERVICE := mobile

# Directories
BACKEND_DIR := backend
MOBILE_DIR := mobile

# Ports
BACKEND_PORT := 3000
EXPO_PORT := 19000
METRO_PORT := 8081
NGROK_PORT := 4040

# URLs
BACKEND_URL := http://localhost:$(BACKEND_PORT)
EXPO_DEVTOOLS_URL := http://localhost:$(EXPO_PORT)
METRO_URL := http://localhost:$(METRO_PORT)
NGROK_UI_URL := http://localhost:$(NGROK_PORT)

# Files
BACKEND_ENV := $(BACKEND_DIR)/.env
BACKEND_ENV_EXAMPLE := $(BACKEND_DIR)/.env.example
MOBILE_ENV := $(MOBILE_DIR)/.env
MOBILE_ENV_EXAMPLE := $(MOBILE_DIR)/.env.example
TUNNEL_URL_FILE := /tmp/backend-tunnel-url.txt
SHARED_TUNNEL_FILE := /tmp/shared/backend-tunnel-url.txt

# Node modules
BACKEND_NODE_MODULES := $(BACKEND_DIR)/node_modules
MOBILE_NODE_MODULES := $(MOBILE_DIR)/node_modules

# Build artifacts
BACKEND_DIST := $(BACKEND_DIR)/dist
MOBILE_EXPO := $(MOBILE_DIR)/.expo

# Timings (in seconds)
EXPO_WAIT_TIME := 15
TUNNEL_WAIT_TIME := 20
SETUP_WAIT_TIME := 5
SHORT_WAIT_TIME := 3

# Detect local IP address
# Try multiple methods to get local IP (works on Linux, macOS, WSL)
HOST_IP := $(shell \
	ip route get 1 2>/dev/null | awk '{print $$7; exit}' || \
	hostname -I 2>/dev/null | awk '{print $$1}' || \
	ipconfig getifaddr en0 2>/dev/null || \
	echo "0.0.0.0" \
)
export HOST_IP

# Expo URL
EXPO_URL := exp://$(HOST_IP):$(METRO_PORT)

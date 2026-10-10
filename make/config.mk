# ==============================================================================
# Configuration & Variables
# ==============================================================================
# Shared configuration used across all Makefile modules

# Force zsh shell (team uses zsh for environment variables and consistent behavior)
SHELL := /bin/zsh
.SHELLFLAGS := -c

# Detect operating system
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Darwin)
	OS_TYPE := macos
else ifeq ($(UNAME_S),Linux)
	OS_TYPE := linux
else
	OS_TYPE := unknown
endif
export OS_TYPE

# Colors for output (bash-compatible ANSI codes)
BLUE := $(shell printf '\033[0;34m')
GREEN := $(shell printf '\033[0;32m')
YELLOW := $(shell printf '\033[0;33m')
RED := $(shell printf '\033[0;31m')
CYAN := $(shell printf '\033[0;36m')
NC := $(shell printf '\033[0m') # No Color
RESET := $(NC)
BOLD := $(shell printf '\033[1m')

# Status indicators
ICON_SUCCESS := ✓
ICON_ERROR := ✗
ICON_WARNING := ⚠️
ICON_ARROW := →
ICON_BULLET := •
ICON_INFO := ℹ

# ==============================================================================
# Docker Configuration (API 1.42 compatible - using docker run instead of docker-compose)
# ==============================================================================

# Disable BuildKit for Docker API 1.42 compatibility
export DOCKER_BUILDKIT := 0

# Docker network name (shared between all containers)
DOCKER_NETWORK := zumik-network

# Container names (consistent naming scheme)
BACKEND_CONTAINER := zumik-backend
MOBILE_CONTAINER := zumik-mobile
REDIS_CONTAINER := zumik-redis

# Lines of history shown before following logs (make logs LOGS_TAIL=500)
LOGS_TAIL ?= 100

# Docker volumes
TUNNEL_VOLUME := tunnel-info
REDIS_VOLUME := redis-data

# Legacy service names (for backward compatibility with existing code)
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
# Improved macOS support: tries all network interfaces (en0, en1, en2)
# Uses ifconfig as fallback to get any non-loopback interface
HOST_IP := $(shell \
	ip route get 1 2>/dev/null | awk '{print $$7; exit}' || \
	hostname -I 2>/dev/null | awk '{print $$1}' || \
	ifconfig 2>/dev/null | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $$2}' || \
	ipconfig getifaddr en0 2>/dev/null || \
	ipconfig getifaddr en1 2>/dev/null || \
	ipconfig getifaddr en2 2>/dev/null || \
	echo "0.0.0.0" \
)
export HOST_IP

# Backend the app calls in dev-docker and dev-local. In development Expo reads
# EXPO_PUBLIC_* from the .env files before the environment, so make writes them
# to mobile/.env.development.local (last in Expo's priority order, git-ignored);
# dev-tunnel writes the live ngrok URL there instead.
MOBILE_DEV_ENV := $(MOBILE_DIR)/.env.development.local
DEV_API_URL := http://$(HOST_IP):$(BACKEND_PORT)
DEV_WS_URL := ws://$(HOST_IP):$(BACKEND_PORT)

# Expo URL
EXPO_URL := exp://$(HOST_IP):$(METRO_PORT)

# Android SDK and Java JDK (for local builds)
# These should be configured in your shell environment (~/.zshrc or ~/.bashrc)
# Example for Linux:
#   export ANDROID_HOME=$HOME/Android/Sdk
#   export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
# Example for macOS:
#   export ANDROID_HOME=$HOME/Library/Android/sdk
#   export JAVA_HOME=/opt/homebrew/opt/openjdk@17

# ========================================
# Redis Configuration
# ========================================
# Note: REDIS_CONTAINER_NAME is now defined above as REDIS_CONTAINER
# Keeping this for backward compatibility with existing scripts
REDIS_CONTAINER_NAME := $(REDIS_CONTAINER)
REDIS_IMAGE := redis:7-alpine
REDIS_PORT := 6379
# Note: REDIS_DATA_VOLUME now uses REDIS_VOLUME defined above
REDIS_DATA_VOLUME := $(REDIS_VOLUME)

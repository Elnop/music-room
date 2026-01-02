# ==============================================================================
# APK Build with Tunnel Commands Module
# ==============================================================================
# Build production APK with ngrok tunnel URL configured
#
# Usage:
#   make dev-tunnel-build-apk          - Start backend+redis+ngrok, build APK with tunnel URL
#   make dev-tunnel-build-apk-install  - Build APK and install on connected device
#
# Requirements:
#   - NGROK_AUTHTOKEN in backend/.env
#   - Android SDK (ANDROID_HOME, adb in PATH)
#   - No EAS required (100% local build)
#
# Flow:
#   1. Validate prerequisites (ngrok token, Android SDK)
#   2. Start backend + redis in tunnel mode (no mobile container)
#   3. Wait for ngrok tunnel to initialize
#   4. Extract tunnel URL from backend container
#   5. Update mobile/.env with tunnel URL (EXPO_PUBLIC_API_URL, EXPO_PUBLIC_WS_URL)
#   6. Build APK with Gradle (expo prebuild + assembleRelease)
#   7. Display APK location and installation instructions
# ==============================================================================

.PHONY: dev-tunnel-build-apk dev-tunnel-build-apk-install dev-tunnel-build-apk-check-prereqs dev-tunnel-build-apk-update-env dev-tunnel-build-apk-build dev-tunnel-build-apk-docker dev-tunnel-build-apk-docker-build build-apk-docker build-apk-docker-with-tunnel build-apk-docker-with-tunnel-legacy

#------------------------------------------------------------
# Main Commands
#------------------------------------------------------------

dev-tunnel-build-apk: dev-tunnel-build-apk-check-prereqs ## Build APK with ngrok tunnel (dev mode)
	$(call print_header,Building APK with Tunnel URL)
	$(call print_subsection,📱 Target: APK for installation on any device)
	@echo "   Backend: Docker container + ngrok tunnel"
	@echo "   Redis: Docker container"
	@echo "   Mobile: Local build (no container)"
	@echo "   URL: Dynamic ngrok tunnel (configured automatically)"
	@echo ""
	$(call print_arrow,Starting backend + redis with tunnel...)
	@COMPOSE_PROFILES="" $(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.tunnel.yml up -d --build backend redis
	$(call blank_line)
	$(call print_success,Backend and Redis started)
	$(call blank_line)
	$(call print_arrow,Waiting for ngrok tunnel to initialize...)
	@echo "   This may take 30-60 seconds on first run..."
	@echo ""
	@# Wait for tunnel URL file with active polling (max 120 seconds)
	@MAX_WAIT=120; \
	COUNTER=0; \
	while [ $$COUNTER -lt $$MAX_WAIT ]; do \
		if $(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.tunnel.yml exec -T $(BACKEND_SERVICE) sh -c 'test -f $(SHARED_TUNNEL_FILE)' >/dev/null 2>&1; then \
			echo "$(GREEN)$(ICON_SUCCESS) Tunnel initialized after $$COUNTER seconds$(NC)"; \
			break; \
		fi; \
		if [ $$((COUNTER % 10)) -eq 0 ] && [ $$COUNTER -gt 0 ]; then \
			echo "   Still waiting... ($$COUNTER/$$MAX_WAIT seconds)"; \
		fi; \
		sleep 1; \
		COUNTER=$$((COUNTER + 1)); \
	done; \
	if [ $$COUNTER -ge $$MAX_WAIT ]; then \
		echo "$(RED)$(ICON_ERROR) Timeout waiting for tunnel ($$MAX_WAIT seconds)$(NC)"; \
		echo ""; \
		echo "$(YELLOW)$(ICON_ARROW) Checking ngrok logs...$(NC)"; \
		$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.tunnel.yml exec -T $(BACKEND_SERVICE) cat /tmp/ngrok.log 2>/dev/null | tail -20 || echo "$(YELLOW)$(ICON_WARNING) Could not read ngrok logs$(NC)"; \
		echo ""; \
		exit 1; \
	fi
	@echo "$(BLUE)$(ICON_INFO) Tunnel file found at: $(SHARED_TUNNEL_FILE)$(NC)"
	$(call blank_line)
	$(call print_arrow,Extracting tunnel URL...)
	@TUNNEL_URL=$$($(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.tunnel.yml exec -T $(BACKEND_SERVICE) cat $(SHARED_TUNNEL_FILE) 2>/dev/null | tr -d '\r\n' || echo ""); \
	if [ -z "$$TUNNEL_URL" ]; then \
		echo "$(RED)$(ICON_ERROR) Failed to get tunnel URL$(NC)"; \
		echo ""; \
		echo "$(YELLOW)$(ICON_WARNING) Possible causes:$(NC)"; \
		echo "  1. ngrok tunnel not initialized yet (wait 10 more seconds and retry)"; \
		echo "  2. Invalid NGROK_AUTHTOKEN in backend/.env"; \
		echo "  3. Backend container failed to start"; \
		echo ""; \
		echo "$(YELLOW)$(ICON_ARROW) Check logs:$(NC) make logs"; \
		echo ""; \
		exit 1; \
	fi; \
	echo "$(GREEN)$(ICON_SUCCESS) Tunnel URL: $$TUNNEL_URL$(NC)"; \
	echo ""; \
	echo "$(YELLOW)$(ICON_ARROW) Updating mobile/.env with tunnel URL...$(NC)"; \
	$(MAKE) dev-tunnel-build-apk-update-env TUNNEL_URL=$$TUNNEL_URL; \
	echo ""; \
	echo "$(YELLOW)$(ICON_ARROW) Building APK...$(NC)"; \
	echo "$(YELLOW)$(ICON_WARNING) ⏳ This takes ~5-10 minutes$(NC)"; \
	echo ""; \
	$(MAKE) dev-tunnel-build-apk-build; \
	echo ""; \
	echo "$(BLUE)=== ✓ Build Complete ===$(NC)"; \
	echo ""; \
	echo "$(YELLOW)📦 APK Location:$(NC)"; \
	echo "   mobile/android/app/build/outputs/apk/release/app-release.apk"; \
	echo ""; \
	echo "$(YELLOW)📡 Configured Backend URL:$(NC)"; \
	echo "   $$TUNNEL_URL"; \
	echo ""; \
	echo "$(YELLOW)📱 Install on Device:$(NC)"; \
	echo "   adb install mobile/android/app/build/outputs/apk/release/app-release.apk"; \
	echo "   OR: make dev-tunnel-build-apk-install (if APK already built)"; \
	echo ""; \
	echo "$(YELLOW)🛑 Stop Services:$(NC)"; \
	echo "   make stop"; \
	echo ""

dev-tunnel-build-apk-install: ## Install APK on connected device (requires APK built first)
	$(call print_header,Installing APK on Device)
	@if [ ! -f "mobile/android/app/build/outputs/apk/release/app-release.apk" ]; then \
		echo ""; \
		echo "$(RED)$(ICON_ERROR) APK not found: mobile/android/app/build/outputs/apk/release/app-release.apk$(NC)"; \
		echo ""; \
		echo "$(YELLOW)$(ICON_WARNING) Run this command first:$(NC)"; \
		echo "  $(GREEN)make dev-tunnel-build-apk$(NC) - Build APK with tunnel URL"; \
		echo ""; \
		exit 1; \
	fi
	$(call print_arrow,Checking for connected devices...)
	@DEVICES=$$(adb devices | grep -v "List" | grep "device$$" | wc -l); \
	if [ "$$DEVICES" -eq 0 ]; then \
		echo ""; \
		echo "$(RED)$(ICON_ERROR) No devices connected$(NC)"; \
		echo ""; \
		echo "$(YELLOW)$(ICON_WARNING) Connect your device via USB and enable USB debugging$(NC)"; \
		echo ""; \
		exit 1; \
	fi; \
	echo "$(GREEN)$(ICON_SUCCESS) Found $$DEVICES device(s)$(NC)"
	@echo ""
	$(call print_arrow,Installing APK...)
	@adb install -r mobile/android/app/build/outputs/apk/release/app-release.apk
	$(call blank_line)
	$(call print_header,✓ Installation Complete)
	@echo "$(GREEN)$(ICON_SUCCESS) App installed successfully$(NC)"
	@echo ""
	@echo "$(BLUE)$(ICON_INFO) The app is configured to use the tunnel URL from mobile/.env$(NC)"
	@echo ""

#------------------------------------------------------------
# Helper Targets (Internal)
#------------------------------------------------------------

dev-tunnel-build-apk-check-prereqs:
	@# Check NGROK_AUTHTOKEN in backend/.env
	@if [ ! -f "$(BACKEND_ENV)" ]; then \
		echo "$(RED)$(ICON_ERROR) Backend .env not found: $(BACKEND_ENV)$(NC)"; \
		echo ""; \
		echo "$(YELLOW)$(ICON_WARNING) Run: make install$(NC)"; \
		echo ""; \
		exit 1; \
	fi; \
	if ! grep -q "^NGROK_AUTHTOKEN=" $(BACKEND_ENV) || grep -q "^NGROK_AUTHTOKEN=your_ngrok_authtoken_here" $(BACKEND_ENV) || grep -q "^NGROK_AUTHTOKEN=$$" $(BACKEND_ENV); then \
		echo "$(RED)$(ICON_ERROR) NGROK_AUTHTOKEN not configured in backend/.env$(NC)"; \
		echo ""; \
		echo "$(YELLOW)$(ICON_WARNING) Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken$(NC)"; \
		echo "$(YELLOW)$(ICON_WARNING) Then add to backend/.env: NGROK_AUTHTOKEN=your_token_here$(NC)"; \
		echo ""; \
		exit 1; \
	fi
	@# Check Android SDK
	@if ! command -v adb >/dev/null 2>&1; then \
		echo "$(RED)$(ICON_ERROR) Android SDK not found - adb command missing$(NC)"; \
		echo ""; \
		echo "$(YELLOW)$(ICON_WARNING) Install Android SDK and set ANDROID_HOME$(NC)"; \
		echo "$(YELLOW)$(ICON_WARNING) Add platform-tools to PATH: export PATH=\$$ANDROID_HOME/platform-tools:\$$PATH$(NC)"; \
		echo ""; \
		exit 1; \
	fi
	@# Check mobile/.env
	@if [ ! -f "$(MOBILE_ENV)" ]; then \
		echo "$(RED)$(ICON_ERROR) Mobile .env not found: $(MOBILE_ENV)$(NC)"; \
		echo ""; \
		echo "$(YELLOW)$(ICON_WARNING) Run: make install$(NC)"; \
		echo ""; \
		exit 1; \
	fi

dev-tunnel-build-apk-update-env:
	@# Update mobile/.env with tunnel URL
	@# Usage: make dev-tunnel-build-apk-update-env TUNNEL_URL=https://xxx.ngrok-free.app
	@if [ -z "$(TUNNEL_URL)" ]; then \
		echo "$(RED)$(ICON_ERROR) TUNNEL_URL not provided$(NC)"; \
		exit 1; \
	fi; \
	API_URL="$(TUNNEL_URL)"; \
	WS_URL="$$(echo $(TUNNEL_URL) | sed 's|^http|ws|')"; \
	if grep -q '^EXPO_PUBLIC_API_URL=' $(MOBILE_ENV); then \
		if [ "$(OS_TYPE)" = "macos" ]; then \
			sed -i '' "s|^EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=$$API_URL|" $(MOBILE_ENV); \
		else \
			sed -i "s|^EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=$$API_URL|" $(MOBILE_ENV); \
		fi; \
		echo "$(GREEN)$(ICON_SUCCESS) Updated EXPO_PUBLIC_API_URL=$$API_URL$(NC)"; \
	else \
		echo "" >> $(MOBILE_ENV); \
		echo "# Tunnel URL (configured by make dev-tunnel-build-apk)" >> $(MOBILE_ENV); \
		echo "EXPO_PUBLIC_API_URL=$$API_URL" >> $(MOBILE_ENV); \
		echo "$(GREEN)$(ICON_SUCCESS) Added EXPO_PUBLIC_API_URL=$$API_URL$(NC)"; \
	fi; \
	if grep -q '^EXPO_PUBLIC_WS_URL=' $(MOBILE_ENV); then \
		if [ "$(OS_TYPE)" = "macos" ]; then \
			sed -i '' "s|^EXPO_PUBLIC_WS_URL=.*|EXPO_PUBLIC_WS_URL=$$WS_URL|" $(MOBILE_ENV); \
		else \
			sed -i "s|^EXPO_PUBLIC_WS_URL=.*|EXPO_PUBLIC_WS_URL=$$WS_URL|" $(MOBILE_ENV); \
		fi; \
		echo "$(GREEN)$(ICON_SUCCESS) Updated EXPO_PUBLIC_WS_URL=$$WS_URL$(NC)"; \
	else \
		echo "EXPO_PUBLIC_WS_URL=$$WS_URL" >> $(MOBILE_ENV); \
		echo "$(GREEN)$(ICON_SUCCESS) Added EXPO_PUBLIC_WS_URL=$$WS_URL$(NC)"; \
	fi

dev-tunnel-build-apk-build:
	@# Build APK (internal target - reuses prod-build-apk-manual logic)
	@# Install mobile dependencies first (needed for expo prebuild)
	@cd mobile && npm install
	@cd mobile && npx expo prebuild --clean
	@cd mobile && ./scripts/generate-network-config.sh
	@cd mobile/android && ./gradlew assembleRelease

#------------------------------------------------------------
# Containerized Android Build (using hmerritt/android-sdk)
#------------------------------------------------------------

dev-tunnel-build-apk-docker: dev-tunnel-build-apk-check-prereqs ## Build APK with ngrok tunnel (containerized Android SDK)
	$(call print_header,Building APK with Tunnel URL (Docker Android SDK))
	$(call print_subsection,📱 Target: APK for installation on any device)
	@echo "   Backend: Docker container + ngrok tunnel"
	@echo "   Redis: Docker container"
	@echo "   Mobile: Docker container with Android SDK"
	@echo "   URL: Dynamic ngrok tunnel (configured automatically)"
	@echo ""
	$(call print_arrow,Starting backend + redis with tunnel...)
	@COMPOSE_PROFILES="" $(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.tunnel.yml up -d --build backend redis
	$(call blank_line)
	$(call print_success,Backend and Redis started)
	$(call blank_line)
	$(call print_arrow,Waiting for ngrok tunnel to initialize...)
	@echo "   This may take 30-60 seconds on first run..."
	@echo ""
	@# Wait for tunnel URL file with active polling (max 120 seconds)
	@MAX_WAIT=120; \
	COUNTER=0; \
	while [ $$COUNTER -lt $$MAX_WAIT ]; do \
		if $(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.tunnel.yml exec -T $(BACKEND_SERVICE) sh -c 'test -f $(SHARED_TUNNEL_FILE)' >/dev/null 2>&1; then \
			echo "$(GREEN)$(ICON_SUCCESS) Tunnel initialized after $$COUNTER seconds$(NC)"; \
			break; \
		fi; \
		if [ $$((COUNTER % 10)) -eq 0 ] && [ $$COUNTER -gt 0 ]; then \
			echo "   Still waiting... ($$COUNTER/$$MAX_WAIT seconds)"; \
		fi; \
		sleep 1; \
		COUNTER=$$((COUNTER + 1)); \
	done; \
	if [ $$COUNTER -ge $$MAX_WAIT ]; then \
		echo "$(RED)$(ICON_ERROR) Timeout waiting for tunnel ($$MAX_WAIT seconds)$(NC)"; \
		echo ""; \
		echo "$(YELLOW)$(ICON_ARROW) Checking ngrok logs...$(NC)"; \
		$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.tunnel.yml exec -T $(BACKEND_SERVICE) cat /tmp/ngrok.log 2>/dev/null | tail -20 || echo "$(YELLOW)$(ICON_WARNING) Could not read ngrok logs$(NC)"; \
		echo ""; \
		exit 1; \
	fi
	@echo "$(BLUE)$(ICON_INFO) Tunnel file found at: $(SHARED_TUNNEL_FILE)$(NC)"
	$(call blank_line)
	$(call print_arrow,Extracting tunnel URL...)
	@TUNNEL_URL=$$($(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.tunnel.yml exec -T $(BACKEND_SERVICE) cat $(SHARED_TUNNEL_FILE) 2>/dev/null | tr -d '\r\n' || echo ""); \
	if [ -z "$$TUNNEL_URL" ]; then \
		echo "$(RED)$(ICON_ERROR) Failed to get tunnel URL$(NC)"; \
		echo ""; \
		echo "$(YELLOW)$(ICON_WARNING) Possible causes:$(NC)"; \
		echo "  1. ngrok tunnel not initialized yet (wait 10 more seconds and retry)"; \
		echo "  2. Invalid NGROK_AUTHTOKEN in backend/.env"; \
		echo "  3. Backend container failed to start"; \
		echo ""; \
		echo "$(YELLOW)$(ICON_ARROW) Check logs:$(NC) make logs"; \
		echo ""; \
		exit 1; \
	fi; \
	echo "$(GREEN)$(ICON_SUCCESS) Tunnel URL: $$TUNNEL_URL$(NC)"; \
	echo ""; \
	echo "$(YELLOW)$(ICON_ARROW) Updating mobile/.env with tunnel URL...$(NC)"; \
	$(MAKE) dev-tunnel-build-apk-update-env TUNNEL_URL=$$TUNNEL_URL; \
	echo ""; \
	echo "$(YELLOW)$(ICON_ARROW) Starting Android builder container...$(NC)"; \
	$(DOCKER_COMPOSE) -f docker-compose.android-build.yml up -d; \
	echo ""; \
	echo "$(YELLOW)$(ICON_ARROW) Building APK in container...$(NC)"; \
	echo "$(YELLOW)$(ICON_WARNING) ⏳ This takes ~10-15 minutes on first run$(NC)"; \
	echo ""; \
	$(MAKE) dev-tunnel-build-apk-docker-build TUNNEL_URL=$$TUNNEL_URL; \
	echo ""; \
	echo "$(BLUE)=== ✓ Build Complete ===$(NC)"; \
	echo ""; \
	echo "$(YELLOW)📦 APK Location:$(NC)"; \
	echo "   mobile/android/app/build/outputs/apk/release/app-release.apk"; \
	echo ""; \
	echo "$(YELLOW)📡 Configured Backend URL:$(NC)"; \
	echo "   $$TUNNEL_URL"; \
	echo ""; \
	echo "$(YELLOW)📱 Install on Device:$(NC)"; \
	echo "   adb install mobile/android/app/build/outputs/apk/release/app-release.apk"; \
	echo "   OR: make dev-tunnel-build-apk-install (if APK already built)"; \
	echo ""; \
	echo "$(YELLOW)🛑 Stop Services:$(NC)"; \
	echo "   make stop && docker-compose -f docker-compose.android-build.yml down"; \
	echo ""

dev-tunnel-build-apk-docker-build:
	@# Build APK inside Android builder container
	@echo "$(BLUE)$(ICON_INFO) Installing mobile dependencies...$(NC)"
	@$(DOCKER_COMPOSE) -f docker-compose.android-build.yml exec -T android-builder sh -c "npm install --ignore-scripts && npm run postinstall || true"
	@echo ""
	@echo "$(BLUE)$(ICON_INFO) Running expo prebuild...$(NC)"
	@$(DOCKER_COMPOSE) -f docker-compose.android-build.yml exec -T android-builder npx expo prebuild --clean
	@echo ""
	@echo "$(BLUE)$(ICON_INFO) Generating network security config...$(NC)"
	@$(DOCKER_COMPOSE) -f docker-compose.android-build.yml exec -T android-builder ./scripts/generate-network-config.sh
	@echo ""
	@echo "$(BLUE)$(ICON_INFO) Building APK with Gradle...$(NC)"
	@$(DOCKER_COMPOSE) -f docker-compose.android-build.yml exec -T android-builder sh -c "cd android && ./gradlew assembleRelease"

#------------------------------------------------------------
# Simplified Docker Build Commands (Standalone)
#------------------------------------------------------------

build-apk-docker:
	@# Build APK with Docker (simple, standalone)
	@echo ""
	@echo "$(YELLOW)=========================================="
	@echo "🏗️  Building APK with Docker (Standalone)"
	@echo "==========================================$(NC)"
	@echo ""
	@echo "$(BLUE)$(ICON_INFO) This will:$(NC)"
	@echo "   1. Build Docker image with Android SDK"
	@echo "   2. Build APK inside container"
	@echo "   3. Output APK to build/ directory"
	@echo ""
	@echo "$(YELLOW)⚠️  Note: Uses placeholder URL if no tunnel is running$(NC)"
	@echo ""
	@./scripts/build-apk-docker.sh

build-apk-docker-with-tunnel:
	@# Build APK with Docker using detected tunnel URL
	@echo ""
	@echo "$(YELLOW)=========================================="
	@echo "🏗️  Build APK with Docker + Tunnel"
	@echo "==========================================$(NC)"
	@echo ""
	@echo "$(BLUE)$(ICON_INFO) Step 1/3: Starting backend + tunnel...$(NC)"
	@COMPOSE_PROFILES="" $(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.tunnel.yml up -d --build backend redis

build-apk-docker-with-tunnel-legacy:
	@# Build APK with Docker (legacy mode for old Docker versions)
	@echo ""
	@echo "$(YELLOW)=========================================="
	@echo "🏗️  Build APK with Docker + Tunnel (Legacy)"
	@echo "==========================================$(NC)"
	@echo ""
	@echo "$(YELLOW)ℹ Using legacy compose files for Docker API 1.42 compatibility$(NC)"
	@echo ""
	@echo "$(BLUE)$(ICON_INFO) Step 1/3: Starting backend + tunnel...$(NC)"
	@COMPOSE_PROFILES="" $(DOCKER_COMPOSE) -f docker-compose.legacy.yml -f docker-compose.tunnel.legacy.yml up -d --build backend redis
	@echo ""
	@echo "$(BLUE)$(ICON_INFO) Step 2/3: Waiting for tunnel initialization...$(NC)"
	@MAX_WAIT=120; \
	COUNTER=0; \
	while [ $$COUNTER -lt $$MAX_WAIT ]; do \
		if $(DOCKER_COMPOSE) -f docker-compose.legacy.yml -f docker-compose.tunnel.legacy.yml exec -T $(BACKEND_SERVICE) sh -c 'test -f $(SHARED_TUNNEL_FILE)' >/dev/null 2>&1; then \
			echo "$(GREEN)$(ICON_SUCCESS) Tunnel ready after $$COUNTER seconds$(NC)"; \
			break; \
		fi; \
		if [ $$((COUNTER % 10)) -eq 0 ] && [ $$COUNTER -gt 0 ]; then \
			echo "   Still waiting... ($$COUNTER/$$MAX_WAIT seconds)"; \
		fi; \
		sleep 1; \
		COUNTER=$$((COUNTER + 1)); \
	done; \
	if [ $$COUNTER -ge $$MAX_WAIT ]; then \
		echo "$(RED)$(ICON_ERROR) Timeout waiting for tunnel$(NC)"; \
		exit 1; \
	fi
	@echo ""
	@echo "$(BLUE)$(ICON_INFO) Step 3/3: Building APK with tunnel URL...$(NC)"
	@TUNNEL_URL=$$($(DOCKER_COMPOSE) -f docker-compose.legacy.yml -f docker-compose.tunnel.legacy.yml exec -T $(BACKEND_SERVICE) cat $(SHARED_TUNNEL_FILE) 2>/dev/null | tr -d '\r\n' || echo ""); \
	if [ -z "$$TUNNEL_URL" ]; then \
		echo "$(RED)$(ICON_ERROR) Could not detect tunnel URL$(NC)"; \
		exit 1; \
	fi; \
	echo "$(GREEN)$(ICON_SUCCESS) Tunnel URL: $$TUNNEL_URL$(NC)"; \
	echo ""; \
	./scripts/build-apk-docker.sh "$$TUNNEL_URL"

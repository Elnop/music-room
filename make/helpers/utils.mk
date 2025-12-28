# ==============================================================================
# Utility Commands
# ==============================================================================
# Helper commands: help, info, health checks, shell access, permissions

.PHONY: help info health shell-backend shell-mobile fix-permissions fix-node-modules

help: ## Show this help message
	@clear 2>/dev/null || true
	@echo ""
	$(call print_separator)
	@echo "$(BLUE)              Music Room - Development Commands               $(NC)"
	$(call print_separator)
	@echo ""
	@echo "$(BLUE)🚀 DEVELOPMENT MODES$(NC)"
	@echo "────────────────────────────────────────────────────────────────"
	@echo "  $(GREEN)dev$(NC)                 Show development mode menu $(YELLOW)[start here!]$(NC)"
	@echo ""
	@echo "$(BLUE)🐳 DOCKER MODE$(NC) $(YELLOW)(containerized development)$(NC)"
	@echo "────────────────────────────────────────────────────────────────"
	@echo "  $(GREEN)dev-docker$(NC)          Start all services in Docker (backend + mobile)"
	@echo "                      $(YELLOW)[requires: install]$(NC)"
	@echo "  $(GREEN)stop$(NC)                Stop all containers"
	@echo "  $(GREEN)restart$(NC)             Restart all services"
	@echo "  $(GREEN)start$(NC)               Start existing containers (no rebuild)"
	@echo "  $(GREEN)down$(NC)                Stop and remove containers + networks"
	@echo "  $(GREEN)logs$(NC)                View all logs → see: logs-backend, logs-mobile"
	@echo "  $(GREEN)qr$(NC)                  Show Expo QR code $(YELLOW)[same WiFi required]$(NC)"
	@echo "  $(GREEN)ps$(NC)                  Show container status"
	@echo "  $(GREEN)build$(NC)               Build all Docker images"
	@echo "  $(GREEN)shell-backend$(NC)       Open shell in backend container"
	@echo "  $(GREEN)shell-mobile$(NC)        Open shell in mobile container"
	@echo ""
	@echo "$(BLUE)🌐 TUNNEL MODE$(NC) $(YELLOW)(cross-network development)$(NC)"
	@echo "────────────────────────────────────────────────────────────────"
	@echo "  $(GREEN)dev-tunnel$(NC)          Start with tunnel $(YELLOW)[~50-200ms latency]$(NC)"
	@echo "                      $(YELLOW)[requires: tunnel-setup]$(NC)"
	@echo "  $(GREEN)tunnel-setup$(NC)        One-time automatic EAS setup $(YELLOW)[requires: install]$(NC)"
	@echo "  $(GREEN)qr-tunnel$(NC)           Show tunnel QR + URLs $(YELLOW)[works on different WiFi]$(NC)"
	@echo "  $(GREEN)tunnel-info$(NC)         Display detailed tunnel information"
	@echo "  $(YELLOW)💡 Use when phone/PC on different WiFi networks$(NC)"
	@echo ""
	@echo "$(BLUE)💻 LOCAL MODE$(NC) $(YELLOW)(development without Docker)$(NC)"
	@echo "────────────────────────────────────────────────────────────────"
	@echo "  $(GREEN)dev-local$(NC)           Start backend + mobile locally"
	@echo "                      $(YELLOW)[requires: install]$(NC) → for Android Studio emulator"
	@echo "  $(GREEN)backend-local$(NC)       Start backend only (local)"
	@echo "  $(GREEN)mobile-local$(NC)        Start Expo only (local)"
	@echo "  $(GREEN)dev-android$(NC)         Start Expo for Android emulator"
	@echo "  $(GREEN)expo-android$(NC)        Quick launch in Android emulator"
	@echo "  $(GREEN)expo-clear$(NC)          Start Expo with cleared cache"
	@echo "  $(GREEN)check-devices$(NC)       Check connected Android devices"
	@echo ""
	@echo "$(BLUE)📱 NATIVE BUILDS$(NC) $(YELLOW)(custom development builds with native code)$(NC)"
	@echo "────────────────────────────────────────────────────────────────"
	@echo "  $(GREEN)dev-build-setup$(NC)     One-time EAS setup $(YELLOW)[requires: install]$(NC)"
	@echo "  $(GREEN)dev-build$(NC)           Build custom Android APK $(YELLOW)[cloud, ~15-20min]$(NC)"
	@echo "  $(GREEN)dev-build-local$(NC)     Build locally $(YELLOW)[requires: Android SDK]$(NC)"
	@echo "  $(GREEN)clean-native$(NC)        Clean android/ios/expo folders"
	@echo "  $(YELLOW)💡 Required for Google Sign-In, keeps hot reload$(NC)"
	@echo ""
	@echo "$(BLUE)✅ CODE QUALITY$(NC)"
	@echo "────────────────────────────────────────────────────────────────"
	@echo "  $(GREEN)test$(NC)                Run all tests → see: test-backend"
	@echo "  $(GREEN)lint$(NC)                Run linters on all code"
	@echo "  $(GREEN)lint-fix$(NC)            Auto-fix linting issues"
	@echo "  $(GREEN)format$(NC)              Format all code with Prettier"
	@echo ""
	@echo "$(BLUE)🏗️  BUILD & PRODUCTION$(NC)"
	@echo "────────────────────────────────────────────────────────────────"
	@echo "  $(YELLOW)Backend TypeScript:$(NC)"
	@echo "    $(GREEN)compile-backend$(NC)    Compile TypeScript → JavaScript $(YELLOW)[validation]$(NC)"
	@echo "    $(GREEN)compile-backend-docker$(NC) Build production Docker image"
	@echo "    $(GREEN)verify-backend$(NC)     Check build artifacts exist"
	@echo "    $(GREEN)build-clean$(NC)        Remove build artifacts only"
	@echo ""
	@echo "  $(YELLOW)Mobile Production (AAB - Google Play):$(NC)"
	@echo "    $(GREEN)prod-build$(NC)         Build AAB via EAS cloud $(YELLOW)[~15-25min]$(NC)"
	@echo "    $(GREEN)prod-build-local$(NC)   Build AAB locally $(YELLOW)[requires: Android SDK]$(NC)"
	@echo "    $(GREEN)prod-build-manual$(NC)  Build AAB with Gradle $(YELLOW)[no EAS]$(NC)"
	@echo ""
	@echo "  $(YELLOW)Mobile Production (APK - Direct Install):$(NC)"
	@echo "    $(GREEN)prod-build-apk$(NC)     Build APK via EAS cloud $(YELLOW)[~15-25min]$(NC)"
	@echo "    $(GREEN)prod-build-apk-local$(NC) Build APK locally $(YELLOW)[requires: Android SDK]$(NC)"
	@echo "    $(GREEN)prod-build-apk-manual$(NC) Build APK with Gradle $(YELLOW)[no EAS, ~5-10min]$(NC)"
	@echo ""
	@echo "  $(YELLOW)Version Management:$(NC)"
	@echo "    $(GREEN)prod-version-bump$(NC)  Bump version interactively $(YELLOW)[manual]$(NC)"
	@echo "    $(GREEN)prod-version-auto$(NC)  Auto-increment versionCode"
	@echo "    $(GREEN)prod-info$(NC)          Display production build info"
	@echo ""
	@echo "  $(YELLOW)Deployment & Setup:$(NC)"
	@echo "    $(GREEN)prod-submit$(NC)        Submit AAB to Google Play Store"
	@echo "    $(GREEN)prod-keystore-setup$(NC) Generate production keystore $(YELLOW)[manual builds]$(NC)"
	@echo "  $(YELLOW)💡 See BUILD.md for complete build documentation$(NC)"
	@echo ""
	@echo "$(BLUE)🗄️  SUPABASE$(NC)"
	@echo "────────────────────────────────────────────────────────────────"
	@echo "  $(GREEN)supabase-login$(NC)      Login to Supabase CLI $(YELLOW)[one-time setup]$(NC)"
	@echo "  $(GREEN)generate-types$(NC)      Generate TypeScript types from schema"
	@echo "  $(GREEN)supabase-status$(NC)     Check CLI installation and auth status"
	@echo ""
	@echo "$(BLUE)🔴 REDIS$(NC) $(YELLOW)(rate limiting & brute force protection)$(NC)"
	@echo "────────────────────────────────────────────────────────────────"
	@echo "  $(GREEN)redis-start$(NC)         Start Redis container independently"
	@echo "  $(GREEN)redis-stop$(NC)          Stop Redis container"
	@echo "  $(GREEN)redis-restart$(NC)       Restart Redis container"
	@echo "  $(GREEN)redis-logs$(NC)          View Redis logs (live)"
	@echo "  $(GREEN)redis-health$(NC)        Check Redis health status"
	@echo "  $(GREEN)redis-shell$(NC)         Open Redis CLI shell $(YELLOW)[debug/inspect data]$(NC)"
	@echo "  $(GREEN)redis-clean$(NC)         Remove Redis container and volume"
	@echo "  $(GREEN)redis-help$(NC)          Show all Redis commands"
	@echo "  $(YELLOW)💡 Start with make redis-start, then make backend-local$(NC)"
	@echo ""
	@echo "$(BLUE)🧹 CLEANUP$(NC)"
	@echo "────────────────────────────────────────────────────────────────"
	@echo "  $(YELLOW)Project-level cleanup:$(NC)"
	@echo "    $(GREEN)clean$(NC)             Docker + project artifacts $(YELLOW)[confirmation]$(NC)"
	@echo "    $(GREEN)clean-deps$(NC)        All dependencies + build artifacts"
	@echo "    $(GREEN)clean-cache$(NC)       Project caches (.expo, coverage, logs)"
	@echo "    $(GREEN)clean-native$(NC)      Native builds (android/, ios/)"
	@echo "    $(GREEN)clean-project$(NC)     All project artifacts (no Docker/global)"
	@echo ""
	@echo "  $(YELLOW)Docker-specific:$(NC)"
	@echo "    $(GREEN)clean-docker$(NC)      Music Room Docker resources only"
	@echo "    $(GREEN)prune$(NC)             Unused Docker resources"
	@echo ""
	@echo "  $(YELLOW)Global cleanup $(RED)(affects ALL projects!)$(NC):"
	@echo "    $(GREEN)clean-global-cache$(NC) Expo, Metro, Watchman $(YELLOW)[type 'yes']$(NC)"
	@echo "    $(GREEN)clean-gradle$(NC)       Gradle/Android caches $(YELLOW)[type 'yes']$(NC)"
	@echo ""
	@echo "  $(RED)⚠️  Nuclear option:$(NC)"
	@echo "    $(GREEN)clean-all$(NC)         Everything (Docker + project + global) $(YELLOW)[type 'yes']$(NC)"
	@echo ""
	@echo "$(BLUE)🔧 SETUP & UTILITIES$(NC)"
	@echo "────────────────────────────────────────────────────────────────"
	@echo "  $(GREEN)install$(NC)             Install all dependencies $(YELLOW)[run this first!]$(NC)"
	@echo "  $(GREEN)info$(NC)                Show system information"
	@echo "  $(GREEN)health$(NC)              Check services health status"
	@echo "  $(GREEN)fix-permissions$(NC)     Fix file permissions for Docker"
	@echo "  $(GREEN)fix-node-modules$(NC)    Fix node_modules ownership $(YELLOW)[for local builds]$(NC)"
	@echo ""
	$(call print_separator)
	@echo "$(YELLOW)Quick Start:$(NC)"
	@echo "  1. $(GREEN)make install$(NC)     # First-time setup"
	@echo "  2. $(GREEN)make dev$(NC)         # Show development mode menu"
	@echo "  3. $(GREEN)make dev-docker$(NC)  # OR start Docker development"
	@echo "  4. $(GREEN)make qr$(NC)          # Show QR code to scan with Expo Go"
	@echo ""
	@echo "$(YELLOW)Common Workflows:$(NC)"
	@echo "  • Different WiFi?     → $(GREEN)make tunnel-setup$(NC) then $(GREEN)make dev-tunnel$(NC)"
	@echo "  • Android Studio?     → $(GREEN)make dev-local$(NC)"
	@echo "  • Google Sign-In?     → $(GREEN)make dev-build-setup$(NC) then $(GREEN)make dev-build$(NC)"
	$(call print_separator)
	@echo ""

info: ## Show system information
	$(call print_header,Music Room - System Information)
	$(call print_subsection,Network Information)
	@echo "  Local IP:  $(GREEN)$(HOST_IP)$(NC)"
	@echo "  Expo URL:  $(GREEN)$(EXPO_URL)$(NC)"
	@echo ""
	$(call print_subsection,Docker Version)
	@docker --version
	@echo ""
	$(call print_subsection,Docker Compose Version)
	@$(DOCKER_COMPOSE) --version
	@echo ""
	$(call print_subsection,Node.js Versions)
	@echo "  Backend:  $$(cd $(BACKEND_DIR) && node --version 2>/dev/null || echo 'Not installed')"
	@echo "  Mobile:   $$(cd $(MOBILE_DIR) && node --version 2>/dev/null || echo 'Not installed')"
	@echo ""
	$(call print_subsection,Container Status)
	$(call docker_ps)

health: ## Check health status of all services
	$(call print_header,Health Check)
	$(call print_arrow,Checking backend health...)
	@curl -s $(BACKEND_URL)/health > /dev/null && echo "$(GREEN)$(ICON_SUCCESS) Backend: Healthy$(NC)" || echo "$(RED)$(ICON_ERROR) Backend: Unhealthy$(NC)"
	$(call blank_line)
	$(call print_arrow,Checking mobile (Metro bundler)...)
	@curl -s $(METRO_URL)/status > /dev/null && echo "$(GREEN)$(ICON_SUCCESS) Mobile: Healthy$(NC)" || echo "$(RED)$(ICON_ERROR) Mobile: Unhealthy$(NC)"

shell-backend: ## Open shell in backend container
	$(call print_info,Opening shell in backend container...)
	$(call docker_exec_interactive,$(BACKEND_SERVICE),sh)

shell-mobile: ## Open shell in mobile container
	$(call print_info,Opening shell in mobile container...)
	$(call docker_exec_interactive,$(MOBILE_SERVICE),sh)

fix-permissions: ## Fix file permissions for Docker non-root user compatibility
	$(call print_header,Fixing File Permissions)
	$(call print_arrow,Fixing mobile directory permissions...)
	@find $(MOBILE_DIR) \( -name node_modules -o -name .expo \) -prune -o -type d -print0 2>/dev/null | xargs -0 chmod 0755 2>/dev/null || true
	@find $(MOBILE_DIR) \( -name node_modules -o -name .expo \) -prune -o -type f -print0 2>/dev/null | xargs -0 chmod 0644 2>/dev/null || true
	@chmod +x $(MOBILE_DIR)/*.sh 2>/dev/null || true
	$(call print_success,Mobile permissions fixed)
	@echo ""
	$(call print_arrow,Fixing backend directory permissions...)
	@find $(BACKEND_DIR) \( -name node_modules -o -name dist \) -prune -o -type d -print0 2>/dev/null | xargs -0 chmod 0755 2>/dev/null || true
	@find $(BACKEND_DIR) \( -name node_modules -o -name dist \) -prune -o -type f -print0 2>/dev/null | xargs -0 chmod 0644 2>/dev/null || true
	@chmod +x $(BACKEND_DIR)/*.sh 2>/dev/null || true
	$(call print_success,Backend permissions fixed)
	$(call blank_line)
	$(call print_header,Permissions Fixed)
	$(call display_permissions_info)
	$(call blank_line)
	$(call print_warning,Run 'make restart' to apply in Docker)
	$(call blank_line)

fix-node-modules: ## Fix node_modules ownership (for local builds outside Docker)
	$(call print_header,Fixing node_modules Ownership)
	$(call print_subsection,📋 Checking ownership...)
	@echo ""
	@HAS_ROOT_DIRS=0; \
	if [ -d "$(BACKEND_DIR)/node_modules" ] && [ ! -w "$(BACKEND_DIR)/node_modules" ]; then \
		echo "$(RED)  ✗ Backend node_modules owned by root$(NC)"; \
		HAS_ROOT_DIRS=1; \
	fi; \
	if [ -d "$(MOBILE_DIR)/node_modules" ] && [ ! -w "$(MOBILE_DIR)/node_modules" ]; then \
		echo "$(RED)  ✗ Mobile node_modules owned by root$(NC)"; \
		HAS_ROOT_DIRS=1; \
	fi; \
	if [ -d "$(MOBILE_DIR)/.expo" ] && [ ! -w "$(MOBILE_DIR)/.expo" ]; then \
		echo "$(RED)  ✗ .expo cache owned by root$(NC)"; \
		HAS_ROOT_DIRS=1; \
	fi; \
	if [ $$HAS_ROOT_DIRS -eq 1 ]; then \
		echo ""; \
		echo "$(YELLOW)⚠️  Root-owned directories detected$(NC)"; \
		echo ""; \
		echo "$(BLUE)Please run these commands in your terminal:$(NC)"; \
		echo ""; \
		echo "  $(GREEN)sudo rm -rf mobile/node_modules mobile/.expo backend/node_modules$(NC)"; \
		echo "  $(GREEN)cd mobile && npm install$(NC)"; \
		echo "  $(GREEN)cd ../backend && npm install$(NC)"; \
		echo ""; \
		exit 1; \
	else \
		echo "$(GREEN)  ✓ All directories have correct ownership$(NC)"; \
	fi
	$(call blank_line)

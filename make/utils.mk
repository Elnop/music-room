# ==============================================================================
# Utility Commands
# ==============================================================================
# Helper commands: help, info, health checks, shell access, permissions

.PHONY: help info health shell-backend shell-mobile fix-permissions

help: ## Show this help message
	@clear
	@echo ""
	$(call print_separator)
	@echo "$(BLUE)              Music Room - Development Commands               $(NC)"
	$(call print_separator)
	@echo ""
	@echo "$(BLUE)🐳 DOCKER MODE$(NC) $(YELLOW)(containerized development - main mode)$(NC)"
	@echo "────────────────────────────────────────────────────────────────"
	@echo "  $(GREEN)dev$(NC)                 Start all services (backend + mobile)"
	@echo "                      $(YELLOW)[requires: install]$(NC) → see: dev-tunnel, dev-local"
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
	@echo "$(BLUE)🧹 CLEANUP$(NC)"
	@echo "────────────────────────────────────────────────────────────────"
	@echo "  $(GREEN)clean$(NC)               Remove containers + deps $(YELLOW)[with confirmation]$(NC)"
	@echo "  $(GREEN)clean-docker$(NC)        Remove Docker resources only"
	@echo "  $(GREEN)clean-deps$(NC)          Remove node_modules + build artifacts"
	@echo "  $(GREEN)clean-native$(NC)        Clean native build folders"
	@echo "  $(GREEN)prune$(NC)               Clean unused Docker resources"
	@echo "  $(GREEN)clean-all$(NC)           $(RED)⚠️  Remove ALL Docker resources on machine$(NC)"
	@echo ""
	@echo "$(BLUE)🔧 SETUP & UTILITIES$(NC)"
	@echo "────────────────────────────────────────────────────────────────"
	@echo "  $(GREEN)install$(NC)             Install all dependencies $(YELLOW)[run this first!]$(NC)"
	@echo "  $(GREEN)info$(NC)                Show system information"
	@echo "  $(GREEN)health$(NC)              Check services health status"
	@echo "  $(GREEN)fix-permissions$(NC)     Fix file permissions for Docker"
	@echo ""
	$(call print_separator)
	@echo "$(YELLOW)Quick Start:$(NC)"
	@echo "  1. $(GREEN)make install$(NC)     # First-time setup"
	@echo "  2. $(GREEN)make dev$(NC)         # Start development (Docker)"
	@echo "  3. $(GREEN)make qr$(NC)          # Show QR code to scan with Expo Go"
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
	@find $(MOBILE_DIR) -type d \( -name node_modules -o -name .expo \) -prune -o -type d -exec chmod 0755 {} \; 2>/dev/null
	@find $(MOBILE_DIR) -type d \( -name node_modules -o -name .expo \) -prune -o -type f -exec chmod 0644 {} \; 2>/dev/null
	@chmod +x $(MOBILE_DIR)/*.sh 2>/dev/null || true
	$(call print_success,Mobile permissions fixed)
	@echo ""
	$(call print_arrow,Fixing backend directory permissions...)
	@find $(BACKEND_DIR) -type d \( -name node_modules -o -name dist \) -prune -o -type d -exec chmod 0755 {} \; 2>/dev/null
	@find $(BACKEND_DIR) -type d \( -name node_modules -o -name dist \) -prune -o -type f -exec chmod 0644 {} \; 2>/dev/null
	@chmod +x $(BACKEND_DIR)/*.sh 2>/dev/null || true
	$(call print_success,Backend permissions fixed)
	$(call blank_line)
	$(call print_header,Permissions Fixed)
	$(call display_permissions_info)
	$(call blank_line)
	$(call print_warning,Run 'make restart' to apply in Docker)
	$(call blank_line)

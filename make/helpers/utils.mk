# ==============================================================================
# Utility Commands
# ==============================================================================
# Helper commands: info, health checks, shell access, permissions

.PHONY: info health shell-backend shell-mobile fix-permissions fix-node-modules

info: ## Show system information
	$(call print_header,Zumik - System Information)
	$(call print_subsection,Network Information)
	@echo "  Local IP:  $(GREEN)$(HOST_IP)$(NC)"
	@echo "  Expo URL:  $(GREEN)$(EXPO_URL)$(NC)"
	@echo ""
	$(call print_subsection,Docker Version)
	@docker --version
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
	$(call print_warning,Run 'make containers-restart' to apply in Docker)
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

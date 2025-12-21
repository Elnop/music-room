# ==============================================================================
# Dependency Management
# ==============================================================================
# Automatic dependency installation and management
# Use these as prerequisites in targets that need dependencies

.PHONY: ensure-backend-deps ensure-mobile-deps ensure-all-deps

# Internal target: check and install backend dependencies
.ensure-backend-deps:
	@if [ ! -d "$(BACKEND_NODE_MODULES)" ]; then \
		echo "$(YELLOW)$(ICON_WARNING) Backend dependencies not installed$(NC)"; \
		echo "$(YELLOW)$(ICON_ARROW) Installing backend dependencies...$(NC)"; \
		cd $(BACKEND_DIR) && npm install; \
		echo "$(GREEN)$(ICON_SUCCESS) Backend dependencies installed$(NC)"; \
	fi

# Internal target: check and install mobile dependencies
.ensure-mobile-deps:
	@if [ ! -d "$(MOBILE_NODE_MODULES)" ]; then \
		echo "$(YELLOW)$(ICON_WARNING) Mobile dependencies not installed$(NC)"; \
		echo "$(YELLOW)$(ICON_ARROW) Installing mobile dependencies...$(NC)"; \
		cd $(MOBILE_DIR) && npm install; \
		echo "$(GREEN)$(ICON_SUCCESS) Mobile dependencies installed$(NC)"; \
	fi

# Public target: ensure backend dependencies
ensure-backend-deps: .ensure-backend-deps
	@$(call print_success,Backend dependencies OK)

# Public target: ensure mobile dependencies
ensure-mobile-deps: .ensure-mobile-deps
	@$(call print_success,Mobile dependencies OK)

# Public target: ensure all dependencies
ensure-all-deps: .ensure-backend-deps .ensure-mobile-deps
	@$(call print_success,All dependencies OK)

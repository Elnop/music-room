# ==============================================================================
# Validation Functions
# ==============================================================================
# Reusable functions for checking prerequisites and system state

# Check if a command exists
# Usage: $(call check_command,command_name,error_message)
# Example: $(call check_command,docker,Docker not installed)
define check_command
	@if ! command -v $(1) >/dev/null 2>&1; then \
		echo "$(RED)$(ICON_ERROR) $(2)$(NC)"; \
		exit 1; \
	fi
endef

# Check if EAS is configured
# Usage: $(call check_eas_configured)
define check_eas_configured
	$(call print_arrow,Checking EAS configuration...)
	@if ! $(DOCKER_COMPOSE) run --rm $(MOBILE_SERVICE) npx eas whoami >/dev/null 2>&1; then \
		echo ""; \
		echo "$(RED)$(ICON_ERROR) EAS not configured!$(NC)"; \
		echo ""; \
		echo "$(YELLOW)$(ICON_WARNING) Run this first: make tunnel-setup$(NC)"; \
		echo ""; \
		exit 1; \
	fi
	$(call print_success,EAS configured)
endef

# Check if backend is healthy
# Usage: $(call check_backend_health)
define check_backend_health
	$(call print_arrow,Checking backend...)
	@curl -s $(BACKEND_URL)/health > /dev/null && \
		echo "$(GREEN)$(ICON_SUCCESS) Backend: Running$(NC)" || \
		(echo "$(RED)$(ICON_ERROR) Backend not running!$(NC)" && \
		echo "$(YELLOW)$(ICON_WARNING) Run 'make backend-local' first$(NC)" && \
		exit 1)
endef

# Check if .env file exists
# Usage: $(call check_env_file,path/to/.env)
define check_env_file
	@if [ ! -f $(1) ]; then \
		echo "$(RED)$(ICON_ERROR) $(1) not found$(NC)"; \
		exit 1; \
	fi
endef

# Check if Docker is running
# Usage: $(call check_docker_running)
define check_docker_running
	@if ! docker info >/dev/null 2>&1; then \
		echo "$(RED)$(ICON_ERROR) Docker is not running$(NC)"; \
		echo "$(YELLOW)$(ICON_WARNING) Please start Docker and try again$(NC)"; \
		exit 1; \
	fi
endef

# Check if EXPO_TOKEN is configured
# Usage: $(call check_expo_token)
define check_expo_token
	@if [ -f $(MOBILE_ENV) ] && grep -q "EXPO_TOKEN" $(MOBILE_ENV); then \
		echo "$(GREEN)$(ICON_SUCCESS) EXPO_TOKEN found in mobile/.env$(NC)"; \
	else \
		echo "$(RED)$(ICON_ERROR) EXPO_TOKEN not found in mobile/.env$(NC)"; \
		echo ""; \
		echo "$(YELLOW)$(ICON_WARNING) Please add to mobile/.env:$(NC)"; \
		echo "  EXPO_TOKEN=your-token-here"; \
		echo ""; \
		echo "$(BLUE)$(ICON_INFO) Get your token:$(NC)"; \
		echo "  https://expo.dev/accounts/[username]/settings/access-tokens"; \
		echo ""; \
		exit 1; \
	fi
endef

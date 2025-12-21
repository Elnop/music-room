# ==============================================================================
# Installation & Setup
# ==============================================================================
# Commands for initial project setup and dependency installation

.PHONY: install

install: ## Install all dependencies (backend + mobile)
	$(call print_header,Installing Dependencies)
	$(call print_arrow,Setting up backend environment...)
	@if [ ! -f $(BACKEND_ENV) ]; then \
		cp $(BACKEND_ENV_EXAMPLE) $(BACKEND_ENV); \
		echo "$(GREEN)$(ICON_SUCCESS) Created backend/.env$(NC)"; \
		echo "$(YELLOW)$(ICON_WARNING) Edit backend/.env and add Supabase credentials$(NC)"; \
	else \
		echo "$(YELLOW)$(ICON_WARNING) backend/.env exists$(NC)"; \
	fi
	@echo ""
	$(call print_arrow,Setting up mobile environment...)
	@if [ ! -f $(MOBILE_ENV) ]; then \
		cp $(MOBILE_ENV_EXAMPLE) $(MOBILE_ENV); \
		echo "$(GREEN)$(ICON_SUCCESS) Created mobile/.env$(NC)"; \
	else \
		echo "$(YELLOW)$(ICON_WARNING) mobile/.env exists$(NC)"; \
	fi
	$(call blank_line)
	$(call print_arrow,Installing backend dependencies...)
	$(call npm_backend,install)
	$(call print_success,Backend dependencies installed)
	$(call blank_line)
	$(call print_arrow,Installing mobile dependencies...)
	$(call npm_mobile,install)
	$(call print_success,Mobile dependencies installed)
	$(call blank_line)
	$(call print_header,Installation Complete)
	$(call display_next_steps,Edit backend/.env with Supabase credentials,Run: $(GREEN)make dev$(NC))
	$(call blank_line)

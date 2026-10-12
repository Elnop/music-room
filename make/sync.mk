# ==============================================================================
# Mobile Configuration Commands
# ==============================================================================
# Automatically configure mobile environment

.PHONY: set-backend-url

set-backend-url: ## Point the app at this machine's backend: writes mobile/.env.development.local (auto-detect HOST_IP)
	$(call print_header,Configuring Mobile Backend IP)
	@$(call write_mobile_dev_env)
	@echo "$(GREEN)$(ICON_SUCCESS) Detected IP: $(HOST_IP)$(NC)"
	@echo "  $(BLUE)$(ICON_BULLET)$(NC) API: $(DEV_API_URL)"
	@echo "  $(BLUE)$(ICON_BULLET)$(NC) WebSocket: $(DEV_WS_URL)"
	@echo "$(GREEN)$(ICON_SUCCESS) Wrote $(MOBILE_DEV_ENV) (wins over mobile/.env, which is left as is)$(NC)"
	@echo ""
	@echo "$(BLUE)$(ICON_INFO) Next steps:$(NC)"
	@echo "  1. $(GREEN)make containers-restart$(NC) - Restart the containers"
	@echo "  2. Reload mobile app"
	@echo ""

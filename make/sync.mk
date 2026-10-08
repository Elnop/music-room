# ==============================================================================
# Mobile Configuration Commands
# ==============================================================================
# Automatically configure mobile environment

.PHONY: set-backend-url

set-backend-url: ## Configure mobile .env with backend URL (auto-detect HOST_IP)
	$(call print_header,Configuring Mobile Backend IP)
	@if [ ! -f "$(MOBILE_ENV)" ]; then \
		echo "$(RED)$(ICON_ERROR) Mobile .env not found: $(MOBILE_ENV)$(NC)"; \
		exit 1; \
	fi; \
	API_URL="http://$(HOST_IP):3000"; \
	WS_URL="ws://$(HOST_IP):3000"; \
	echo "$(GREEN)$(ICON_SUCCESS) Detected IP: $(HOST_IP)$(NC)"; \
	echo "  $(BLUE)$(ICON_BULLET)$(NC) API: $$API_URL"; \
	echo "  $(BLUE)$(ICON_BULLET)$(NC) WebSocket: $$WS_URL"; \
	echo ""; \
	echo "$(YELLOW)$(ICON_ARROW) Updating mobile/.env...$(NC)"; \
	if grep -q '^EXPO_PUBLIC_API_URL=' $(MOBILE_ENV); then \
		if [ "$(OS_TYPE)" = "macos" ]; then \
			sed -i '' "s|^EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=$$API_URL|" $(MOBILE_ENV); \
		else \
			sed -i "s|^EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=$$API_URL|" $(MOBILE_ENV); \
		fi; \
		echo "$(GREEN)$(ICON_SUCCESS) Updated EXPO_PUBLIC_API_URL$(NC)"; \
	else \
		echo "" >> $(MOBILE_ENV); \
		echo "# LAN MODE (auto-configured by make set-backend-url)" >> $(MOBILE_ENV); \
		echo "EXPO_PUBLIC_API_URL=$$API_URL" >> $(MOBILE_ENV); \
		echo "$(GREEN)$(ICON_SUCCESS) Added EXPO_PUBLIC_API_URL$(NC)"; \
	fi; \
	if grep -q '^EXPO_PUBLIC_WS_URL=' $(MOBILE_ENV); then \
		if [ "$(OS_TYPE)" = "macos" ]; then \
			sed -i '' "s|^EXPO_PUBLIC_WS_URL=.*|EXPO_PUBLIC_WS_URL=$$WS_URL|" $(MOBILE_ENV); \
		else \
			sed -i "s|^EXPO_PUBLIC_WS_URL=.*|EXPO_PUBLIC_WS_URL=$$WS_URL|" $(MOBILE_ENV); \
		fi; \
		echo "$(GREEN)$(ICON_SUCCESS) Updated EXPO_PUBLIC_WS_URL$(NC)"; \
	else \
		echo "EXPO_PUBLIC_WS_URL=$$WS_URL" >> $(MOBILE_ENV); \
		echo "$(GREEN)$(ICON_SUCCESS) Added EXPO_PUBLIC_WS_URL$(NC)"; \
	fi; \
	echo ""; \
	echo "$(BLUE)$(ICON_INFO) Next steps:$(NC)"; \
	echo "  1. $(GREEN)make containers-restart$(NC) - Restart the containers"; \
	echo "  2. Reload mobile app"; \
	echo ""

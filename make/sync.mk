# ==============================================================================
# CORS Synchronization Commands
# ==============================================================================
# Automatically sync mobile URLs to backend ALLOWED_ORIGINS

.PHONY: sync-cors config-mobile-ip

sync-cors: ## Sync mobile URL to backend ALLOWED_ORIGINS (auto-detect from mobile/.env or use HOST_IP)
	$(call print_header,Syncing CORS Origins)
	@if [ ! -f "$(BACKEND_ENV)" ]; then \
		echo "$(RED)$(ICON_ERROR) Backend .env not found: $(BACKEND_ENV)$(NC)"; \
		exit 1; \
	fi; \
	MOBILE_URL=$$(grep '^EXPO_PUBLIC_API_URL=' $(MOBILE_ENV) 2>/dev/null | cut -d'=' -f2 | sed 's/http:\/\///' | sed 's/:3000//'); \
	if [ -z "$$MOBILE_URL" ]; then \
		echo "$(YELLOW)$(ICON_WARNING) No EXPO_PUBLIC_API_URL found in mobile/.env$(NC)"; \
		echo "$(BLUE)$(ICON_INFO) Using HOST_IP: $(HOST_IP)$(NC)"; \
		MOBILE_URL="$(HOST_IP)"; \
	fi; \
	HTTP_URL="http://$$MOBILE_URL:8081"; \
	EXP_URL="exp://$$MOBILE_URL:8081"; \
	echo "$(GREEN)$(ICON_SUCCESS) Detected URLs:$(NC)"; \
	echo "  $(BLUE)$(ICON_BULLET)$(NC) $$HTTP_URL"; \
	echo "  $(BLUE)$(ICON_BULLET)$(NC) $$EXP_URL"; \
	echo ""; \
	echo "$(YELLOW)$(ICON_ARROW) Reading current ALLOWED_ORIGINS...$(NC)"; \
	CURRENT_ORIGINS=$$(grep '^ALLOWED_ORIGINS=' $(BACKEND_ENV) | cut -d'=' -f2-); \
	echo "$(BLUE)Current:$(NC) $$CURRENT_ORIGINS"; \
	echo ""; \
	echo "$(YELLOW)$(ICON_ARROW) Building new ALLOWED_ORIGINS...$(NC)"; \
	NEW_ORIGINS="http://localhost:8081,exp://localhost:8081"; \
	if [ -n "$$CURRENT_ORIGINS" ]; then \
		for origin in $$(echo "$$CURRENT_ORIGINS" | tr ',' '\n'); do \
			if ! echo "$$NEW_ORIGINS" | grep -q "$$origin"; then \
				NEW_ORIGINS="$$NEW_ORIGINS,$$origin"; \
			fi; \
		done; \
	fi; \
	if ! echo "$$NEW_ORIGINS" | grep -q "$$HTTP_URL"; then \
		NEW_ORIGINS="$$NEW_ORIGINS,$$HTTP_URL"; \
	fi; \
	if ! echo "$$NEW_ORIGINS" | grep -q "$$EXP_URL"; then \
		NEW_ORIGINS="$$NEW_ORIGINS,$$EXP_URL"; \
	fi; \
	echo "$(GREEN)New:$(NC) $$NEW_ORIGINS"; \
	echo ""; \
	echo "$(YELLOW)$(ICON_ARROW) Updating backend .env...$(NC)"; \
	if grep -q '^ALLOWED_ORIGINS=' $(BACKEND_ENV); then \
		if [ "$(OS_TYPE)" = "macos" ]; then \
			sed -i '' "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=$$NEW_ORIGINS|" $(BACKEND_ENV); \
		else \
			sed -i "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=$$NEW_ORIGINS|" $(BACKEND_ENV); \
		fi; \
	else \
		echo "" >> $(BACKEND_ENV); \
		echo "# CORS" >> $(BACKEND_ENV); \
		echo "ALLOWED_ORIGINS=$$NEW_ORIGINS" >> $(BACKEND_ENV); \
	fi; \
	echo "$(GREEN)$(ICON_SUCCESS) ALLOWED_ORIGINS updated in backend/.env$(NC)"; \
	echo ""; \
	echo "$(BLUE)$(ICON_INFO) Restart backend to apply changes: $(GREEN)make restart$(NC)"; \
	echo ""

config-mobile-ip: ## Configure mobile .env with backend IP (auto-detect HOST_IP)
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
		echo "# LAN MODE (auto-configured by make config-mobile-ip)" >> $(MOBILE_ENV); \
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
	echo "  1. $(GREEN)make sync-cors$(NC) - Sync this IP to backend ALLOWED_ORIGINS"; \
	echo "  2. $(GREEN)make restart$(NC) - Restart backend"; \
	echo "  3. Reload mobile app"; \
	echo ""

# ==============================================================================
# Tunnel Mode Commands (Cross-Network Development)
# ==============================================================================
# Commands for tunnel mode when phone and PC are on different WiFi networks

.PHONY: dev-tunnel qr-tunnel tunnel-info tunnel-setup

dev-tunnel: ## Start all services in tunnel mode (different WiFi networks)
	$(call print_header,Starting Zumik (TUNNEL MODE))
	$(call check_eas_configured)
	$(call blank_line)
	$(call print_warning,Note: Tunnel mode is slower than LAN mode)
	@echo "$(YELLOW)   Use only when phone and PC are on different networks$(NC)"
	$(call blank_line)
	$(call print_arrow,Building and starting with tunnel support...)
	$(call docker_up_tunnel)
	$(call blank_line)
	$(call print_success,Services started in tunnel mode)
	$(call blank_line)
	$(call wait_for,tunnels to initialize,$(TUNNEL_WAIT_TIME))
	$(call clear_and_header,🌐 Zumik - TUNNEL MODE ACTIVE)
	$(call display_tunnel_urls)
	$(call blank_line)
	$(call display_qr,tunnel)
	$(call blank_line)
	$(call display_common_commands,tunnel)
	$(call blank_line)
	$(call print_success,Tunnel mode active! Scan QR from any network)
	$(call blank_line)

qr-tunnel: ## Show tunnel QR code and URLs
	$(call clear_and_header,📱 Tunnel Mode - Connection Info)
	$(call print_subsection,🌐 Backend Tunnel URL)
	@docker exec -T $(BACKEND_CONTAINER) cat $(TUNNEL_URL_FILE) 2>/dev/null || echo "$(RED)$(ICON_ERROR) Backend tunnel not available$(NC)"
	$(call blank_line)
	$(call blank_line)
	$(call print_subsection,🔍 ngrok Web Interface)
	@echo "   $(NGROK_UI_URL) (view traffic, connections)"
	$(call blank_line)
	$(call display_qr,tunnel)
	$(call blank_line)
	$(call print_success,Works across different WiFi networks)
	$(call blank_line)
	@echo "$(YELLOW)💡 Commands:$(NC) $(GREEN)make tunnel-info$(NC) | $(GREEN)make logs$(NC) | $(GREEN)make stop$(NC)"
	$(call blank_line)

tunnel-info: ## Display detailed tunnel connection info
	$(call print_header,Tunnel Mode Information)
	$(call print_subsection,Backend Tunnel)
	@docker exec -T $(BACKEND_CONTAINER) cat $(TUNNEL_URL_FILE) 2>/dev/null || echo "$(RED)$(ICON_ERROR) Not running$(NC)"
	$(call blank_line)
	$(call print_subsection,ngrok Web UI)
	@echo "   $(NGROK_UI_URL)"
	$(call print_info,Inspect HTTP traffic\, connections\, tunnel status)
	$(call blank_line)
	$(call print_subsection,Container Status)
	$(call docker_ps)
	$(call blank_line)
	$(call print_subsection,Performance Note)
	@echo "   Tunnel adds ~50-200ms latency vs LAN mode"
	@echo "   Hot reload may be slower (internet round-trip)"
	$(call blank_line)
	$(call print_subsection,Quick Commands)
	$(call print_command,qr-tunnel,Show QR code)
	$(call print_command,logs,View logs)
	$(call print_command,stop,Stop tunnel)
	$(call print_command,dev,Switch to LAN)
	$(call blank_line)

tunnel-setup: ## One-time setup for tunnel mode (auto EAS login)
	$(call print_header,Tunnel Mode - Automatic Setup)
	$(call print_arrow,Starting mobile container...)
	$(call start_mobile)
	@sleep $(SETUP_WAIT_TIME)
	$(call blank_line)
	$(call print_arrow,Configuring EAS (automatic login)...)
	@docker exec $(MOBILE_CONTAINER) sh setup-eas-auto.sh
	$(call blank_line)
	$(call print_arrow,Stopping setup container...)
	@docker stop $(MOBILE_CONTAINER)
	$(call blank_line)
	$(call print_header,✓ Tunnel Setup Complete)
	$(call display_next_steps,Run: make dev-tunnel to start tunnel mode)
	$(call blank_line)

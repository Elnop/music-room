# ==============================================================================
# Display Functions
# ==============================================================================
# Reusable functions for consistent output formatting

# Print section header
# Usage: $(call print_header,Section Title)
define print_header
	@echo ""
	@echo "$(BLUE)=== $(1) ===$(NC)"
	@echo ""
endef

# Print success message
# Usage: $(call print_success,Message)
define print_success
	@echo "$(GREEN)$(ICON_SUCCESS) $(1)$(NC)"
endef

# Print error message
# Usage: $(call print_error,Message)
define print_error
	@echo "$(RED)$(ICON_ERROR) $(1)$(NC)"
endef

# Print warning message
# Usage: $(call print_warning,Message)
define print_warning
	@echo "$(YELLOW)$(ICON_WARNING) $(1)$(NC)"
endef

# Print action arrow message
# Usage: $(call print_arrow,Message)
define print_arrow
	@echo "$(YELLOW)$(ICON_ARROW) $(1)$(NC)"
endef

# Print bullet point
# Usage: $(call print_bullet,Message)
define print_bullet
	@echo "   $(GREEN)$(ICON_BULLET)$(NC) $(1)"
endef

# Print info message
# Usage: $(call print_info,Message)
define print_info
	@echo "$(BLUE)$(ICON_INFO) $(1)$(NC)"
endef

# Print separator line
# Usage: $(call print_separator)
define print_separator
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
endef

# Print service status line
# Usage: $(call print_service,Name,URL)
define print_service
	$(call print_bullet,$(1): $(2))
endef

# Print command hint
# Usage: $(call print_command,command,description)
define print_command
	@echo "   $(GREEN)make $(1)$(NC) - $(2)"
endef

# Print subsection
# Usage: $(call print_subsection,Title)
define print_subsection
	@echo "$(YELLOW)$(1):$(NC)"
endef

# ==============================================================================
# Advanced Pattern Functions
# ==============================================================================

# Clear screen and print header
# Usage: $(call clear_and_header,Title)
define clear_and_header
	@clear 2>/dev/null || true
	$(call print_header,$(1))
endef

# Print blank line
# Usage: $(call blank_line)
define blank_line
	@echo ""
endef

# Wait with message
# Usage: $(call wait_for,expo,$(EXPO_WAIT_TIME))
define wait_for
	$(call print_arrow,Waiting for $(1) to start ($(2) seconds)...)
	@sleep $(2)
endef

# Tell how to point the Zumik debug build at Metro (the app does not run in
# Expo Go: it needs its native modules). LAN: the host address; tunnel: the
# Expo tunnel host read from the mobile container logs.
# Usage: $(call display_metro_connect,lan) or $(call display_metro_connect,tunnel)
define display_metro_connect
	$(call print_separator)
	@echo "$(YELLOW)📱 CONNECT THE ZUMIK DEBUG BUILD TO METRO$(NC)"
	$(if $(filter tunnel,$(1)),@echo "$(YELLOW)   (Works across different WiFi networks)$(NC)")
	$(call print_separator)
	$(call blank_line)
	$(if $(filter lan,$(1)),\
		@echo "   Emulator:      $(GREEN)make open-app$(NC) (reaches Metro on $(EMULATOR_HOST):$(METRO_PORT) by itself)"; \
		echo "   Phone (USB):   $(GREEN)adb reverse tcp:$(METRO_PORT) tcp:$(METRO_PORT)$(NC) and open Zumik"; \
		echo "   Phone (WiFi):  dev menu (shake) > Change Bundle Location > $(GREEN)$(METRO_ADDRESS)$(NC)")
	$(if $(filter tunnel,$(1)),\
		@HOST=$$(docker logs $(MOBILE_CONTAINER) 2>&1 | grep -o '[a-z0-9-]*\.exp\.direct' | tail -1); \
		if [ -n "$$HOST" ]; then \
			echo "   Metro tunnel:  $(GREEN)$$HOST$(NC)"; \
			echo "   Phone:         dev menu (shake) > Change Bundle Location > $(GREEN)$$HOST:80$(NC)"; \
		else \
			echo "   $(YELLOW)$(ICON_WARNING) Expo tunnel not ready yet: run $(GREEN)make qr-tunnel$(YELLOW) again in a few seconds$(NC)"; \
		fi)
	$(call blank_line)
	@echo "   No debug build on the device? $(GREEN)cd mobile && npx expo run:android --no-bundler$(NC) (add $(GREEN)--device$(NC) for a phone)"
	@echo "   \"Unable to load script\": Metro is unreachable; check the address above, then tap RELOAD"
	$(call blank_line)
	$(call print_separator)
endef

# Display standard service status
# Usage: $(call display_services,lan) or $(call display_services,tunnel)
define display_services
	$(call print_subsection,$(if $(filter tunnel,$(1)),📡 Services,Services running))
	$(call print_service,Backend API,$(BACKEND_URL))
	$(call print_service,Expo DevTools,$(EXPO_DEVTOOLS_URL))
	$(call print_service,Metro Bundler,$(METRO_URL))
	$(if $(and $(filter lan,$(1)),$(filter local,$(SUPABASE_MODE))),$(call print_service,Emails (Mailpit),http://localhost:$(SUPABASE_MAIL_UI_PORT)))
endef

# Display common commands
# Usage: $(call display_common_commands,lan) or $(call display_common_commands,tunnel)
define display_common_commands
	$(call print_subsection,💡 Quick Commands)
	$(if $(filter lan,$(1)),\
		$(call print_command,qr,Show how to connect the app again), \
		$(call print_command,qr-tunnel,Show tunnel URLs and Metro host))
	$(call print_command,logs,View all logs (live))
	$(if $(filter lan,$(1)),$(call print_command,logs-backend,View backend logs only))
	$(if $(filter lan,$(1)),$(call print_command,logs-mobile,View Expo logs only))
	$(if $(and $(filter lan,$(1)),$(filter local,$(SUPABASE_MODE))),$(call print_command,logs-supabase,View the dev Supabase stack logs))
	$(call print_command,stop,Stop all services)
	$(if $(filter lan,$(1)),$(call print_command,containers-restart,Restart the containers))
	$(if $(filter tunnel,$(1)),$(call print_command,dev,Switch to LAN mode))
endef

# Display tunnel-specific URLs
# Usage: $(call display_tunnel_urls)
define display_tunnel_urls
	$(call print_subsection,📡 Tunnel URLs)
	$(call print_arrow,Backend tunnel URL:)
	@docker exec $(BACKEND_CONTAINER) cat $(SHARED_TUNNEL_FILE) 2>/dev/null || echo "   $(YELLOW)Initializing...$(NC)"
	$(call blank_line)
	$(call blank_line)
	$(call print_subsection,🔍 ngrok Web Interface)
	$(call print_bullet,Backend ngrok: $(NGROK_UI_URL))
endef

# Display numbered next steps
# Usage: $(call display_next_steps,Step 1,Step 2,Step 3)
define display_next_steps
	$(call print_subsection,Next steps)
	@echo "  1. $(1)"
	$(if $(2),@echo "  2. $(2)")
	$(if $(3),@echo "  3. $(3)")
	$(if $(4),@echo "  4. $(4)")
endef

# Display permissions info
# Usage: $(call display_permissions_info)
define display_permissions_info
	$(call print_subsection,Permissions set to)
	@echo "  • Directories: 0755 (drwxr-xr-x) - readable by Docker"
	@echo "  • Files:       0644 (-rw-r--r--) - readable by Docker"
	@echo "  • Scripts:     executable (+x)"
endef

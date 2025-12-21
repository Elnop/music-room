# ==============================================================================
# Custom Development Build Commands (Native Builds)
# ==============================================================================
# Commands for building custom development clients with native code (Google Sign-In)

.PHONY: dev-build-setup dev-build dev-build-local

dev-build-setup: ## One-time setup for custom development builds (EAS)
	$(call print_header,Custom Development Build - One-Time Setup)
	$(call print_subsection,📖 WHY?)
	@echo "   Google Sign-In requires native code (not in Expo Go)"
	@echo "   Custom build keeps hot reload + fast refresh + tunnel"
	@echo ""
	$(call print_subsection,📋 PREREQUISITES)
	@echo "   • $(MOBILE_ENV) must have: EXPO_TOKEN=your-token"
	@echo "   • Get token: https://expo.dev/accounts/[username]/settings/access-tokens"
	@echo ""
	$(call print_arrow,Step 1/3: Installing EAS CLI...)
	@if ! command -v eas >/dev/null 2>&1; then \
		npm install -g eas-cli; \
		echo "$(GREEN)$(ICON_SUCCESS) EAS CLI installed$(NC)"; \
	else \
		echo "$(GREEN)$(ICON_SUCCESS) EAS CLI already installed$(NC)"; \
	fi
	@echo ""
	$(call print_arrow,Step 2/3: Logging into EAS...)
	$(call check_expo_token)
	$(call print_success,Logged in as: $$(cd $(MOBILE_DIR) && eas whoami))
	@echo ""
	$(call print_arrow,Step 3/3: Configuring EAS project...)
	@$(call eas_mobile,build:configure) || echo "$(YELLOW)$(ICON_WARNING) Already configured$(NC)"
	$(call blank_line)
	$(call print_header,✓ Setup Complete)
	$(call display_next_steps,$(GREEN)make dev-build$(NC) - Build Android APK (~15-20 min),Download APK and install on device,$(GREEN)make dev-tunnel$(NC) - Hot reload works!)
	$(call blank_line)

dev-build: ## Build custom development client for Android (Google Sign-In support)
	$(call print_header,Building Custom Development Client)
	$(call print_subsection,📖 WHAT IS THIS?)
	@echo "   Android APK with Google Sign-In integrated"
	@echo "   $(GREEN)Build once$(NC), use with hot reload"
	@echo ""
	@echo "$(YELLOW)⏱️  BUILD TIME:$(NC) ~15-20 minutes (cloud build)"
	@echo ""
	$(call print_arrow,Checking EAS setup...)
	$(call check_command,eas,EAS CLI not installed - Run: make dev-build-setup)
	@if ! cd $(MOBILE_DIR) && eas whoami >/dev/null 2>&1; then \
		echo "$(RED)$(ICON_ERROR) Not logged into EAS$(NC)"; \
		echo "$(YELLOW)$(ICON_WARNING) Run: make dev-build-setup$(NC)"; \
		exit 1; \
	fi
	$(call print_success,EAS ready)
	@echo ""
	$(call print_arrow,Starting cloud build...)
	@echo ""
	$(call print_separator)
	$(call print_warning,⏳ This takes ~15-20 minutes)
	@echo "$(YELLOW)   Build continues in cloud (can close terminal)$(NC)"
	$(call print_separator)
	$(call blank_line)
	$(call eas_mobile,build --profile development --platform android)
	$(call blank_line)
	$(call print_header,✓ Build Complete)
	$(call print_subsection,📱 Next)
	$(call display_next_steps,Download APK from link above,Install on Android device,$(GREEN)make dev-tunnel$(NC),Open dev build app and scan QR)
	$(call print_subsection,💡 Rebuild only when)
	@echo "   • Native deps change (new plugins)"
	@echo "   • app.json changes"
	@echo "   • NOT for code changes (hot reload!)"
	@echo ""

dev-build-local: ## Build development client locally with Android SDK (faster)
	$(call print_header,Building Locally (Android SDK))
	$(call print_subsection,⚠️  REQUIRES)
	@echo "   • Android Studio installed"
	@echo "   • Android SDK configured"
	@echo "   • ANDROID_HOME env variable"
	@echo "   • adb command available"
	@echo ""
	$(call print_arrow,Checking Android SDK...)
	@if ! command -v adb >/dev/null 2>&1; then \
		echo "$(RED)$(ICON_ERROR) Android SDK not found$(NC)"; \
		echo ""; \
		echo "$(YELLOW)$(ICON_WARNING) Install Android Studio and configure:$(NC)"; \
		echo "  export ANDROID_HOME=$$HOME/Android/Sdk"; \
		echo "  export PATH=$$PATH:$$ANDROID_HOME/platform-tools"; \
		echo ""; \
		echo "$(BLUE)$(ICON_INFO) Or use cloud: make dev-build$(NC)"; \
		exit 1; \
	fi
	$(call print_success,Android SDK: $${ANDROID_HOME})
	$(call blank_line)
	$(call print_arrow,Running expo prebuild (generates native code)...)
	$(call expo_mobile,prebuild --clean)
	$(call blank_line)
	$(call print_arrow,Building and installing on device...)
	$(call print_info,Connect Android device via USB (USB debugging enabled))
	$(call blank_line)
	$(call expo_mobile,run:android --device)
	$(call blank_line)
	$(call print_header,✓ Installed on Device)
	$(call display_next_steps,Disconnect USB,$(GREEN)make dev-tunnel$(NC),Open dev build app and scan QR)
	$(call blank_line)

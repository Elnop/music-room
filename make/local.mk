# ==============================================================================
# Local Development Commands (No Docker)
# ==============================================================================
# Commands for local development, useful with Android Studio emulator

.PHONY: dev-local dev-android backend-local mobile-local expo-android expo-clear clean-native check-devices start-emulator kill-emulator

dev-local: .ensure-backend-deps .ensure-mobile-deps ## Start development locally (no Docker) - for Android Studio emulator
	$(call print_header,Starting Local Development Mode)
	$(call print_success,Dependencies OK)
	$(call blank_line)
	$(call print_arrow,Starting backend server...)
	$(call npm_backend,run dev) &
	@sleep $(SHORT_WAIT_TIME)
	$(call print_success,Backend started: $(BACKEND_URL))
	$(call blank_line)
	$(call print_arrow,Starting Expo for Android...)
	$(call blank_line)
	$(call expo_mobile,start --localhost --android)

dev-android: ## Start Expo for Android emulator (backend must be running)
	$(call print_header,Starting Expo for Android Emulator)
	$(call check_backend_health)
	$(call blank_line)
	$(call print_arrow,Starting Expo with Android...)
	$(call print_info,📱 Opening in Android Studio emulator)
	$(call blank_line)
	$(call expo_mobile,start --localhost --android)

backend-local: .ensure-backend-deps ## Start backend only (local, no Docker)
	$(call print_header,Starting Backend (Local))
	$(call print_arrow,Starting backend server...)
	$(call npm_backend,run dev)

mobile-local: .ensure-mobile-deps ## Start Expo only (local, no Docker)
	$(call print_header,Starting Expo (Local))
	$(call print_arrow,Starting Expo development server...)
	$(call blank_line)
	$(call print_info,Options:)
	@echo "  $(GREEN)a$(NC) - Android emulator"
	@echo "  $(GREEN)i$(NC) - iOS simulator"
	@echo "  $(GREEN)w$(NC) - Web browser"
	$(call blank_line)
	$(call expo_mobile,start --localhost)

expo-android: ## Quick start: Open app directly in Android emulator
	$(call print_info,📱 Opening in Android emulator...)
	$(call expo_mobile,start --localhost --android)

expo-clear: ## Start Expo with cleared cache (local)
	$(call print_info,🧹 Starting Expo (cleared cache)...)
	$(call expo_mobile,start --localhost --clear)

clean-native: ## Clean native build folders (android, ios, .expo)
	$(call print_header,Cleaning Native Build Folders)
	$(call print_arrow,Removing android/ folder...)
	@rm -rf $(MOBILE_DIR)/android
	$(call print_success,Android build removed)
	$(call blank_line)
	$(call print_arrow,Removing ios/ folder...)
	@rm -rf $(MOBILE_DIR)/ios
	$(call print_success,iOS build removed)
	$(call blank_line)
	$(call print_arrow,Removing .expo/ cache...)
	$(call remove_build_artifacts)
	$(call print_success,Expo cache removed)
	$(call blank_line)
	$(call print_success,Native builds cleaned)
	@echo "$(BLUE)Next:$(NC) Run $(GREEN)make dev-build-local$(NC) to rebuild"
	$(call blank_line)

check-devices: ## Check if Android device is connected
	$(call print_header,Checking Connected Devices)
	$(call print_subsection,📱 Android Devices)
	@if docker ps --format '{{.Names}}' | grep -q music-room-$(MOBILE_SERVICE); then \
		echo "$(BLUE)$(ICON_INFO) Using Docker container$(NC)"; \
		$(call docker_exec,music-room-$(MOBILE_SERVICE),adb devices) 2>/dev/null || echo "$(RED)$(ICON_ERROR) No devices$(NC)"; \
	else \
		if command -v adb >/dev/null 2>&1; then \
			echo "$(BLUE)$(ICON_INFO) Using local adb$(NC)"; \
			adb devices; \
		else \
			echo "$(RED)$(ICON_ERROR) adb not found$(NC)"; \
			echo "$(YELLOW)$(ICON_WARNING) Start Docker: make dev$(NC)"; \
			echo "$(YELLOW)$(ICON_WARNING) Or install Android SDK$(NC)"; \
		fi \
	fi
	$(call blank_line)
	$(call print_subsection,💡 Tips)
	@echo "   • Enable USB debugging on device"
	@echo "   • Accept USB authorization popup"
	@echo "   • Use $(GREEN)make dev-android$(NC) to launch"
	$(call blank_line)

start-emulator: ## Start Android emulator with software rendering (fixes black screen)
	$(call print_header,Starting Android Emulator)
	$(call print_subsection,🔧 Configuration)
	@echo "   • GPU: Software rendering (swiftshader_indirect)"
	@echo "   • Fixes black screen issues on Linux"
	@echo ""
	$(call print_arrow,Checking for running emulators...)
	@RUNNING=$$($(ANDROID_HOME)/platform-tools/adb devices | grep emulator | wc -l); \
	if [ $$RUNNING -gt 0 ]; then \
		echo "$(YELLOW)$(ICON_WARNING) Emulator already running$(NC)"; \
		echo "$(BLUE)$(ICON_INFO) Use $(GREEN)make kill-emulator$(NC) to stop it first$(NC)"; \
		exit 1; \
	fi
	$(call blank_line)
	$(call print_arrow,Listing available AVDs...)
	@$(ANDROID_HOME)/emulator/emulator -list-avds | while read avd; do \
		echo "  $(GREEN)$$avd$(NC)"; \
	done
	$(call blank_line)
	$(call print_arrow,Starting emulator with software rendering...)
	@AVD=$$($(ANDROID_HOME)/emulator/emulator -list-avds | head -1); \
	if [ -z "$$AVD" ]; then \
		echo "$(RED)$(ICON_ERROR) No AVD found$(NC)"; \
		echo "$(YELLOW)$(ICON_WARNING) Create one in Android Studio: Tools > Device Manager$(NC)"; \
		exit 1; \
	fi; \
	echo "$(BLUE)$(ICON_INFO) Launching: $$AVD$(NC)"; \
	$(ANDROID_HOME)/emulator/emulator -avd $$AVD -gpu swiftshader_indirect > /dev/null 2>&1 &
	$(call blank_line)
	$(call print_info,⏳ Waiting for emulator to boot (30 seconds)...)
	@sleep 30
	$(call blank_line)
	$(call print_success,Emulator started!)
	$(call print_info,Run $(GREEN)make dev-build-local$(NC) to install the app)
	$(call blank_line)

kill-emulator: ## Stop all running Android emulators
	$(call print_header,Stopping Android Emulators)
	$(call print_arrow,Checking for running emulators...)
	@RUNNING=$$($(ANDROID_HOME)/platform-tools/adb devices | grep emulator | wc -l); \
	if [ $$RUNNING -eq 0 ]; then \
		echo "$(YELLOW)$(ICON_WARNING) No emulators running$(NC)"; \
		exit 0; \
	fi
	$(call blank_line)
	$(call print_arrow,Killing emulators...)
	@$(ANDROID_HOME)/platform-tools/adb devices | grep emulator | cut -f1 | while read device; do \
		echo "  $(YELLOW)Stopping $$device$(NC)"; \
		$(ANDROID_HOME)/platform-tools/adb -s $$device emu kill 2>/dev/null || true; \
	done
	@sleep 2
	$(call print_success,All emulators stopped)
	$(call blank_line)

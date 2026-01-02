# ==============================================================================
# Production Build Commands Module (Simplified)
# ==============================================================================
# Provides manual APK build commands for local production builds
#
# Usage:
#   make prod-build-apk-manual  - Build production APK with Gradle (no EAS, ~5-10 min)
#   make prod-install-apk       - Install production APK on connected device via adb
# ==============================================================================

.PHONY: prod-build-apk-manual prod-install-apk

#------------------------------------------------------------
# Production APK Build Commands
#------------------------------------------------------------

prod-build-apk-manual: ## Build production APK manually with Gradle (no EAS, directly installable)
	$(call print_header,Building Production APK (Manual - No EAS))
	$(call print_subsection,📱 Target: Direct installation on devices)
	@echo "   Format: APK (Android Package)"
	@echo "   No EAS required - 100% local build"
	@echo "   Time: ~5-10 minutes"
	@echo ""
	$(call print_arrow,Checking Android SDK...)
	@command -v adb >/dev/null 2>&1 || { \
		$(call print_error,Android SDK not found); \
		echo "$(YELLOW)$(ICON_WARNING) Set ANDROID_HOME and add platform-tools to PATH$(NC)"; \
		exit 1; \
	}
	$(call print_success,Android SDK found: $${ANDROID_HOME})
	@echo ""
	$(call print_arrow,Running expo prebuild...)
	@cd mobile && npx expo prebuild --clean
	$(call blank_line)
	$(call print_arrow,Generating dynamic network security config...)
	@cd mobile && ./scripts/generate-network-config.sh
	$(call blank_line)
	$(call print_arrow,Building APK with Gradle...)
	@cd mobile/android && ./gradlew assembleRelease
	$(call blank_line)
	$(call print_header,✓ Build Complete)
	$(call print_subsection,📦 APK Location)
	@echo "   mobile/android/app/build/outputs/apk/release/app-release.apk"
	@echo ""
	$(call print_subsection,📱 Install on Device)
	@echo "   adb install mobile/android/app/build/outputs/apk/release/app-release.apk"
	@echo ""

prod-install-apk: ## Install production APK on connected device via adb
	$(call print_header,Installing Production APK)
	@if [ ! -f "mobile/android/app/build/outputs/apk/release/app-release.apk" ]; then \
		echo ""; \
		echo "$(RED)$(ICON_ERROR) APK not found: mobile/android/app/build/outputs/apk/release/app-release.apk$(NC)"; \
		echo ""; \
		echo "$(YELLOW)$(ICON_WARNING) Run one of these commands first:$(NC)"; \
		echo "  $(GREEN)make prod-build-apk-manual$(NC) - Build APK locally"; \
		echo ""; \
		exit 1; \
	fi
	$(call print_arrow,Checking for connected devices...)
	@DEVICES=$$(adb devices | grep -v "List" | grep "device$$" | wc -l); \
	if [ "$$DEVICES" -eq 0 ]; then \
		echo ""; \
		echo "$(RED)$(ICON_ERROR) No devices connected$(NC)"; \
		echo ""; \
		echo "$(YELLOW)$(ICON_WARNING) Connect your device via USB and enable USB debugging$(NC)"; \
		echo ""; \
		exit 1; \
	fi; \
	echo "$(GREEN)$(ICON_SUCCESS) Found $$DEVICES device(s)$(NC)"
	@echo ""
	$(call print_arrow,Installing APK...)
	@adb install -r mobile/android/app/build/outputs/apk/release/app-release.apk
	$(call blank_line)
	$(call print_header,✓ Installation Complete)
	@echo "$(GREEN)$(ICON_SUCCESS) App installed successfully$(NC)"
	@echo ""

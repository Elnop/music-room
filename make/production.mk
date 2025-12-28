# ==============================================================================
# Production Build Commands Module
# ==============================================================================
# Provides production Android app build commands for Google Play Store deployment
#
# Usage:
#   make prod-build          - Build production AAB via EAS cloud (~15-25 min)
#   make prod-build-apk      - Build production APK via EAS cloud (directly installable)
#   make prod-build-apk-local - Build production APK locally with EAS (requires Android SDK, ~5-15 min)
#   make prod-build-apk-manual - Build production APK with Gradle (NO EAS, ~5-10 min)
#   make prod-build-local    - Build production AAB locally (requires Android SDK)
#   make prod-build-manual   - Build AAB manually with Gradle (full control)
#   make set-cluzob-url      - Set mobile/.env to Cluzhub backend (https://zumik.cluzhub.com)
#   make prod-version-bump   - Bump app version interactively
#   make prod-version-auto   - Auto-increment versionCode
#   make prod-submit         - Submit AAB to Google Play Store
#   make prod-info           - Display production build information
#   make prod-keystore-setup - Generate production keystore for signing
# ==============================================================================

.PHONY: prod-build prod-build-local prod-build-manual prod-build-apk prod-build-apk-local prod-build-apk-manual prod-submit \
        prod-version-bump prod-version-auto prod-keystore-setup prod-info prod-install-apk set-cluzob-url

#------------------------------------------------------------
# Production Mobile Build Commands
#------------------------------------------------------------

prod-build: ## Build production AAB via EAS cloud (Google Play Store)
	$(call print_header,Building Production AAB (Cloud))
	$(call print_subsection,📱 Target: Google Play Store)
	@echo "   Format: AAB (Android App Bundle)"
	@echo "   Profile: production"
	@echo "   Time: ~15-25 minutes"
	@echo ""
	$(call print_arrow,Checking prerequisites...)
	@command -v eas >/dev/null 2>&1 || { \
		$(call print_error,EAS CLI not installed); \
		echo "$(YELLOW)$(ICON_WARNING) Run: npm install -g eas-cli$(NC)"; \
		exit 1; \
	}
	@cd mobile && eas whoami >/dev/null 2>&1 || { \
		$(call print_error,Not logged into EAS); \
		echo "$(YELLOW)$(ICON_WARNING) Run: cd mobile && eas login$(NC)"; \
		exit 1; \
	}
	$(call print_success,EAS ready)
	@echo ""
	$(call print_arrow,Starting cloud build...)
	$(call print_warning,⏳ This takes ~15-25 minutes)
	$(call blank_line)
	@cd mobile && eas build --profile production --platform android
	$(call blank_line)
	$(call print_header,✓ Build Complete)
	$(call print_subsection,📦 Next Steps)
	@echo "   1. Download AAB from EAS dashboard: https://expo.dev"
	@echo "   2. Or run: make prod-submit (to upload to Play Store)"
	@echo ""

prod-build-local: ## Build production AAB locally (requires Android SDK)
	$(call print_header,Building Production AAB (Local))
	$(call print_arrow,Checking Android SDK...)
	@command -v adb >/dev/null 2>&1 || { \
		$(call print_error,Android SDK not found); \
		echo "$(YELLOW)$(ICON_WARNING) Set ANDROID_HOME and add platform-tools to PATH$(NC)"; \
		exit 1; \
	}
	$(call print_success,Android SDK found: $${ANDROID_HOME})
	@echo ""
	$(call print_arrow,Building with EAS local...)
	@cd mobile && eas build --profile production --platform android --local
	$(call blank_line)
	$(call print_header,✓ Build Complete)
	@echo "   Check EAS output above for AAB location"
	@echo ""

prod-build-manual: ## Build AAB manually with Gradle (no EAS)
	$(call print_header,Building Production AAB (Manual))
	$(call print_arrow,Running expo prebuild...)
	@cd mobile && npx expo prebuild --clean
	$(call blank_line)
	$(call print_arrow,Building AAB with Gradle...)
	@if [ ! -f "mobile/android/gradle.properties" ]; then \
		$(call print_error,Missing signing configuration); \
		echo "$(YELLOW)$(ICON_WARNING) Run: make prod-keystore-setup$(NC)"; \
		exit 1; \
	fi
	@cd mobile/android && ./gradlew bundleRelease
	$(call blank_line)
	$(call print_header,✓ Build Complete)
	@echo "   AAB: mobile/android/app/build/outputs/bundle/release/app-release.aab"
	@echo ""

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

prod-build-apk: ## Build production APK via EAS cloud (directly installable)
	$(call print_header,Building Production APK (Cloud))
	$(call print_subsection,📱 Target: Direct installation on devices)
	@echo "   Format: APK (Android Package)"
	@echo "   Profile: preview"
	@echo "   Time: ~15-25 minutes"
	@echo ""
	$(call print_arrow,Checking prerequisites...)
	@command -v eas >/dev/null 2>&1 || { \
		$(call print_error,EAS CLI not installed); \
		echo "$(YELLOW)$(ICON_WARNING) Run: npm install -g eas-cli$(NC)"; \
		exit 1; \
	}
	@cd mobile && eas whoami >/dev/null 2>&1 || { \
		$(call print_error,Not logged into EAS); \
		echo "$(YELLOW)$(ICON_WARNING) Run: cd mobile && eas login$(NC)"; \
		exit 1; \
	}
	$(call print_success,EAS ready)
	@echo ""
	$(call print_arrow,Starting cloud build...)
	$(call print_warning,⏳ This takes ~15-25 minutes)
	$(call blank_line)
	@cd mobile && eas build --profile preview --platform android
	$(call blank_line)
	$(call print_header,✓ Build Complete)
	$(call print_subsection,📦 Next Steps)
	@echo "   1. Download APK from EAS dashboard: https://expo.dev"
	@echo "   2. Install via USB: adb install downloaded-file.apk"
	@echo "   3. Or scan QR code to download on device"
	@echo ""

prod-build-apk-local: ## Build production APK locally (requires Android SDK)
	$(call print_header,Building Production APK (Local))
	$(call print_subsection,📱 Target: Direct installation on devices)
	@echo "   Format: APK (Android Package)"
	@echo "   Profile: preview"
	@echo "   Time: ~5-15 minutes"
	@echo ""
	$(call print_arrow,Checking Android SDK...)
	@command -v adb >/dev/null 2>&1 || { \
		$(call print_error,Android SDK not found); \
		echo "$(YELLOW)$(ICON_WARNING) Set ANDROID_HOME and add platform-tools to PATH$(NC)"; \
		exit 1; \
	}
	$(call print_success,Android SDK found: $${ANDROID_HOME})
	@echo ""
	$(call print_arrow,Building with EAS local...)
	$(call print_warning,⏳ This takes ~5-15 minutes)
	$(call blank_line)
	@cd mobile && eas build --profile preview --platform android --local
	$(call blank_line)
	$(call print_header,✓ Build Complete)
	$(call print_subsection,📦 Next Steps)
	@echo "   1. Find APK in EAS output above"
	@echo "   2. Install via USB: adb install path/to/file.apk"
	@echo ""

#------------------------------------------------------------
# Backend URL Configuration
#------------------------------------------------------------

set-cluzob-url: ## Configure mobile/.env for Cluzhub backend (https://zumik.cluzhub.com - port 80/443)
	$(call print_header,Configuring Cluzhub Backend URL)
	@if [ ! -f "$(MOBILE_ENV)" ]; then \
		echo "$(RED)$(ICON_ERROR) Mobile .env not found: $(MOBILE_ENV)$(NC)"; \
		exit 1; \
	fi; \
	API_URL="https://zumik.cluzhub.com"; \
	WS_URL="wss://zumik.cluzhub.com"; \
	echo "$(GREEN)$(ICON_SUCCESS) Target: Cluzhub Production$(NC)"; \
	echo "  $(BLUE)$(ICON_BULLET)$(NC) API: $$API_URL (port 80)"; \
	echo "  $(BLUE)$(ICON_BULLET)$(NC) WebSocket: $$WS_URL (port 443)"; \
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
		echo "# Cluzhub Production (configured by make set-cluzob-url)" >> $(MOBILE_ENV); \
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
	echo "  1. $(GREEN)make prod-build-apk-manual$(NC) - Build APK"; \
	echo "  2. $(GREEN)make prod-install-apk$(NC) - Install on device"; \
	echo ""
#------------------------------------------------------------
# Keystore Management
#------------------------------------------------------------

prod-keystore-setup: ## Generate Android keystore for production signing
	$(call print_header,Creating Production Keystore)
	@echo "This will generate a keystore for signing your Android app."
	@echo "$(RED)$(ICON_WARNING) IMPORTANT: Keep this file secure and backed up!$(NC)"
	@echo ""
	@read -p "Enter keystore filename (e.g., musicroom.keystore): " KEYSTORE_NAME; \
	read -p "Enter key alias (e.g., musicroom-key): " KEY_ALIAS; \
	read -s -p "Enter keystore password: " STORE_PASS; echo ""; \
	read -s -p "Enter key password: " KEY_PASS; echo ""; \
	echo ""; \
	$(call print_arrow,Generating keystore...); \
	cd mobile && keytool -genkeypair -v -storetype PKCS12 \
		-keystore $$KEYSTORE_NAME \
		-alias $$KEY_ALIAS \
		-keyalg RSA -keysize 2048 -validity 10000 \
		-storepass $$STORE_PASS -keypass $$KEY_PASS; \
	echo ""; \
	$(call print_success,Keystore created: mobile/$$KEYSTORE_NAME); \
	echo ""; \
	$(call print_subsection,📝 Next Steps:); \
	echo "   1. Add to mobile/android/gradle.properties:"; \
	echo "      MYAPP_UPLOAD_STORE_FILE=$$KEYSTORE_NAME"; \
	echo "      MYAPP_UPLOAD_KEY_ALIAS=$$KEY_ALIAS"; \
	echo "      MYAPP_UPLOAD_STORE_PASSWORD=$$STORE_PASS"; \
	echo "      MYAPP_UPLOAD_KEY_PASSWORD=$$KEY_PASS"; \
	echo ""; \
	echo "   2. $(RED)IMPORTANT: Add *.keystore to .gitignore!$(NC)"; \
	echo "   3. Backup keystore to secure location"; \
	echo ""

#------------------------------------------------------------
# Version Management
#------------------------------------------------------------

prod-version-bump: ## Bump app version (interactive)
	$(call print_header,Bump App Version)
	@echo "Current version: $$(jq -r '.expo.version' mobile/app.json)"
	@echo "Current versionCode: $$(jq -r '.expo.android.versionCode' mobile/app.json)"
	@echo ""
	@read -p "Enter new version (e.g., 1.0.1): " NEW_VERSION; \
	read -p "Enter new versionCode (e.g., 2): " NEW_CODE; \
	jq ".expo.version = \"$$NEW_VERSION\" | .expo.android.versionCode = $$NEW_CODE" \
		mobile/app.json > mobile/app.json.tmp && \
	mv mobile/app.json.tmp mobile/app.json; \
	$(call blank_line); \
	$(call print_success,Version updated to $$NEW_VERSION (versionCode: $$NEW_CODE)); \
	echo ""

prod-version-auto: ## Auto-increment versionCode (keeps version same)
	$(call print_header,Auto-Increment versionCode)
	@CURRENT_VERSION=$$(jq -r '.expo.version' mobile/app.json); \
	CURRENT_CODE=$$(jq -r '.expo.android.versionCode' mobile/app.json); \
	NEW_CODE=$$((CURRENT_CODE + 1)); \
	jq ".expo.android.versionCode = $$NEW_CODE" mobile/app.json > mobile/app.json.tmp && \
	mv mobile/app.json.tmp mobile/app.json; \
	$(call blank_line); \
	$(call print_success,versionCode incremented: $$CURRENT_CODE → $$NEW_CODE); \
	echo "   Version: $$CURRENT_VERSION (unchanged)"; \
	echo ""

#------------------------------------------------------------
# Deployment
#------------------------------------------------------------

prod-submit: ## Submit AAB to Google Play Store (requires EAS)
	$(call print_header,Submitting to Google Play Store)
	$(call print_arrow,Uploading AAB via EAS Submit...)
	@cd mobile && eas submit --platform android --latest
	$(call blank_line)
	$(call print_header,✓ Submission Complete)
	@echo "   Check Google Play Console for review status"
	@echo "   URL: https://play.google.com/console"
	@echo ""

#------------------------------------------------------------
# Information
#------------------------------------------------------------

prod-info: ## Display production build information
	$(call print_header,Production Build Information)
	@echo "App Name:     $$(jq -r '.expo.name' mobile/app.json)"
	@echo "Package:      $$(jq -r '.expo.android.package' mobile/app.json)"
	@echo "Version:      $$(jq -r '.expo.version' mobile/app.json)"
	@echo "versionCode:  $$(jq -r '.expo.android.versionCode' mobile/app.json)"
	@echo "Target SDK:   $$(jq -r '.expo.plugins[] | select(type == "array" and .[0] == "expo-build-properties") | .[1].android.targetSdkVersion' mobile/app.json)"
	@echo ""
	@echo "EAS Project:  $$(jq -r '.expo.extra.eas.projectId' mobile/app.json)"
	@echo "Profile:      production"
	@echo "Build Type:   $$(jq -r '.build.production.android.buildType' mobile/eas.json)"
	@echo "Auto-Increment: $$(jq -r '.build.production.autoIncrement' mobile/eas.json)"
	@echo ""

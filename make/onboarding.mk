# ==============================================================================
# Onboarding Commands
# ==============================================================================
# Commands to help onboard new developers

.PHONY: check-setup

check-setup: ## Verify development environment is correctly configured
	$(call print_header,Environment Setup Check)
	@ERRORS=0; \
	echo "$(BLUE)$(ICON_INFO) Checking prerequisites for local development...$(NC)"; \
	echo ""; \
	\
	echo "$(YELLOW)$(ICON_ARROW) Android SDK...$(NC)"; \
	if [ ! -d "$(ANDROID_HOME)" ]; then \
		echo "  $(RED)$(ICON_ERROR) Android SDK not found at: $(ANDROID_HOME)$(NC)"; \
		echo "  $(YELLOW)→ Install Android Studio: https://developer.android.com/studio$(NC)"; \
		ERRORS=$$((ERRORS + 1)); \
	else \
		echo "  $(GREEN)$(ICON_SUCCESS) Android SDK found: $(ANDROID_HOME)$(NC)"; \
	fi; \
	echo ""; \
	\
	echo "$(YELLOW)$(ICON_ARROW) ANDROID_HOME environment variable...$(NC)"; \
	if [ -z "$(ANDROID_HOME)" ]; then \
		echo "  $(RED)$(ICON_ERROR) ANDROID_HOME not set$(NC)"; \
		echo "  $(YELLOW)→ Add to ~/.zshrc or ~/.bashrc:$(NC)"; \
		echo "    export ANDROID_HOME=\$$HOME/Android/Sdk"; \
		echo "    export PATH=\$$PATH:\$$ANDROID_HOME/emulator:\$$ANDROID_HOME/platform-tools"; \
		ERRORS=$$((ERRORS + 1)); \
	else \
		echo "  $(GREEN)$(ICON_SUCCESS) ANDROID_HOME configured$(NC)"; \
	fi; \
	echo ""; \
	\
	echo "$(YELLOW)$(ICON_ARROW) adb command...$(NC)"; \
	if ! command -v adb >/dev/null 2>&1; then \
		echo "  $(RED)$(ICON_ERROR) adb not found in PATH$(NC)"; \
		echo "  $(YELLOW)→ Add to PATH: \$$ANDROID_HOME/platform-tools$(NC)"; \
		ERRORS=$$((ERRORS + 1)); \
	else \
		ADB_VERSION=$$(adb --version 2>&1 | head -1); \
		echo "  $(GREEN)$(ICON_SUCCESS) adb found: $$ADB_VERSION$(NC)"; \
	fi; \
	echo ""; \
	\
	echo "$(YELLOW)$(ICON_ARROW) emulator command...$(NC)"; \
	if ! command -v emulator >/dev/null 2>&1; then \
		echo "  $(RED)$(ICON_ERROR) emulator not found in PATH$(NC)"; \
		echo "  $(YELLOW)→ Add to PATH: \$$ANDROID_HOME/emulator$(NC)"; \
		ERRORS=$$((ERRORS + 1)); \
	else \
		echo "  $(GREEN)$(ICON_SUCCESS) emulator found$(NC)"; \
	fi; \
	echo ""; \
	\
	echo "$(YELLOW)$(ICON_ARROW) Android Virtual Devices (AVD)...$(NC)"; \
	if command -v emulator >/dev/null 2>&1; then \
		AVD_COUNT=$$($(ANDROID_HOME)/emulator/emulator -list-avds 2>/dev/null | wc -l); \
		if [ "$$AVD_COUNT" -eq 0 ]; then \
			echo "  $(YELLOW)$(ICON_WARNING) No AVD found$(NC)"; \
			echo "  $(YELLOW)→ Create one in Android Studio: Tools > Device Manager$(NC)"; \
		else \
			echo "  $(GREEN)$(ICON_SUCCESS) $$AVD_COUNT AVD(s) available:$(NC)"; \
			$(ANDROID_HOME)/emulator/emulator -list-avds 2>/dev/null | while read avd; do \
				echo "    $(BLUE)•$(NC) $$avd"; \
			done; \
		fi; \
	fi; \
	echo ""; \
	\
	echo "$(YELLOW)$(ICON_ARROW) Node.js...$(NC)"; \
	if ! command -v node >/dev/null 2>&1; then \
		echo "  $(RED)$(ICON_ERROR) Node.js not found$(NC)"; \
		echo "  $(YELLOW)→ Install Node.js 18+: https://nodejs.org$(NC)"; \
		ERRORS=$$((ERRORS + 1)); \
	else \
		NODE_VERSION=$$(node --version); \
		echo "  $(GREEN)$(ICON_SUCCESS) Node.js: $$NODE_VERSION$(NC)"; \
	fi; \
	echo ""; \
	\
	echo "$(YELLOW)$(ICON_ARROW) npm...$(NC)"; \
	if ! command -v npm >/dev/null 2>&1; then \
		echo "  $(RED)$(ICON_ERROR) npm not found$(NC)"; \
		ERRORS=$$((ERRORS + 1)); \
	else \
		NPM_VERSION=$$(npm --version); \
		echo "  $(GREEN)$(ICON_SUCCESS) npm: $$NPM_VERSION$(NC)"; \
	fi; \
	echo ""; \
	\
	echo "$(YELLOW)$(ICON_ARROW) Java JDK...$(NC)"; \
	if [ -z "$(JAVA_HOME)" ] || [ ! -d "$(JAVA_HOME)" ]; then \
		echo "  $(YELLOW)$(ICON_WARNING) JAVA_HOME not set or invalid$(NC)"; \
		echo "  $(YELLOW)→ Usually bundled with Android Studio: ~/android-studio/jbr$(NC)"; \
	else \
		if command -v java >/dev/null 2>&1; then \
			JAVA_VERSION=$$(java -version 2>&1 | head -1); \
			echo "  $(GREEN)$(ICON_SUCCESS) Java: $$JAVA_VERSION$(NC)"; \
		else \
			echo "  $(YELLOW)$(ICON_WARNING) Java not in PATH$(NC)"; \
		fi; \
	fi; \
	echo ""; \
	\
	echo "$(YELLOW)$(ICON_ARROW) Dependencies...$(NC)"; \
	if [ ! -d "$(BACKEND_NODE_MODULES)" ]; then \
		echo "  $(YELLOW)$(ICON_WARNING) Backend dependencies not installed$(NC)"; \
		echo "  $(YELLOW)→ Run: make install$(NC)"; \
	else \
		echo "  $(GREEN)$(ICON_SUCCESS) Backend dependencies installed$(NC)"; \
	fi; \
	if [ ! -d "$(MOBILE_NODE_MODULES)" ]; then \
		echo "  $(YELLOW)$(ICON_WARNING) Mobile dependencies not installed$(NC)"; \
		echo "  $(YELLOW)→ Run: make install$(NC)"; \
	else \
		echo "  $(GREEN)$(ICON_SUCCESS) Mobile dependencies installed$(NC)"; \
	fi; \
	echo ""; \
	\
	echo "$(YELLOW)$(ICON_ARROW) Environment files...$(NC)"; \
	if [ ! -f "$(BACKEND_ENV)" ]; then \
		echo "  $(RED)$(ICON_ERROR) backend/.env not found$(NC)"; \
		echo "  $(YELLOW)→ Run: make install$(NC)"; \
		ERRORS=$$((ERRORS + 1)); \
	else \
		echo "  $(GREEN)$(ICON_SUCCESS) backend/.env exists$(NC)"; \
	fi; \
	if [ ! -f "$(MOBILE_ENV)" ]; then \
		echo "  $(RED)$(ICON_ERROR) mobile/.env not found$(NC)"; \
		echo "  $(YELLOW)→ Run: make install$(NC)"; \
		ERRORS=$$((ERRORS + 1)); \
	else \
		echo "  $(GREEN)$(ICON_SUCCESS) mobile/.env exists$(NC)"; \
		if ! grep -q "^EXPO_PUBLIC_API_URL=" $(MOBILE_ENV); then \
			echo "  $(YELLOW)$(ICON_WARNING) EXPO_PUBLIC_API_URL not configured$(NC)"; \
			echo "  $(YELLOW)→ Run: make set-backend-url$(NC)"; \
		else \
			API_URL=$$(grep "^EXPO_PUBLIC_API_URL=" $(MOBILE_ENV) | cut -d'=' -f2); \
			echo "  $(BLUE)$(ICON_INFO) API URL: $$API_URL$(NC)"; \
		fi; \
	fi; \
	echo ""; \
	\
	echo "$(YELLOW)$(ICON_ARROW) Facebook OAuth Configuration...$(NC)"; \
	if [ -f "$(BACKEND_ENV)" ] && [ -f "$(MOBILE_ENV)" ]; then \
		BACKEND_FB_ID=$$(grep '^FACEBOOK_APP_ID=' $(BACKEND_ENV) | cut -d'=' -f2); \
		BACKEND_FB_SECRET=$$(grep '^FACEBOOK_APP_SECRET=' $(BACKEND_ENV) | cut -d'=' -f2); \
		MOBILE_FB_ID=$$(grep '^EXPO_PUBLIC_FACEBOOK_APP_ID=' $(MOBILE_ENV) | cut -d'=' -f2); \
		MOBILE_FB_TOKEN=$$(grep '^EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN=' $(MOBILE_ENV) | cut -d'=' -f2); \
		\
		echo "  $(BLUE)Backend:$(NC)"; \
		if [ -z "$$BACKEND_FB_ID" ] || [ "$$BACKEND_FB_ID" = "your-facebook-app-id" ]; then \
			echo "    $(YELLOW)$(ICON_WARNING) Facebook App ID not configured$(NC)"; \
			echo "    $(YELLOW)→ Set FACEBOOK_APP_ID in backend/.env$(NC)"; \
		elif ! echo "$$BACKEND_FB_ID" | grep -qE '^[0-9]{10,}$$'; then \
			echo "    $(RED)$(ICON_ERROR) Invalid App ID format: $$BACKEND_FB_ID$(NC)"; \
			echo "    $(YELLOW)→ App ID must be numeric with 10+ digits$(NC)"; \
			ERRORS=$$((ERRORS + 1)); \
		else \
			echo "    $(GREEN)$(ICON_SUCCESS) App ID configured: $$BACKEND_FB_ID$(NC)"; \
		fi; \
		\
		if [ -z "$$BACKEND_FB_SECRET" ] || [ "$$BACKEND_FB_SECRET" = "your-facebook-app-secret" ]; then \
			echo "    $(YELLOW)$(ICON_WARNING) Facebook App Secret not configured$(NC)"; \
			echo "    $(YELLOW)→ Set FACEBOOK_APP_SECRET in backend/.env$(NC)"; \
		else \
			echo "    $(GREEN)$(ICON_SUCCESS) App Secret configured (length: $${#BACKEND_FB_SECRET})$(NC)"; \
		fi; \
		\
		echo "  $(BLUE)Mobile:$(NC)"; \
		if [ -z "$$MOBILE_FB_ID" ] || [ "$$MOBILE_FB_ID" = "your-facebook-app-id" ]; then \
			echo "    $(YELLOW)$(ICON_WARNING) Facebook App ID not configured$(NC)"; \
			echo "    $(YELLOW)→ Set EXPO_PUBLIC_FACEBOOK_APP_ID in mobile/.env$(NC)"; \
		elif ! echo "$$MOBILE_FB_ID" | grep -qE '^[0-9]{10,}$$'; then \
			echo "    $(RED)$(ICON_ERROR) Invalid App ID format: $$MOBILE_FB_ID$(NC)"; \
			echo "    $(YELLOW)→ App ID must be numeric with 10+ digits$(NC)"; \
			ERRORS=$$((ERRORS + 1)); \
		else \
			echo "    $(GREEN)$(ICON_SUCCESS) App ID configured: $$MOBILE_FB_ID$(NC)"; \
		fi; \
		\
		if [ -z "$$MOBILE_FB_TOKEN" ] || [ "$$MOBILE_FB_TOKEN" = "your-facebook-client-token" ]; then \
			echo "    $(YELLOW)$(ICON_WARNING) Facebook Client Token not configured$(NC)"; \
			echo "    $(YELLOW)→ Set EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN in mobile/.env$(NC)"; \
		else \
			echo "    $(GREEN)$(ICON_SUCCESS) Client Token configured (length: $${#MOBILE_FB_TOKEN})$(NC)"; \
		fi; \
		\
		echo "  $(BLUE)Consistency:$(NC)"; \
		if [ -n "$$BACKEND_FB_ID" ] && [ -n "$$MOBILE_FB_ID" ] && [ "$$BACKEND_FB_ID" != "your-facebook-app-id" ] && [ "$$MOBILE_FB_ID" != "your-facebook-app-id" ]; then \
			if [ "$$BACKEND_FB_ID" != "$$MOBILE_FB_ID" ]; then \
				echo "    $(RED)$(ICON_ERROR) App ID mismatch:$(NC)"; \
				echo "      Backend: $$BACKEND_FB_ID"; \
				echo "      Mobile:  $$MOBILE_FB_ID"; \
				echo "    $(YELLOW)→ Ensure both .env files use the same Facebook App ID$(NC)"; \
				ERRORS=$$((ERRORS + 1)); \
			else \
				echo "    $(GREEN)$(ICON_SUCCESS) App IDs match across backend and mobile$(NC)"; \
			fi; \
		fi; \
		\
		if [ -z "$$BACKEND_FB_ID" ] && [ -z "$$MOBILE_FB_ID" ]; then \
			echo "    $(BLUE)$(ICON_INFO) Facebook OAuth not configured (optional)$(NC)"; \
			echo "    $(YELLOW)→ See: https://developers.facebook.com/apps/$(NC)"; \
		fi; \
	fi; \
	echo ""; \
	\
	echo "────────────────────────────────────────────────────────────────"; \
	if [ $$ERRORS -eq 0 ]; then \
		echo "$(GREEN)$(ICON_SUCCESS) Environment is ready!$(NC)"; \
		echo ""; \
		echo "$(BLUE)$(ICON_INFO) Next steps:$(NC)"; \
		echo "  1. $(GREEN)make start-emulator$(NC) - Start Android emulator"; \
		echo "  2. $(GREEN)make dev-build-local$(NC) - Build and install app"; \
		echo ""; \
	else \
		echo "$(RED)$(ICON_ERROR) Found $$ERRORS error(s)$(NC)"; \
		echo ""; \
		echo "$(YELLOW)$(ICON_WARNING) Fix the errors above before running 'make dev-build-local'$(NC)"; \
		echo ""; \
		exit 1; \
	fi

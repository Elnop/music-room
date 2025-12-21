# ==============================================================================
# npm/Expo Helper Functions
# ==============================================================================
# Reusable functions for npm and expo commands

# Run npm command in backend
# Usage: $(call npm_backend,install)
# Usage: $(call npm_backend,run dev)
define npm_backend
	@cd $(BACKEND_DIR) && npm $(1)
endef

# Run npm command in mobile
# Usage: $(call npm_mobile,install)
# Usage: $(call npm_mobile,run lint)
define npm_mobile
	@cd $(MOBILE_DIR) && npm $(1)
endef

# Run expo command in mobile
# Usage: $(call expo_mobile,start --localhost)
# Usage: $(call expo_mobile,prebuild --clean)
define expo_mobile
	@cd $(MOBILE_DIR) && npx expo $(1)
endef

# Run EAS command in mobile
# Usage: $(call eas_mobile,whoami)
# Usage: $(call eas_mobile,build --profile development --platform android)
define eas_mobile
	@cd $(MOBILE_DIR) && eas $(1)
endef

# Run npm command in both backend and mobile
# Usage: $(call npm_both,install)
define npm_both
	$(call npm_backend,$(1))
	$(call npm_mobile,$(1))
endef

# Run npm script with fallback warning
# Usage: $(call npm_safe,backend,lint,Backend linting not configured)
define npm_safe
	@cd $(if $(filter backend,$(1)),$(BACKEND_DIR),$(MOBILE_DIR)) && npm run $(2) || echo "$(YELLOW)$(ICON_WARNING) $(3)$(NC)"
endef

# Install backend dependencies
# Usage: $(call npm_install_backend)
define npm_install_backend
	$(call npm_backend,install)
endef

# Install mobile dependencies
# Usage: $(call npm_install_mobile)
define npm_install_mobile
	$(call npm_mobile,install)
endef

# Install all dependencies
# Usage: $(call npm_install_all)
define npm_install_all
	$(call npm_install_backend)
	$(call npm_install_mobile)
endef

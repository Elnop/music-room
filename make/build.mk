# ==============================================================================
# Build Commands Module
# ==============================================================================
# Provides backend TypeScript compilation and verification targets
#
# Usage:
#   make compile-backend    - Build backend TypeScript (fast validation)
#   make compile-backend-docker - Build production Docker image
#   make verify-backend     - Check backend build artifacts exist
#   make build-clean        - Clean build artifacts only
# ==============================================================================

.PHONY: compile-backend compile-backend-docker verify-backend build-clean

#------------------------------------------------------------
# Main Build Targets
#------------------------------------------------------------

compile-backend: ## Build backend TypeScript locally
	$(call print_header,Building Backend TypeScript)
	$(call print_subsection,📦 Compiling TypeScript → JavaScript)
	@cd backend && npm run build && npm run type-check
	$(call blank_line)
	$(call print_success,Backend build successful)
	$(call print_subsection,📂 Artifacts: backend/dist/)

compile-backend-docker: ## Build production backend Docker image
	$(call print_header,Building Production Backend Docker Image)
	$(call print_subsection,🐳 Target: production (distroless))
	@docker build -t music-room-backend:latest --target production ./backend
	$(call blank_line)
	$(call print_success,Production image built: music-room-backend:latest)

#------------------------------------------------------------
# Build Verification
#------------------------------------------------------------

verify-backend: ## Check backend build artifacts exist
	$(call print_header,Verifying Backend Build Artifacts)
	@test -f backend/dist/server.js || { \
		$(call print_error,Backend build artifact missing: backend/dist/server.js); \
		echo "$(YELLOW)$(ICON_WARNING) Run: make compile-backend$(NC)"; \
		exit 1; \
	}
	@test -d backend/dist/features || { \
		$(call print_error,Backend features missing: backend/dist/features/); \
		echo "$(YELLOW)$(ICON_WARNING) Run: make compile-backend$(NC)"; \
		exit 1; \
	}
	$(call blank_line)
	$(call print_success,Backend artifacts verified)
	@echo "   ✓ backend/dist/server.js"
	@echo "   ✓ backend/dist/features/"

#------------------------------------------------------------
# Cleanup
#------------------------------------------------------------

build-clean: ## Clean build artifacts only
	$(call print_header,Cleaning Build Artifacts)
	@rm -rf backend/dist
	@rm -rf backend/*.tsbuildinfo
	$(call blank_line)
	$(call print_success,Build artifacts cleaned)
	@echo "   ✓ backend/dist/ removed"
	@echo "   ✓ *.tsbuildinfo removed"

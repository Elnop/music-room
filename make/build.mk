# ==============================================================================
# Build Commands Module
# ==============================================================================
# Provides backend TypeScript compilation
#
# Usage:
#   make compile-backend    - Build backend TypeScript (fast validation)
# ==============================================================================

.PHONY: compile-backend

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

# ==============================================================================
# Supabase Commands
# ==============================================================================
# Commands for Supabase CLI operations and type generation

.PHONY: supabase-login generate-types supabase-status

supabase-login: ## Login to Supabase CLI (required for type generation)
	$(call print_header,Supabase CLI Login)
	$(call print_arrow,Opening Supabase authentication...)
	$(call blank_line)
	@echo "$(YELLOW)You'll need a Personal Access Token from:$(NC)"
	@echo "$(BLUE)https://supabase.com/dashboard/account/tokens$(NC)"
	$(call blank_line)
	@cd backend && npx supabase login
	$(call blank_line)
	$(call print_success,Successfully logged in to Supabase!)
	$(call print_arrow,You can now run: make generate-types)

generate-types: ## Generate TypeScript types from Supabase schema (backend)
	$(call print_header,Generating Supabase Types)
	@if [ ! -f backend/.env ]; then \
		$(call print_error,.env file not found in backend/); \
		$(call print_arrow,Run: make install); \
		exit 1; \
	fi
	@PROJECT_ID=$$(grep SUPABASE_PROJECT_ID backend/.env | cut -d '=' -f2); \
	if [ -z "$$PROJECT_ID" ] || [ "$$PROJECT_ID" = "your-project-id" ]; then \
		$(call print_error,SUPABASE_PROJECT_ID not configured in backend/.env); \
		$(call blank_line); \
		$(call print_arrow,Add your project ID to backend/.env:); \
		echo "  SUPABASE_PROJECT_ID=your-project-id"; \
		$(call blank_line); \
		$(call print_arrow,Find it in your Supabase dashboard URL:); \
		echo "  https://supabase.com/dashboard/project/YOUR_PROJECT_ID"; \
		exit 1; \
	fi
	$(call print_arrow,Checking authentication...)
	@cd backend && npx supabase projects list > /dev/null 2>&1 || \
		(echo "$(RED)$(ICON_ERROR) Not authenticated with Supabase$(NC)"; \
		echo ""; \
		echo "$(YELLOW)$(ICON_ARROW) Please login first:$(NC)"; \
		echo "  $(GREEN)make supabase-login$(NC)"; \
		echo ""; \
		echo "$(YELLOW)You'll need a Personal Access Token from:$(NC)"; \
		echo "$(BLUE)https://supabase.com/dashboard/account/tokens$(NC)"; \
		exit 1)
	$(call print_arrow,Generating types for project: $$PROJECT_ID...)
	@PROJECT_ID=$$(grep SUPABASE_PROJECT_ID backend/.env | cut -d '=' -f2); \
	cd backend && npx supabase gen types typescript --project-id "$$PROJECT_ID" --schema public > src/shared/types/supabase.generated.ts
	$(call blank_line)
	$(call print_success,Types generated successfully)
	$(call print_arrow,Generated file: backend/src/shared/types/supabase.generated.ts)
	$(call print_arrow,Next step: git add backend/src/shared/types/supabase.generated.ts)

supabase-status: ## Check Supabase CLI authentication status
	$(call print_header,Supabase CLI Status)
	@cd backend && npx supabase --version 2>/dev/null && \
		(echo "$(GREEN)✓ Supabase CLI installed$(NC)"; \
		echo ""; \
		npx supabase projects list 2>/dev/null && \
		echo "$(GREEN)✓ Authenticated$(NC)" || \
		echo "$(YELLOW)⚠ Not authenticated - run: make supabase-login$(NC)") || \
		echo "$(RED)✗ Supabase CLI not installed$(NC)"

# ==============================================================================
# Supabase Commands
# ==============================================================================
# Commands for Supabase CLI operations and type generation

.PHONY: supabase-login generate-types supabase-status supabase-up supabase-down supabase-reset

supabase-up: ## Start the local dev Supabase stack (music-room-dev, ports 544xx) and apply new migrations
	$(call print_header,Local Supabase (music-room-dev))
	@cd $(BACKEND_DIR) && sh scripts/dev-db.sh up

supabase-down: ## Stop the local dev Supabase stack (its data is kept)
	@cd $(BACKEND_DIR) && sh scripts/dev-db.sh down

supabase-reset: ## Empty the local dev Supabase database and apply every migration again
	$(call print_header,Resetting Local Supabase (music-room-dev))
	@cd $(BACKEND_DIR) && sh scripts/dev-db.sh reset

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

ifeq ($(SUPABASE_MODE),local)
# Local mode: types from the dev stack, with backend/migrations applied first.
# No login and no project ID: the CLI reads the local database. Prettier gives
# the file the committed formatting, so the diff shows only schema drift.
generate-types: supabase-up ## Generate TypeScript types from the Supabase schema (dev stack, or hosted with SUPABASE_MODE=hosted)
	$(call print_header,Generating Supabase Types (local dev stack))
	@cd $(BACKEND_DIR) && SUPABASE_PROJECT_ID=music-room-dev npx supabase gen types typescript --local --workdir supabase-dev --schema public > src/shared/types/supabase.generated.ts.tmp \
		&& mv src/shared/types/supabase.generated.ts.tmp src/shared/types/supabase.generated.ts \
		&& npx prettier --log-level warn --write src/shared/types/supabase.generated.ts \
		|| { rm -f src/shared/types/supabase.generated.ts.tmp; exit 1; }
	$(call blank_line)
	$(call print_success,Types generated successfully)
	@if git diff --quiet -- backend/src/shared/types/supabase.generated.ts; then \
		echo "$(GREEN)$(ICON_SUCCESS) No drift: backend/src/shared/types/supabase.generated.ts is unchanged$(NC)"; \
	else \
		echo "$(YELLOW)$(ICON_WARNING) Drift: the schema differs from the committed types$(NC)"; \
		git --no-pager diff --stat -- backend/src/shared/types/supabase.generated.ts; \
		echo "$(BLUE)$(ICON_ARROW) Review it with git diff, then git add backend/src/shared/types/supabase.generated.ts$(NC)"; \
	fi
else
generate-types: ## Generate TypeScript types from the Supabase schema (dev stack, or hosted with SUPABASE_MODE=hosted)
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
endif

supabase-status: ## Check Supabase CLI authentication status
	$(call print_header,Supabase CLI Status)
	@cd backend && npx supabase --version 2>/dev/null && \
		(echo "$(GREEN)✓ Supabase CLI installed$(NC)"; \
		echo ""; \
		npx supabase projects list 2>/dev/null && \
		echo "$(GREEN)✓ Authenticated$(NC)" || \
		echo "$(YELLOW)⚠ Not authenticated - run: make supabase-login$(NC)") || \
		echo "$(RED)✗ Supabase CLI not installed$(NC)"

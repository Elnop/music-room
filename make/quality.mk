# ==============================================================================
# Code Quality Commands
# ==============================================================================
# Commands for testing, linting, and formatting code

.PHONY: test test-int test-db-up test-db-down lint format lint-fix

test: ## Run all tests (backend)
	$(call print_info,Running backend tests...)
	$(call npm_safe,backend,test,No tests configured)
	$(call print_success,All tests completed)

test-int: test-db-up ## Run backend integration tests on the local Supabase stack
	$(call print_arrow,Running backend integration tests...)
	$(call npm_backend,run test:int)
	$(call print_success,Integration tests passed)

test-db-up: ## Start the local Supabase stack for integration tests (fresh database)
	$(call print_arrow,Starting local Supabase stack and applying migrations...)
	@cd $(BACKEND_DIR) && sh scripts/test-db.sh up

test-db-down: ## Stop the local Supabase stack used by integration tests
	@cd $(BACKEND_DIR) && sh scripts/test-db.sh down

lint: ## Run linters on all code
	$(call print_header,Running Linters)
	$(call print_arrow,Linting backend...)
	$(call npm_safe,backend,lint,Backend linting not configured)
	$(call blank_line)
	$(call print_arrow,Linting mobile...)
	$(call npm_safe,mobile,lint,Mobile linting not configured)
	$(call print_success,Linting complete)

format: ## Format all code with prettier
	$(call print_header,Formatting Code)
	$(call print_arrow,Formatting backend...)
	$(call npm_safe,backend,format,Backend formatting not configured)
	$(call blank_line)
	$(call print_arrow,Formatting mobile...)
	$(call npm_safe,mobile,format,Mobile formatting not configured)
	$(call print_success,Formatting complete)

lint-fix: ## Auto-fix linting issues in all code
	$(call print_header,Auto-fixing Lint Issues)
	$(call print_arrow,Auto-fixing backend...)
	$(call npm_safe,backend,lint:fix,Backend lint:fix failed)
	$(call blank_line)
	$(call print_arrow,Auto-fixing mobile...)
	$(call npm_safe,mobile,lint:fix,Mobile lint:fix failed)
	$(call print_success,Lint auto-fix complete)

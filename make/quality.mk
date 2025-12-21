# ==============================================================================
# Code Quality Commands
# ==============================================================================
# Commands for testing, linting, and formatting code

.PHONY: test test-backend lint format lint-fix

test: test-backend ## Run all tests (backend)
	$(call print_success,All tests completed)

test-backend: ## Run backend tests
	$(call print_info,Running backend tests...)
	$(call npm_safe,backend,test,No tests configured)

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

# ==============================================================================
# Code Quality Commands
# ==============================================================================
# Commands for testing, linting, and formatting code

.PHONY: test lint format lint-fix

test: ## Run backend and mobile tests (fails on any failure)
	$(call print_header,Running Tests)
	$(call print_arrow,Testing backend...)
	$(call npm_backend,test)
	$(call blank_line)
	$(call print_arrow,Testing mobile...)
	$(call npm_mobile,test)
	$(call print_success,All tests passed)

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

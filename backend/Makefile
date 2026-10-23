.PHONY: help install dev build start clean migrate-create migrate-up migrate-down

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

# Same default as the root Makefile (make/config.mk), which exports it.
SUPABASE_MODE ?= local

help: ## Show this help message
	@echo "$(BLUE)Zumik Backend - Available Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Install dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	npm install

dev: ## Run development server with hot reload
	@echo "$(BLUE)Starting development server...$(NC)"
	npm run dev

build: ## Build TypeScript for production
	@echo "$(BLUE)Building for production...$(NC)"
	npm run build

start: ## Start production server (requires build first)
	@echo "$(BLUE)Starting production server...$(NC)"
	npm start

type-check: ## Run TypeScript type checking
	@echo "$(BLUE)Running type check...$(NC)"
	npm run type-check

clean: ## Clean build artifacts and dependencies
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	rm -rf dist node_modules package-lock.json

migrate-create: ## Create the next numbered migration file, NNN_<name>.sql (usage: make migrate-create name=migration_name)
	@if [ -z "$(name)" ]; then \
		echo "$(YELLOW)Error: Migration name is required$(NC)"; \
		echo "Usage: make migrate-create name=your_migration_name"; \
		exit 1; \
	fi
	@if ! printf '%s' "$(name)" | grep -qE '^[a-z0-9_]+$$'; then \
		echo "$(YELLOW)Error: use lowercase letters, digits and underscores only (got $(name))$(NC)"; \
		exit 1; \
	fi
	@if ls migrations/*_$(name).sql >/dev/null 2>&1; then \
		echo "$(YELLOW)Error: a migration named $(name) already exists: $$(ls migrations/*_$(name).sql)$(NC)"; \
		exit 1; \
	fi
	@# Migrations apply in file name order (scripts/dev-db.sh): take the
	@# prefix after the highest one.
	@last=$$(ls migrations | sed -n 's/^\([0-9][0-9]*\)_.*\.sql$$/\1/p' | sort -n | tail -n 1); \
	next=$$(printf '%03d' $$(expr "$${last:-0}" + 1)); \
	filename="migrations/$${next}_$(name).sql"; \
	echo "-- =====================================================" > $$filename; \
	echo "-- $${next}: $(name)" >> $$filename; \
	echo "-- =====================================================" >> $$filename; \
	echo "" >> $$filename; \
	echo "$(GREEN)Created: $$filename$(NC)"

.PHONY: setup
setup: ## Initial setup (install + create .env)
	@echo "$(BLUE)Running initial setup...$(NC)"
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(GREEN)Created .env file from .env.example$(NC)"; \
	else \
		echo "$(YELLOW).env file already exists, skipping...$(NC)"; \
	fi
	@$(MAKE) install
	@echo "$(GREEN)✓ Setup complete!$(NC)"
	@echo ""
	@echo "$(BLUE)Supabase mode: $(SUPABASE_MODE)$(NC) (SUPABASE_MODE=local|hosted, see README.md)"
	@echo "$(BLUE)Next steps:$(NC)"
ifeq ($(SUPABASE_MODE),local)
	@echo "1. From the repository root: make supabase-up (local stack and migrations, no hosted keys needed)"
	@echo "2. Optional: make supabase-reset loads the demo accounts (doc/development/demo-accounts.md)"
	@echo "3. From the repository root: make dev"
else
	@echo "1. Edit .env and add your hosted Supabase credentials (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY)"
	@echo "2. Apply each file of migrations/ in the Supabase dashboard (SQL Editor)"
	@echo "3. From the repository root: SUPABASE_MODE=hosted make dev"
endif

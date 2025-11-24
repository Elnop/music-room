.PHONY: help install dev build start clean migrate-create migrate-up migrate-down

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Music Room Backend - Available Commands$(NC)"
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

migrate-create: ## Create a new migration file (usage: make migrate-create name=migration_name)
	@if [ -z "$(name)" ]; then \
		echo "$(YELLOW)Error: Migration name is required$(NC)"; \
		echo "Usage: make migrate-create name=your_migration_name"; \
		exit 1; \
	fi
	@echo "$(BLUE)Creating migration: $(name)$(NC)"
	@timestamp=$$(date +%Y%m%d%H%M%S); \
	filename="migrations/$${timestamp}_$(name).sql"; \
	echo "-- Migration: $(name)" > $$filename; \
	echo "-- Created: $$(date)" >> $$filename; \
	echo "" >> $$filename; \
	echo "-- Add your SQL here" >> $$filename; \
	echo "" >> $$filename; \
	echo "$(GREEN)Created: $$filename$(NC)"

.PHONY: setup
setup: ## Initial setup (install + create .env)
	@echo "$(BLUE)Running initial setup...$(NC)"
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(GREEN)Created .env file from .env.example$(NC)"; \
		echo "$(YELLOW)⚠️  Please edit .env and add your Supabase credentials$(NC)"; \
	else \
		echo "$(YELLOW).env file already exists, skipping...$(NC)"; \
	fi
	@$(MAKE) install
	@echo "$(GREEN)✓ Setup complete!$(NC)"
	@echo ""
	@echo "$(BLUE)Next steps:$(NC)"
	@echo "1. Edit .env and add your Supabase credentials"
	@echo "2. Run the migration in Supabase Dashboard (migrations/001_initial_schema.sql)"
	@echo "3. Run: make dev"

# ==============================================================================
# Backend Standalone Management
# ==============================================================================
# Commands for managing backend independently
# Simple and predictable - no conditional logic

# ==============================================================================
# Core Commands
# ==============================================================================

# Start Backend (Docker mode)
.PHONY: backend-docker
backend-docker:
	$(SUPABASE_UP_IF_LOCAL)
	@$(call display_step,"Starting backend container...")
	@$(call start_backend)
	@echo ""
	@echo "$(GREEN)$(ICON_SUCCESS) Backend is running$(RESET)"
	@echo "$(CYAN)API:$(RESET)          http://localhost:$(BACKEND_PORT)"
	@echo "$(CYAN)Health:$(RESET)       http://localhost:$(BACKEND_PORT)/health"
	@echo "$(CYAN)API Docs:$(RESET)     http://localhost:$(BACKEND_PORT)/api-docs"
	@echo ""
	@echo "$(YELLOW)$(ICON_INFO) Redis is separate - start with: make redis-start$(RESET)"
	@echo "$(YELLOW)$(ICON_INFO) View logs with: make backend-logs$(RESET)"

# Start Backend (Local mode - npm run dev)
.PHONY: backend-local
backend-local: .ensure-backend-deps
	@$(call display_step,"Starting backend locally (npm run dev)...")
	@echo "$(YELLOW)$(ICON_INFO) Starting backend on http://localhost:$(BACKEND_PORT)$(RESET)"
	@echo "$(YELLOW)$(ICON_INFO) Press Ctrl+C to stop$(RESET)"
	@echo ""
	$(SUPABASE_UP_IF_LOCAL)
	@cd $(BACKEND_DIR) && $(LOCAL_SUPABASE_ENV) npm run dev

# Stop Backend
.PHONY: backend-stop
backend-stop:
	@$(call display_step,"Stopping backend container...")
	@if [ "$(call container_exists,$(BACKEND_CONTAINER))" = "true" ]; then \
		docker stop $(BACKEND_CONTAINER) 2>/dev/null || true; \
		docker rm $(BACKEND_CONTAINER) 2>/dev/null || true; \
		echo "$(GREEN)$(ICON_SUCCESS) Backend stopped$(RESET)"; \
	else \
		echo "$(YELLOW)$(ICON_WARNING) Backend container not found$(RESET)"; \
	fi

# Restart Backend
.PHONY: backend-restart
backend-restart:
	@$(call display_step,"Restarting backend container...")
	@if [ "$(call container_exists,$(BACKEND_CONTAINER))" = "true" ]; then \
		docker restart $(BACKEND_CONTAINER) 2>/dev/null || { \
			echo "$(RED)$(ICON_ERROR) Failed to restart backend$(RESET)"; \
			exit 1; \
		}; \
		echo "$(GREEN)$(ICON_SUCCESS) Backend restarted$(RESET)"; \
	else \
		echo "$(YELLOW)$(ICON_WARNING) Backend container not found$(RESET)"; \
		echo "$(YELLOW)$(ICON_INFO) Use 'make backend-docker' to start$(RESET)"; \
	fi

# ==============================================================================
# Monitoring & Logs
# ==============================================================================

# View Backend logs
.PHONY: backend-logs
backend-logs:
	@$(call display_step,"Backend logs (Ctrl+C to exit)...")
	@docker logs -f $(BACKEND_CONTAINER)

# Check Backend health
.PHONY: backend-health
backend-health:
	@$(call display_step,"Checking backend health...")
	@if [ "$(call container_running,$(BACKEND_CONTAINER))" = "true" ]; then \
		echo "$(GREEN)$(ICON_SUCCESS) Container is running$(RESET)"; \
		echo "$(CYAN)Testing /health endpoint...$(RESET)"; \
		curl -s http://localhost:$(BACKEND_PORT)/health | jq . || \
		curl -s http://localhost:$(BACKEND_PORT)/health || \
		echo "$(YELLOW)$(ICON_WARNING) Health endpoint not responding$(RESET)"; \
	else \
		echo "$(RED)$(ICON_ERROR) Backend container not running$(RESET)"; \
		exit 1; \
	fi

# Backend status (quick check)
.PHONY: backend-status
backend-status:
	@$(call display_step,"Backend status...")
	@if [ "$(call container_running,$(BACKEND_CONTAINER))" = "true" ]; then \
		echo "$(GREEN)$(ICON_SUCCESS) Running$(RESET)"; \
		docker ps --filter "name=$(BACKEND_CONTAINER)" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"; \
	elif [ "$(call container_exists,$(BACKEND_CONTAINER))" = "true" ]; then \
		echo "$(YELLOW)$(ICON_WARNING) Stopped$(RESET)"; \
		docker ps -a --filter "name=$(BACKEND_CONTAINER)" --format "table {{.Names}}\t{{.Status}}"; \
	else \
		echo "$(RED)$(ICON_ERROR) Not found$(RESET)"; \
	fi

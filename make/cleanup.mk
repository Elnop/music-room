# ==============================================================================
# Cleanup Commands
# ==============================================================================
# Commands for cleaning Docker resources, dependencies, and build artifacts

.PHONY: clean clean-docker clean-all prune clean-global-cache clean-gradle clean-project

clean: ## Remove containers, volumes, images, and project dependencies (with confirmation)
	@echo "$(BOLD)$(YELLOW)This will remove:$(RESET)"
	@echo "  - Zumik Docker containers, images, and volumes"
	@echo "  - The dev Supabase stack and its data (make supabase-up starts an empty one)"
	@echo "  - node_modules (backend + mobile)"
	@echo "  - Build artifacts (dist, .expo)"
	@echo "  - Coverage reports"
	@echo "  - Build logs"
	@echo ""
	@printf "Continue? (y/n): "; \
	read confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		echo "$(CYAN)Stopping and removing containers + volumes...$(RESET)"; \
		docker stop $(BACKEND_CONTAINER) $(MOBILE_CONTAINER) $(REDIS_CONTAINER) 2>/dev/null || true; \
		docker rm $(BACKEND_CONTAINER) $(MOBILE_CONTAINER) $(REDIS_CONTAINER) 2>/dev/null || true; \
		docker volume rm $(TUNNEL_VOLUME) $(REDIS_VOLUME) 2>/dev/null || true; \
		echo "$(GREEN)✓ Containers and volumes removed$(RESET)"; \
		docker rmi music-room-backend:latest music-room-mobile:latest 2>/dev/null || true; \
		docker network rm $(DOCKER_NETWORK) 2>/dev/null || true; \
		$(SUPABASE_DEV_REMOVE); \
		echo "$(GREEN)✓ Dev Supabase stack and its data removed$(RESET)"; \
		docker run --rm -v $(PWD):/workspace alpine sh -c "rm -rf /workspace/backend/node_modules /workspace/mobile/node_modules /workspace/mobile/.expo /workspace/mobile/android /workspace/mobile/ios /workspace/backend/logs" 2>/dev/null || true; \
		rm -rf backend/dist build 2>/dev/null || true; \
		rm -rf backend/coverage mobile/coverage 2>/dev/null || true; \
		rm -f /tmp/ngrok.log 2>/dev/null || true; \
		rm -rf /tmp/shared 2>/dev/null || true; \
		find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true; \
		find mobile -name ".eas-build-*.json" -type f -delete 2>/dev/null || true; \
		echo "$(BOLD)$(GREEN)✓ Cleanup complete$(RESET)"; \
	else \
		echo "$(YELLOW)Cancelled.$(RESET)"; \
	fi

clean-docker: ## Remove Zumik Docker resources only (containers, images, volumes, network), dev Supabase stack and its data included
	@echo "$(CYAN)Removing Zumik Docker resources...$(RESET)"
	@docker stop $(BACKEND_CONTAINER) $(MOBILE_CONTAINER) $(REDIS_CONTAINER) 2>/dev/null || true
	@docker rm $(BACKEND_CONTAINER) $(MOBILE_CONTAINER) $(REDIS_CONTAINER) 2>/dev/null || true
	@docker volume rm $(TUNNEL_VOLUME) $(REDIS_VOLUME) 2>/dev/null || true
	@docker rmi music-room-backend:latest music-room-mobile:latest 2>/dev/null || true
	@docker network rm $(DOCKER_NETWORK) 2>/dev/null || true
	@$(SUPABASE_DEV_REMOVE)
	@echo "$(GREEN)✓ Docker resources removed (dev Supabase stack and its data included)$(RESET)"

clean-all: ## Complete cleanup - Docker system + project artifacts + global caches
	@echo "$(BOLD)$(RED)⚠️  COMPLETE CLEANUP - THIS WILL REMOVE EVERYTHING!$(RESET)"
	@echo "$(YELLOW)This will remove:$(RESET)"
	@echo "  - Redis container and data volume"
	@echo "  - ALL Docker resources on this machine (containers, images, volumes, networks, cache)"
	@echo "  - ALL node_modules and build artifacts (backend + mobile)"
	@echo "  - ALL project caches (coverage, logs, .expo, native builds, etc.)"
	@echo "  - ALL global caches (Expo, Metro, Watchman, Gradle)"
	@echo ""
	@echo "$(RED)Starting complete cleanup...$(RESET)"
	@echo "$(CYAN)Step 1/6: Stopping all Docker containers...$(RESET)"
	@containers=$$(docker ps -aq 2>/dev/null); \
	if [ -n "$$containers" ]; then docker stop $$containers 2>/dev/null || true; fi
	@echo "$(CYAN)Step 2/6: Removing Redis resources...$(RESET)"
	@docker stop $(REDIS_CONTAINER_NAME) 2>/dev/null || true
	@docker rm $(REDIS_CONTAINER_NAME) 2>/dev/null || true
	@docker volume rm zumik_$(REDIS_DATA_VOLUME) 2>/dev/null || true
	@echo "$(CYAN)Step 3/6: Removing all Docker resources...$(RESET)"
	@containers=$$(docker ps -aq 2>/dev/null); \
	if [ -n "$$containers" ]; then docker rm $$containers 2>/dev/null || true; fi; \
	images=$$(docker images -aq 2>/dev/null); \
	if [ -n "$$images" ]; then docker rmi -f $$images 2>/dev/null || true; fi; \
	volumes=$$(docker volume ls -q 2>/dev/null); \
	if [ -n "$$volumes" ]; then docker volume rm $$volumes 2>/dev/null || true; fi; \
	docker network prune -f 2>/dev/null || true; \
	docker builder prune -af 2>/dev/null || true; \
	docker system prune -af --volumes 2>/dev/null || true
	@echo "$(CYAN)Step 4/6: Cleaning project artifacts...$(RESET)"
	@docker run --rm -v $(PWD):/workspace alpine sh -c "rm -rf /workspace/backend/node_modules /workspace/mobile/node_modules /workspace/mobile/.expo /workspace/mobile/android /workspace/mobile/ios /workspace/backend/logs" 2>/dev/null || true
	@rm -rf backend/dist build backend/coverage mobile/coverage 2>/dev/null || true
	@rm -f /tmp/ngrok.log 2>/dev/null || true
	@rm -rf /tmp/shared 2>/dev/null || true
	@find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true
	@find mobile -name ".eas-build-*.json" -type f -delete 2>/dev/null || true
	@echo "$(CYAN)Step 5/6: Cleaning global caches...$(RESET)"
	@rm -rf ~/.expo ~/.cache/expo 2>/dev/null || true
	@rm -rf ~/.cache/metro-bundler 2>/dev/null || true
	@rm -rf ~/.watchman 2>/dev/null || true
	@echo "$(CYAN)Step 6/6: Cleaning Gradle caches...$(RESET)"
	@rm -rf ~/.gradle ~/.android/build-cache 2>/dev/null || true
	@echo ""
	@echo "$(BOLD)$(GREEN)✓✓✓ COMPLETE CLEANUP FINISHED ✓✓✓$(RESET)"
	@echo ""
	@echo "$(YELLOW)To restart Zumik:$(RESET)"
	@echo "  1. $(GREEN)make install$(RESET)      - Reinstall dependencies"
	@echo "  2. $(GREEN)make dev-docker$(RESET)   - Start Docker development"

prune: ## Clean up unused Docker resources
	$(call print_arrow,Pruning unused Docker resources...)
	$(call docker_system_prune)
	$(call print_success,Docker resources pruned)

clean-global-cache: ## Remove global caches (Expo, Metro, Watchman) - affects all projects
	@echo "$(BOLD)$(RED)⚠️  WARNING: This will remove GLOBAL caches affecting ALL projects!$(RESET)"
	@echo "$(YELLOW)Caches to be removed:$(RESET)"
	@echo "  - ~/.expo/"
	@echo "  - ~/.cache/expo/"
	@echo "  - ~/.cache/metro-bundler/"
	@echo "  - ~/.watchman/"
	@echo ""
	@echo "$(YELLOW)⚠️  Removing Expo home cache (global, affects all projects)...$(RESET)"
	@rm -rf ~/.expo 2>/dev/null || true
	@rm -rf ~/.cache/expo 2>/dev/null || true
	@echo "$(GREEN)✓ Expo home cache removed$(RESET)"
	@echo "$(YELLOW)⚠️  Removing Metro bundler cache (global)...$(RESET)"
	@rm -rf ~/.cache/metro-bundler 2>/dev/null || true
	@echo "$(GREEN)✓ Metro cache removed$(RESET)"
	@echo "$(YELLOW)⚠️  Removing Watchman cache (global)...$(RESET)"
	@rm -rf ~/.watchman 2>/dev/null || true
	@echo "$(GREEN)✓ Watchman cache removed$(RESET)"
	@echo "$(BOLD)$(GREEN)✓ Global caches cleaned$(RESET)"

clean-gradle: ## Remove Gradle caches (Android builds) - affects all Android projects
	@echo "$(BOLD)$(RED)⚠️  WARNING: This will remove Gradle caches affecting ALL Android projects!$(RESET)"
	@echo "$(YELLOW)Caches to be removed:$(RESET)"
	@echo "  - ~/.gradle/"
	@echo "  - ~/.android/build-cache/"
	@echo ""
	@echo "$(YELLOW)⚠️  Removing Gradle cache (global, affects all Android projects)...$(RESET)"
	@rm -rf ~/.gradle 2>/dev/null || true
	@rm -rf ~/.android/build-cache 2>/dev/null || true
	@echo "$(GREEN)✓ Gradle cache removed$(RESET)"
	@echo "$(BOLD)$(GREEN)✓ Gradle caches cleaned$(RESET)"

clean-project: ## Remove all project artifacts (deps, builds, caches) - no Docker, no global
	@echo "$(BOLD)$(CYAN)Cleaning all project artifacts...$(RESET)"
	@$(call remove_all_project_artifacts)
	@echo "$(BOLD)$(GREEN)✓ Project fully cleaned$(RESET)"

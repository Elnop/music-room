# ==============================================================================
# Cleanup Helper Functions
# ==============================================================================
# Reusable functions for cleanup operations

# Remove all node_modules
# Usage: $(call remove_node_modules)
define remove_node_modules
	@docker run --rm -v $(PWD):/workspace alpine sh -c "rm -rf /workspace/backend/node_modules /workspace/mobile/node_modules" 2>/dev/null || true
endef

# Remove build artifacts
# Usage: $(call remove_build_artifacts)
define remove_build_artifacts
	@docker run --rm -v $(PWD):/workspace alpine sh -c "rm -rf /workspace/mobile/.expo" 2>/dev/null || true
	@rm -rf $(BACKEND_DIST) build 2>/dev/null || true
endef

# Remove native build folders
# Usage: $(call remove_native_builds)
define remove_native_builds
	@docker run --rm -v $(PWD):/workspace alpine sh -c "rm -rf /workspace/mobile/android /workspace/mobile/ios" 2>/dev/null || true
	@rm -rf $(MOBILE_EXPO) 2>/dev/null || true
endef

# Delete the dev Supabase stack and its data (containers, volumes, network),
# found by label so it works in both modes and without node_modules. Shell
# commands with no leading @, to use inside a recipe line.
# Usage: $(SUPABASE_DEV_REMOVE)
SUPABASE_DEV_REMOVE = \
	docker rm -f $$(docker ps -aq --filter label=$(SUPABASE_DEV_LABEL)) >/dev/null 2>&1 || true; \
	docker volume rm $$(docker volume ls -q --filter label=$(SUPABASE_DEV_LABEL)) >/dev/null 2>&1 || true; \
	docker network rm $$(docker network ls -q --filter label=$(SUPABASE_DEV_LABEL)) >/dev/null 2>&1 || true

# Remove all dependencies and builds
# Usage: $(call remove_all_deps)
define remove_all_deps
	$(call remove_node_modules)
	$(call remove_build_artifacts)
endef

# Docker: Stop all containers on machine
# Usage: $(call docker_stop_all_containers)
# Improved: handles empty container list on both Linux and macOS
define docker_stop_all_containers
	@containers=$$(docker ps -aq 2>/dev/null); \
	if [ -n "$$containers" ]; then \
		docker stop $$containers 2>/dev/null || true; \
	fi
endef

# Docker: Remove all containers on machine
# Usage: $(call docker_rm_all_containers)
# Improved: handles empty container list on both Linux and macOS
define docker_rm_all_containers
	@containers=$$(docker ps -aq 2>/dev/null); \
	if [ -n "$$containers" ]; then \
		docker rm $$containers 2>/dev/null || true; \
	fi
endef

# Docker: Remove all images on machine
# Usage: $(call docker_rmi_all_images)
# Improved: handles empty image list on both Linux and macOS
define docker_rmi_all_images
	@images=$$(docker images -aq 2>/dev/null); \
	if [ -n "$$images" ]; then \
		docker rmi -f $$images 2>/dev/null || true; \
	fi
endef

# Docker: Remove all volumes on machine
# Usage: $(call docker_volume_rm_all)
# Improved: handles empty volume list on both Linux and macOS
define docker_volume_rm_all
	@volumes=$$(docker volume ls -q 2>/dev/null); \
	if [ -n "$$volumes" ]; then \
		docker volume rm $$volumes 2>/dev/null || true; \
	fi
endef

# Docker: Prune networks
# Usage: $(call docker_network_prune)
define docker_network_prune
	@docker network prune -f 2>/dev/null || true
endef

# Docker: Prune builder cache
# Usage: $(call docker_builder_prune)
define docker_builder_prune
	@docker builder prune -af 2>/dev/null || true
endef

# Docker: Full system prune
# Usage: $(call docker_system_prune_full)
define docker_system_prune_full
	@docker system prune -af --volumes 2>/dev/null || true
endef

# Docker: Simple system prune
# Usage: $(call docker_system_prune)
define docker_system_prune
	@docker system prune -f
endef

# Complete Docker cleanup sequence
# Usage: $(call docker_full_cleanup)
define docker_full_cleanup
	$(call docker_stop_all_containers)
	$(call docker_rm_all_containers)
	$(call docker_rmi_all_images)
	$(call docker_volume_rm_all)
	$(call docker_network_prune)
	$(call docker_builder_prune)
	$(call docker_system_prune_full)
endef

# Remove test coverage reports
# Usage: $(call remove_coverage)
define remove_coverage
	@echo "$(CYAN)Removing test coverage reports...$(RESET)"
	@rm -rf backend/coverage mobile/coverage 2>/dev/null || true
	@echo "$(GREEN)✓ Coverage reports removed$(RESET)"
endef

# Remove build logs
# Usage: $(call remove_build_logs)
define remove_build_logs
	@echo "$(CYAN)Removing build logs...$(RESET)"
	@rm -f /tmp/ngrok.log 2>/dev/null || true
	@rm -rf /tmp/shared 2>/dev/null || true
	@rm -rf backend/logs 2>/dev/null || true
	@echo "$(GREEN)✓ Build logs removed$(RESET)"
endef

# Remove TypeScript build info
# Usage: $(call remove_ts_buildinfo)
define remove_ts_buildinfo
	@echo "$(CYAN)Removing TypeScript build info...$(RESET)"
	@find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true
	@echo "$(GREEN)✓ TypeScript build info removed$(RESET)"
endef

# Remove EAS build artifacts
# Usage: $(call remove_eas_artifacts)
define remove_eas_artifacts
	@echo "$(CYAN)Removing EAS build artifacts...$(RESET)"
	@find mobile -name ".eas-build-*.json" -type f -delete 2>/dev/null || true
	@rm -rf mobile/eas-build-*.log 2>/dev/null || true
	@echo "$(GREEN)✓ EAS artifacts removed$(RESET)"
endef

# Remove Expo home cache (global)
# Usage: $(call remove_expo_home_cache)
define remove_expo_home_cache
	@echo "$(YELLOW)⚠️  Removing Expo home cache (global, affects all projects)...$(RESET)"
	@rm -rf ~/.expo 2>/dev/null || true
	@rm -rf ~/.cache/expo 2>/dev/null || true
	@echo "$(GREEN)✓ Expo home cache removed$(RESET)"
endef

# Remove Metro bundler cache (global)
# Usage: $(call remove_metro_cache)
define remove_metro_cache
	@echo "$(YELLOW)⚠️  Removing Metro bundler cache (global)...$(RESET)"
	@rm -rf ~/.cache/metro-bundler 2>/dev/null || true
	@echo "$(GREEN)✓ Metro cache removed$(RESET)"
endef

# Remove Watchman cache (global)
# Usage: $(call remove_watchman_cache)
define remove_watchman_cache
	@echo "$(YELLOW)⚠️  Removing Watchman cache (global)...$(RESET)"
	@rm -rf ~/.watchman 2>/dev/null || true
	@echo "$(GREEN)✓ Watchman cache removed$(RESET)"
endef

# Remove Gradle cache (global)
# Usage: $(call remove_gradle_cache)
define remove_gradle_cache
	@echo "$(YELLOW)⚠️  Removing Gradle cache (global, affects all Android projects)...$(RESET)"
	@rm -rf ~/.gradle 2>/dev/null || true
	@rm -rf ~/.android/build-cache 2>/dev/null || true
	@echo "$(GREEN)✓ Gradle cache removed$(RESET)"
endef

# Master project-only cleanup
# Usage: $(call remove_all_project_artifacts)
define remove_all_project_artifacts
	$(call remove_node_modules)
	$(call remove_build_artifacts)
	$(call remove_native_builds)
	$(call remove_coverage)
	$(call remove_build_logs)
	$(call remove_ts_buildinfo)
	$(call remove_eas_artifacts)
endef

# Master full cleanup (project + global caches)
# Usage: $(call remove_all_artifacts_with_caches)
define remove_all_artifacts_with_caches
	$(call remove_all_project_artifacts)
	$(call remove_expo_home_cache)
	$(call remove_metro_cache)
	$(call remove_watchman_cache)
endef

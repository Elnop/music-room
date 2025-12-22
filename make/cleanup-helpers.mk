# ==============================================================================
# Cleanup Helper Functions
# ==============================================================================
# Reusable functions for cleanup operations

# Remove all node_modules
# Usage: $(call remove_node_modules)
define remove_node_modules
	@rm -rf $(BACKEND_NODE_MODULES) $(MOBILE_NODE_MODULES)
endef

# Remove build artifacts
# Usage: $(call remove_build_artifacts)
define remove_build_artifacts
	@rm -rf $(BACKEND_DIST) $(MOBILE_EXPO)
endef

# Remove native build folders
# Usage: $(call remove_native_builds)
define remove_native_builds
	@rm -rf $(MOBILE_DIR)/android $(MOBILE_DIR)/ios $(MOBILE_EXPO)
endef

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

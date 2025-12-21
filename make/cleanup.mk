# ==============================================================================
# Cleanup Commands
# ==============================================================================
# Commands for cleaning Docker resources, dependencies, and build artifacts

.PHONY: clean clean-docker clean-deps clean-all prune deploy-build

clean: ## Remove all containers, images, volumes, and dependencies (with confirmation)
	@echo "$(RED)=== CLEANUP WARNING ===$(NC)"
	@echo ""
	$(call print_subsection,This will remove)
	@echo "  • Docker containers (music-room-backend, music-room-mobile)"
	@echo "  • Docker images (music_room-backend, music_room-mobile)"
	@echo "  • Docker volumes"
	@echo "  • Docker network (music-room-network)"
	@echo "  • $(BACKEND_NODE_MODULES)"
	@echo "  • $(MOBILE_NODE_MODULES)"
	@echo "  • $(BACKEND_DIST)"
	@echo "  • $(MOBILE_EXPO)"
	@echo ""
	@printf "$(RED)Are you sure? [y/N]$(NC) "; \
	read REPLY; \
	if [ "$$REPLY" = "y" ] || [ "$$REPLY" = "Y" ]; then \
		echo ""; \
		echo "$(YELLOW)$(ICON_ARROW) Removing Docker resources...$(NC)"; \
		$(call docker_down_volumes); \
		echo "$(GREEN)$(ICON_SUCCESS) Docker resources removed$(NC)"; \
		echo "$(YELLOW)$(ICON_ARROW) Removing node_modules...$(NC)"; \
		$(call remove_node_modules); \
		echo "$(GREEN)$(ICON_SUCCESS) Dependencies removed$(NC)"; \
		echo "$(YELLOW)$(ICON_ARROW) Removing build artifacts...$(NC)"; \
		$(call remove_build_artifacts); \
		echo "$(GREEN)$(ICON_SUCCESS) Build artifacts removed$(NC)"; \
		echo ""; \
		echo ""; \
		echo "$(BLUE)=== Cleanup Complete ===$(NC)"; \
		echo ""; \
		echo "$(BLUE)$(ICON_INFO) Run 'make install' to reinstall$(NC)"; \
	else \
		echo ""; \
		echo "$(BLUE)$(ICON_INFO) Cleanup cancelled$(NC)"; \
	fi

clean-docker: ## Remove only Docker containers, images, and volumes (no confirmation)
	$(call print_arrow,Removing Docker resources...)
	$(call docker_down_volumes)
	$(call print_success,Docker cleanup complete)

clean-deps: ## Remove only node_modules and build artifacts (no confirmation)
	$(call print_arrow,Removing dependencies and build artifacts...)
	$(call remove_all_deps)
	$(call print_success,Dependencies cleanup complete)

clean-all: ## Clean entire Docker system on machine (containers, images, volumes, networks, cache)
	@echo "$(RED)=== FULL DOCKER SYSTEM CLEANUP WARNING ===$(NC)"
	$(call blank_line)
	$(call print_warning,This removes ALL Docker resources on your machine:)
	@echo "  • ALL containers (not just Music Room)"
	@echo "  • ALL images (not just Music Room)"
	@echo "  • ALL volumes (not just Music Room)"
	@echo "  • ALL custom networks"
	@echo "  • ALL builder cache"
	@echo "  • $(BACKEND_NODE_MODULES) + $(MOBILE_NODE_MODULES)"
	@echo "  • $(BACKEND_DIST) + $(MOBILE_EXPO)"
	$(call blank_line)
	$(call docker_full_cleanup)
	$(call print_header,Full Cleanup Complete)
	$(call print_subsection,To restart Music Room)
	$(call display_next_steps,$(GREEN)make install$(NC)  # Reinstall dependencies,$(GREEN)make dev$(NC)      # Build and start)
	$(call blank_line)

prune: ## Clean up unused Docker resources
	$(call print_arrow,Pruning unused Docker resources...)
	$(call docker_system_prune)
	$(call print_success,Docker resources pruned)

deploy-build: ## Build production images (for deployment)
	$(call print_info,Building production images...)
	@docker build -t music-room-backend:latest --target production ./$(BACKEND_DIR)
	$(call print_success,Production images built)
	@echo ""
	$(call print_subsection,Images ready)
	@echo "  - music-room-backend:latest"

# ==============================================================================
# Docker Environment Commands
# ==============================================================================
# Commands for Docker-based development environment

.PHONY: dev-docker start stop containers-restart down logs logs-backend logs-mobile logs-supabase ps build build-backend build-mobile

dev-docker: ## Start all services in Docker containers (backend + mobile)
	$(call print_header,Starting Zumik Development Environment)
	$(call print_arrow,Building and starting containers...)
	$(call docker_up_build)
	$(call print_success,Services started)
	$(call blank_line)
	$(call display_services,lan)
	$(call blank_line)
	$(call wait_for,Expo,$(EXPO_WAIT_TIME))
	$(call clear_and_header,🚀 Zumik Started)
	$(call display_services,lan)
	$(call blank_line)
	$(call display_metro_connect,lan)
	$(call blank_line)
	$(call display_common_commands,lan)
	$(call blank_line)
	$(call print_success,Ready! Open the Zumik debug build (make open-app on an emulator))
	$(call blank_line)

start: ## Start existing containers (without rebuild)
	$(call print_info,Starting containers...)
	$(call docker_start)
	$(call print_success,Services started)

stop: ## Stop all running containers
	$(call print_arrow,Stopping all services...)
	$(call docker_stop)
	$(call print_success,Services stopped)

containers-restart: ## Restart the backend, mobile and redis containers, and the dev Supabase stack in local mode (no rebuild)
	$(call print_arrow,Restarting all services...)
	$(if $(filter local,$(SUPABASE_MODE)),@$(MAKE) --no-print-directory supabase-down)
	$(SUPABASE_UP_IF_LOCAL)
	$(call docker_restart)
	$(call print_success,Services restarted)

down: ## Stop and remove all containers, networks
	$(call print_arrow,Stopping and removing containers...)
	$(call docker_down)
	$(call print_success,Containers removed)

logs: ## Show logs from all services (ctrl+c to exit)
	$(call print_info,Showing logs (press Ctrl+C to exit)...)
	$(call docker_logs_all)

logs-backend: ## Show backend logs only
	$(call print_info,Backend logs (press Ctrl+C to exit)...)
	$(call docker_logs_service,backend)

logs-supabase: ## Show the dev Supabase stack logs (Postgres, Auth, PostgREST, Kong, Mailpit, Studio)
	$(call print_info,Supabase dev stack logs (press Ctrl+C to exit)...)
	$(call docker_logs_prefixed,$(SUPABASE_DEV_LOG_SOURCES))

logs-mobile: ## Show mobile logs only
	$(call print_info,Mobile logs (press Ctrl+C to exit)...)
	$(call docker_logs_service,mobile)

qr: ## Show how to connect the Zumik debug build to Metro (same WiFi)
	$(call clear_and_header,📱 Connect the App to Metro)
	$(call display_metro_connect,lan)
	$(call blank_line)
	$(call print_warning,Note: a phone over WiFi must be on the same network as this computer)
	@echo "   Your local IP: $(GREEN)$(HOST_IP)$(NC)"
	$(call blank_line)
	@echo "$(YELLOW)💡 Commands:$(NC) $(GREEN)make logs$(NC) | $(GREEN)make stop$(NC) | $(GREEN)make containers-restart$(NC) | $(GREEN)make help$(NC)"
	$(call blank_line)

ps: ## Show status of all containers
	$(call print_info,Container status:)
	$(call docker_ps)

build: ## Build all Docker images
	$(call print_info,Building all Docker images...)
	$(call docker_build_all)
	$(call print_success,All images built)

build-backend: ## Build backend Docker image only
	$(call print_info,Building backend image...)
	$(call build_backend_image)
	$(call print_success,Backend image built)

build-mobile: ## Build mobile Docker image only
	$(call print_info,Building mobile image...)
	$(call build_mobile_image)
	$(call print_success,Mobile image built)

# ==============================================================================
# Docker Environment Commands
# ==============================================================================
# Commands for Docker-based development environment

.PHONY: dev-docker start stop restart down logs logs-mobile ps build build-backend build-mobile

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
	$(call display_qr,lan)
	$(call blank_line)
	$(call display_common_commands,lan)
	$(call blank_line)
	$(call print_success,Ready! Open Expo Go and scan the QR code)
	$(call blank_line)

start: ## Start existing containers (without rebuild)
	$(call print_info,Starting containers...)
	$(call docker_start)
	$(call print_success,Services started)

stop: ## Stop all running containers
	$(call print_arrow,Stopping all services...)
	$(call docker_stop)
	$(call print_success,Services stopped)

restart: ## Restart all services
	$(call print_arrow,Restarting all services...)
	$(call docker_restart)
	$(call print_success,Services restarted)

down: ## Stop and remove all containers, networks
	$(call print_arrow,Stopping and removing containers...)
	$(call docker_down)
	$(call print_success,Containers removed)

logs: ## Show logs from all services (ctrl+c to exit)
	$(call print_info,Showing logs (press Ctrl+C to exit)...)
	$(call docker_logs_all)

logs-mobile: ## Show mobile logs only
	$(call print_info,Mobile logs (press Ctrl+C to exit)...)
	$(call docker_logs_service,mobile)

qr: ## Display Expo QR code and connection URL
	$(call clear_and_header,📱 Expo QR Code)
	$(call display_qr,lan)
	$(call blank_line)
	$(call print_subsection,💡 Instructions)
	@echo "   1. Install $(GREEN)Expo Go$(NC) app (Play Store / App Store)"
	@echo "   2. Open Expo Go and tap $(GREEN)Scan QR Code$(NC)"
	@echo "   3. Point your camera at the QR code above"
	$(call blank_line)
	$(call print_warning,Note: Phone and computer must be on the same WiFi)
	@echo "   Your local IP: $(GREEN)$(HOST_IP)$(NC)"
	$(call blank_line)
	@echo "$(YELLOW)💡 Commands:$(NC) $(GREEN)make logs$(NC) | $(GREEN)make stop$(NC) | $(GREEN)make restart$(NC) | $(GREEN)make help$(NC)"
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

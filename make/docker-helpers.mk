# ==============================================================================
# Docker Compose Helper Functions
# ==============================================================================
# Reusable functions for Docker Compose commands

# Start services with build
# Usage: $(call docker_up_build)
define docker_up_build
	@$(DOCKER_COMPOSE) up -d --build
endef

# Start with tunnel configuration
# Usage: $(call docker_up_tunnel)
define docker_up_tunnel
	@$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.tunnel.yml up -d --build
endef

# Start single service with build
# Usage: $(call docker_up_service,mobile)
define docker_up_service
	@$(DOCKER_COMPOSE) up $(1) -d --build
endef

# Start existing containers (no build)
# Usage: $(call docker_start)
define docker_start
	@$(DOCKER_COMPOSE) start
endef

# Stop all services
# Usage: $(call docker_stop)
define docker_stop
	@$(DOCKER_COMPOSE) stop
endef

# Stop specific service
# Usage: $(call docker_stop_service,mobile)
define docker_stop_service
	@$(DOCKER_COMPOSE) stop $(1)
endef

# Restart all services
# Usage: $(call docker_restart)
define docker_restart
	@$(DOCKER_COMPOSE) restart
endef

# Show all logs (follow mode)
# Usage: $(call docker_logs_all)
define docker_logs_all
	@$(DOCKER_COMPOSE) logs -f
endef

# Show service logs (follow mode)
# Usage: $(call docker_logs_service,backend)
define docker_logs_service
	@$(DOCKER_COMPOSE) logs -f $(1)
endef

# Extract QR code from mobile logs
# Usage: $(call docker_logs_qr)
define docker_logs_qr
	@$(DOCKER_COMPOSE) logs $(MOBILE_SERVICE) 2>/dev/null | grep -B 5 -A 50 "▄▄▄▄▄▄▄" | head -70 || $(DOCKER_COMPOSE) logs $(MOBILE_SERVICE) | tail -60
endef

# Execute command in container
# Usage: $(call docker_exec,backend,npm test)
define docker_exec
	@$(DOCKER_COMPOSE) exec $(1) $(2)
endef

# Execute command with -T flag (no TTY)
# Usage: $(call docker_exec_no_tty,backend,cat /tmp/file)
define docker_exec_no_tty
	@$(DOCKER_COMPOSE) exec -T $(1) $(2)
endef

# Run disposable command in container
# Usage: $(call docker_run_rm,mobile,npx eas whoami)
define docker_run_rm
	@$(DOCKER_COMPOSE) run --rm $(1) $(2)
endef

# Show container status
# Usage: $(call docker_ps)
define docker_ps
	@$(DOCKER_COMPOSE) ps
endef

# Stop and remove containers/networks
# Usage: $(call docker_down)
define docker_down
	@$(DOCKER_COMPOSE) down
endef

# Stop and remove with volumes and images
# Usage: $(call docker_down_full)
define docker_down_full
	@$(DOCKER_COMPOSE) down -v --rmi local 2>/dev/null || true
endef

# Build all images
# Usage: $(call docker_build_all)
define docker_build_all
	@$(DOCKER_COMPOSE) build
endef

# Build single service
# Usage: $(call docker_build_service,backend)
define docker_build_service
	@$(DOCKER_COMPOSE) build $(1)
endef

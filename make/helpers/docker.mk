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

# Stop and remove containers/networks with volumes
# Usage: $(call docker_down_volumes)
define docker_down_volumes
	@echo "$(CYAN)Stopping and removing containers + volumes...$(RESET)"
	@$(DOCKER_COMPOSE) down -v 2>/dev/null || true
	@echo "$(GREEN)✓ Containers and volumes removed$(RESET)"
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

# ==============================================================================
# Redis-Specific Helpers
# ==============================================================================

# Check if Redis container is running
# Usage: $(call is_redis_running)
# Returns: "true" or "false"
define is_redis_running
$(shell docker ps --filter "name=$(REDIS_CONTAINER_NAME)" --filter "status=running" --format "{{.Names}}" 2>/dev/null | grep -q "$(REDIS_CONTAINER_NAME)" && echo "true" || echo "false")
endef

# Check if Redis container exists (running or stopped)
# Usage: $(call redis_exists)
# Returns: "true" or "false"
define redis_exists
$(shell docker ps -a --filter "name=$(REDIS_CONTAINER_NAME)" --format "{{.Names}}" 2>/dev/null | grep -q "$(REDIS_CONTAINER_NAME)" && echo "true" || echo "false")
endef

# Start Redis container (docker-compose up -d redis)
# Usage: $(call ensure_redis_started)
define ensure_redis_started
	@if [ "$(call is_redis_running)" = "true" ]; then \
		echo "$(GREEN)✓$(RESET) Redis is already running"; \
	else \
		echo "$(YELLOW)→$(RESET) Starting Redis container..."; \
		$(DOCKER_COMPOSE) up -d redis; \
		echo "$(GREEN)✓$(RESET) Redis started"; \
	fi
endef

# Stop Redis container
# Usage: $(call stop_redis)
define stop_redis
	@if [ "$(call is_redis_running)" = "true" ]; then \
		echo "$(YELLOW)→$(RESET) Stopping Redis container..."; \
		$(DOCKER_COMPOSE) stop redis; \
		echo "$(GREEN)✓$(RESET) Redis stopped"; \
	else \
		echo "$(YELLOW)⚠$(RESET) Redis is not running"; \
	fi
endef

# Restart Redis container
# Usage: $(call restart_redis)
define restart_redis
	@if [ "$(call redis_exists)" = "true" ]; then \
		echo "$(YELLOW)→$(RESET) Restarting Redis container..."; \
		$(DOCKER_COMPOSE) restart redis; \
		echo "$(GREEN)✓$(RESET) Redis restarted"; \
	else \
		echo "$(YELLOW)⚠$(RESET) Redis container does not exist. Use 'make redis-start' first."; \
	fi
endef

# Check Redis health (PING command)
# Usage: $(call check_redis_health_verbose)
define check_redis_health_verbose
	@if [ "$(call is_redis_running)" != "true" ]; then \
		echo "$(RED)✗$(RESET) Redis container is not running"; \
		exit 1; \
	fi; \
	PONG=$$(docker exec $(REDIS_CONTAINER_NAME) redis-cli PING 2>/dev/null); \
	if [ "$$PONG" = "PONG" ]; then \
		echo "$(GREEN)✓$(RESET) Redis is healthy (PONG received)"; \
	else \
		echo "$(RED)✗$(RESET) Redis is not responding"; \
		exit 1; \
	fi
endef

# Check Redis status (container + health)
# Usage: $(call check_redis_status)
define check_redis_status
	@if [ "$(call is_redis_running)" = "true" ]; then \
		PONG=$$(docker exec $(REDIS_CONTAINER_NAME) redis-cli PING 2>/dev/null); \
		if [ "$$PONG" = "PONG" ]; then \
			echo "$(GREEN)✓$(RESET) Redis: Running and healthy"; \
		else \
			echo "$(YELLOW)⚠$(RESET) Redis: Running but not responding"; \
		fi; \
	elif [ "$(call redis_exists)" = "true" ]; then \
		echo "$(YELLOW)⚠$(RESET) Redis: Stopped"; \
	else \
		echo "$(RED)✗$(RESET) Redis: Not created"; \
	fi
endef

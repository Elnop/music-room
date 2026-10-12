# ==============================================================================
# Redis Standalone Management
# ==============================================================================
# Commands for managing Redis independently like backend-local and mobile-local
# Zero breaking changes - purely additive to existing workflows

# ==============================================================================
# Core Commands
# ==============================================================================

# Start Redis (Docker mode)
.PHONY: redis-start
redis-start:
	@$(call display_step,"Starting Redis container...")
	@$(call ensure_redis_started)

# Stop Redis
.PHONY: redis-stop
redis-stop:
	@$(call display_step,"Stopping Redis container...")
	@$(call stop_redis)

# Restart Redis
.PHONY: redis-restart
redis-restart:
	@$(call display_step,"Restarting Redis container...")
	@$(call restart_redis)

# ==============================================================================
# Monitoring & Logs
# ==============================================================================

# View Redis logs
.PHONY: redis-logs
redis-logs:
	@$(call display_step,"Redis logs (Ctrl+C to exit)...")
	@docker logs -f $(REDIS_CONTAINER_NAME)

# Check Redis health
.PHONY: redis-health
redis-health:
	@$(call display_step,"Checking Redis health...")
	@$(call check_redis_health_verbose)

# Redis status (quick check)
.PHONY: redis-status
redis-status:
	@$(call display_step,"Redis status...")
	@$(call check_redis_status)

# ==============================================================================
# Redis CLI & Management
# ==============================================================================

# Open Redis CLI shell
.PHONY: redis-shell
redis-shell:
	@$(call display_step,"Opening Redis CLI shell...")
	@docker exec -it $(REDIS_CONTAINER_NAME) redis-cli

# Redis info (memory, connections, etc.)
.PHONY: redis-info
redis-info:
	@$(call display_step,"Redis server information...")
	@docker exec -it $(REDIS_CONTAINER_NAME) redis-cli INFO

# Flush all Redis data (with confirmation)
.PHONY: redis-flush
redis-flush:
	@$(call display_step,"Flushing all Redis data...")
	@read "?Are you sure? This will delete all rate limit data (y/N): " confirm && \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker exec -it $(REDIS_CONTAINER_NAME) redis-cli FLUSHALL; \
		echo "$(GREEN)✓$(RESET) Redis data flushed"; \
	else \
		echo "$(YELLOW)✗$(RESET) Cancelled"; \
	fi

# ==============================================================================
# Cleanup
# ==============================================================================

# Clean Redis (remove container and volume)
.PHONY: redis-clean
redis-clean:
	@$(call display_step,"Cleaning Redis resources...")
	@if [ "$(call redis_exists)" = "true" ]; then \
		echo "$(YELLOW)→$(RESET) Stopping Redis container..."; \
		docker stop $(REDIS_CONTAINER_NAME) 2>/dev/null || true; \
		echo "$(YELLOW)→$(RESET) Removing Redis container..."; \
		docker rm $(REDIS_CONTAINER_NAME) 2>/dev/null || true; \
		echo "$(GREEN)✓$(RESET) Redis container removed"; \
	else \
		echo "$(YELLOW)⚠$(RESET) Redis container does not exist"; \
	fi
	@if docker volume ls | grep -q $(REDIS_DATA_VOLUME); then \
		echo "$(YELLOW)→$(RESET) Removing Redis volume..."; \
		docker volume rm zumik_$(REDIS_DATA_VOLUME) 2>/dev/null || true; \
		echo "$(GREEN)✓$(RESET) Redis volume removed"; \
	else \
		echo "$(YELLOW)⚠$(RESET) Redis volume does not exist"; \
	fi
	@echo "$(GREEN)✓$(RESET) Redis cleanup complete"

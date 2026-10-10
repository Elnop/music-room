# ==============================================================================
# Performance (load tests, subject IV.7)
# ==============================================================================
# HTTP load scenarios run by Artillery from its pinned Docker image (no npm
# manifest). The real-time scenario (Socket.io) is backend/src/test/perf-socket.ts,
# run with tsx on the backend's socket.io-client. Fixtures (users, tokens,
# shared playlist) are written by backend/src/test/perf-fixtures.ts to
# tests/performance/fixtures/ (git-ignored).
# See tests/performance/README.md.

.PHONY: perf-fixtures perf-test

PERF_TARGET ?= $(BACKEND_URL)
PERF_USERS ?= 20
PERF_DIR := tests/performance
PERF_SCENARIOS := login-read track-edit
PERF_SOCKET_CLIENTS ?=
PERF_SOCKET_DURATION ?= 30
ARTILLERY_IMAGE := artilleryio/artillery:2.0.34

perf-fixtures: .ensure-backend-deps ## Create or refresh the load test users and tokens [PERF_USERS=20]
	$(call print_arrow,Preparing $(PERF_USERS) perf users in Supabase...)
	@cd $(BACKEND_DIR) && PERF_USERS=$(PERF_USERS) npx tsx src/test/perf-fixtures.ts

perf-test: ## Run the HTTP and real-time load scenarios and write a summary [PERF_TARGET= PERF_USERS= PERF_SOCKET_CLIENTS= PERF_SOCKET_DURATION=30]
	$(call print_header,Load test)
	@if ! curl -sf -m 5 "$(PERF_TARGET)/health" > /dev/null; then \
		echo "$(RED)$(ICON_ERROR) No backend answers on $(PERF_TARGET)/health$(NC)"; \
		echo "$(YELLOW)$(ICON_ARROW) Start it (make dev-docker or make backend-local) or set PERF_TARGET$(NC)"; \
		exit 1; \
	fi
	$(call print_success,Backend up on $(PERF_TARGET))
	@$(MAKE) --no-print-directory perf-fixtures PERF_USERS=$(PERF_USERS)
	@rl_enabled=$$(sed -n 's/^RATE_LIMIT_ENABLED=\([^ #]*\).*/\1/p' $(BACKEND_ENV) 2>/dev/null | tail -1 | tr -d "\"'"); \
	rl_whitelist=$$(sed -n 's/^RATE_LIMIT_WHITELIST_IPS=\([^ #]*\).*/\1/p' $(BACKEND_ENV) 2>/dev/null | tail -1 | tr -d "\"'"); \
	if [ "$$rl_enabled" != "false" ] && [ -z "$$rl_whitelist" ]; then \
		echo "$(YELLOW)$(ICON_WARNING) Rate limiting is on with no whitelisted IP: the global auth limiter allows 20 /api/auth requests per 15 min per IP (RATE_LIMIT_AUTH_MAX, RATE_LIMIT_AUTH_WINDOW_MS); a second run within 15 min gets 429s on login$(NC)"; \
		echo "$(YELLOW)   Set RATE_LIMIT_ENABLED=false (or whitelist the client IP) in $(BACKEND_ENV) and restart the backend$(NC)"; \
	elif [ "$$rl_enabled" != "false" ]; then \
		echo "$(YELLOW)$(ICON_INFO) Rate limiting is on; whitelist: $$rl_whitelist (must hold the client IP the backend sees)$(NC)"; \
	fi; \
	run_dir="$(PERF_DIR)/results/$$(date +%Y%m%d-%H%M%S)"; \
	mkdir -p "$$run_dir"; \
	rc=0; \
	for scenario in $(PERF_SCENARIOS); do \
		echo "$(YELLOW)$(ICON_ARROW) Scenario $$scenario...$(NC)"; \
		docker run --rm --network host --user "$$(id -u):$$(id -g)" \
			-e HOME=/tmp -e ARTILLERY_DISABLE_TELEMETRY=true \
			-v "$(CURDIR)/$(PERF_DIR):/perf" -w /perf \
			$(ARTILLERY_IMAGE) run \
			--target "$(PERF_TARGET)" \
			--variables "$$(cat $(PERF_DIR)/fixtures/env.json)" \
			--output "$${run_dir#$(PERF_DIR)/}/$$scenario.json" \
			"scenarios/$$scenario.yml" > "$$run_dir/$$scenario.log" 2>&1 \
			|| { rc=1; echo "$(RED)$(ICON_ERROR) Scenario $$scenario failed, see $$run_dir/$$scenario.log$(NC)"; }; \
	done; \
	echo "$(YELLOW)$(ICON_ARROW) Scenario socket (clients: $(if $(PERF_SOCKET_CLIENTS),$(PERF_SOCKET_CLIENTS),one per fixture user), $(PERF_SOCKET_DURATION) s)...$(NC)"; \
	( cd $(BACKEND_DIR) && PERF_TARGET="$(PERF_TARGET)" PERF_SOCKET_CLIENTS="$(PERF_SOCKET_CLIENTS)" \
		PERF_SOCKET_DURATION="$(PERF_SOCKET_DURATION)" \
		npx tsx src/test/perf-socket.ts --out "$(CURDIR)/$$run_dir/socket.json" ) > "$$run_dir/socket.log" 2>&1 \
		|| { rc=1; echo "$(RED)$(ICON_ERROR) Scenario socket failed, see $$run_dir/socket.log$(NC)"; }; \
	PERF_TARGET="$(PERF_TARGET)" PERF_USERS="$(PERF_USERS)" \
		PERF_RATE_LIMIT_ENABLED="$$rl_enabled" PERF_RATE_LIMIT_WHITELIST_IPS="$$rl_whitelist" \
		node $(PERF_DIR)/summarize.mjs "$$run_dir" || rc=1; \
	exit $$rc

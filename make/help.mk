# ==============================================================================
# Help
# ==============================================================================
# `make` lists the quick start commands and the categories; `make <category>`
# lists the commands of one category.

.PHONY: help docker local emulator tunnel apk quality supabase redis backend cleanup setup redis-help backend-help

# Usage: $(HELP_CMD) name "description"
HELP_CMD = @printf '  $(GREEN)%-28s$(NC) %s\n'
# Usage: $(HELP_SECTION) "title"
HELP_SECTION = @printf '\n$(BLUE)%s$(NC)\n────────────────────────────────────────────────────────────────\n'
# Usage: $(HELP_NOTE) "text"
HELP_NOTE = @printf '  $(YELLOW)💡 %s$(NC)\n'

help: ## Show the quick start commands and the help categories
	@echo ""
	$(call print_separator)
	@echo "$(BLUE)                  Zumik - Development Commands                 $(NC)"
	$(call print_separator)
	$(HELP_SECTION) "🚀 QUICK START"
	$(HELP_CMD) install "Install all dependencies (run this first)"
	$(HELP_CMD) dev-docker "Start the project: backend + Metro in Docker"
	$(HELP_CMD) start-emulator "Start an emulator and open the app on it"
	$(HELP_CMD) test "Run backend and mobile tests"
	$(HELP_SECTION) "📚 COMMANDS BY CATEGORY  (make <category>)"
	$(HELP_CMD) docker "Containers: start, stop, logs, Metro address, shells"
	$(HELP_CMD) local "Local development without Docker"
	$(HELP_CMD) emulator "Android emulators: start, restart, clean, open the app"
	$(HELP_CMD) tunnel "Tunnel mode for different networks"
	$(HELP_CMD) apk "Build and install APKs"
	$(HELP_CMD) quality "Tests, lint, format"
	$(HELP_CMD) supabase "Supabase CLI and type generation"
	$(HELP_CMD) redis "Redis container"
	$(HELP_CMD) backend "Standalone backend"
	$(HELP_CMD) cleanup "Docker, project and global cleanup"
	$(HELP_CMD) setup "Setup checks, system info, permissions"
	@echo ""
	$(call print_separator)
	@echo ""

docker: ## List the Docker mode commands
	$(HELP_SECTION) "🐳 DOCKER MODE"
	$(HELP_CMD) dev-docker "Build and start all services in Docker (backend + mobile)"
	$(HELP_CMD) start "Start existing containers (no rebuild)"
	$(HELP_CMD) stop "Stop all containers"
	$(HELP_CMD) containers-restart "Restart the containers (no rebuild)"
	$(HELP_CMD) down "Stop and remove containers + networks"
	$(HELP_CMD) ps "Show container status"
	$(HELP_CMD) logs "Show logs from all services"
	$(HELP_CMD) logs-mobile "Show mobile logs only"
	$(HELP_CMD) qr "Show how to connect the debug build to Metro"
	$(HELP_CMD) build "Build all Docker images"
	$(HELP_CMD) build-backend "Build the backend image only"
	$(HELP_CMD) build-mobile "Build the mobile image only"
	$(HELP_CMD) shell-backend "Open a shell in the backend container"
	$(HELP_CMD) shell-mobile "Open a shell in the mobile container"
	@echo ""

local: ## List the local mode commands
	$(HELP_SECTION) "💻 LOCAL MODE (no Docker)"
	$(HELP_CMD) dev-local "Start backend + Metro locally (Android Studio emulator)"
	$(HELP_CMD) expo-android "Start Metro and open the app in the emulator"
	$(HELP_CMD) expo-clear "Start Metro with a cleared cache"
	$(HELP_CMD) set-backend-url "Write the backend URL in mobile/.env (HOST_IP)"
	$(HELP_NOTE) "Emulator commands: make emulator"
	@echo ""

emulator: ## List the Android emulator commands
	$(HELP_SECTION) "📱 ANDROID EMULATORS"
	@echo "  $(YELLOW)Every start opens the Zumik debug build (Metro from make dev-docker)$(NC)"
	@echo "  $(YELLOW)One emulator:$(NC)"
	$(HELP_CMD) list-emulators "List the available AVDs"
	$(HELP_CMD) start-emulator "Start the first AVD, cold boot [AVD= FAST=1 GPU=]"
	$(HELP_CMD) open-emulator "Choose the AVD to start [interactive or AVD=]"
	$(HELP_CMD) restart-emulator "Stop the emulator and cold boot it again"
	@echo "  $(YELLOW)Two emulators (two-account tests):$(NC)"
	$(HELP_CMD) start-emulators "Start two AVDs [AVD1= AVD2= FAST=1 GPU=]"
	$(HELP_CMD) restart-emulators "Cold boot two AVDs again"
	$(HELP_CMD) restart-emulators-clean "Same with no cache: snapshots, Metro, app data [WIPE=1]"
	@echo "  $(YELLOW)App and maintenance:$(NC)"
	$(HELP_CMD) open-app "Reopen the app on running emulators"
	$(HELP_CMD) kill-emulator "Stop all running emulators"
	$(HELP_CMD) clean-emulators "Stop emulators, remove snapshots, locks and APK cache"
	$(HELP_CMD) check-devices "Check connected Android devices"
	$(HELP_NOTE) "Rendering uses the host GPU; GPU=swiftshader_indirect if the screen stays black"
	@echo ""

tunnel: ## List the tunnel mode commands
	$(HELP_SECTION) "🌐 TUNNEL MODE (phone and PC on different networks)"
	$(HELP_CMD) tunnel-setup "One-time EAS setup [requires: install]"
	$(HELP_CMD) dev-tunnel "Start all services through the tunnel [~50-200ms latency, SUPABASE_MODE=hosted]"
	$(HELP_CMD) qr-tunnel "Show the tunnel URLs and Metro host"
	$(HELP_CMD) tunnel-info "Show detailed tunnel information"
	@echo ""

apk: ## List the APK build commands
	$(HELP_SECTION) "🏗️  APK BUILDS"
	@echo "  $(YELLOW)Production:$(NC)"
	$(HELP_CMD) prod-build-apk-manual "Build the APK with Gradle [no EAS, ~5-10min]"
	$(HELP_CMD) prod-install-apk "Install the APK on a USB device"
	@echo "  $(YELLOW)With tunnel URL (cross-network testing):$(NC)"
	$(HELP_CMD) dev-tunnel-build-apk "Build an APK with the ngrok tunnel [~6-11min]"
	$(HELP_CMD) dev-tunnel-build-apk-install "Install the tunnel APK on a device"
	$(HELP_CMD) build-apk-docker "Build an APK in Docker [~6-10min]"
	$(HELP_CMD) build-apk-docker-with-tunnel "Build an APK in Docker with the tunnel [~6-10min]"
	@echo ""

quality: ## List the test and code quality commands
	$(HELP_SECTION) "✅ CODE QUALITY"
	$(HELP_CMD) test "Run backend and mobile unit tests"
	$(HELP_CMD) test-int "Run backend integration tests (local Supabase)"
	$(HELP_CMD) test-db-up "Start the local Supabase stack (fresh database)"
	$(HELP_CMD) test-db-down "Stop the local Supabase stack"
	$(HELP_CMD) lint "Run linters on all code"
	$(HELP_CMD) lint-fix "Auto-fix linting issues"
	$(HELP_CMD) format "Format all code with Prettier"
	$(HELP_CMD) perf-test "HTTP and Socket.io load test, summary in tests/performance/results [PERF_TARGET= PERF_USERS= PERF_SOCKET_CLIENTS= PERF_SOCKET_DURATION=30]"
	$(HELP_CMD) perf-fixtures "Create or refresh the load test users and tokens [PERF_USERS=20]"
	@echo ""

supabase: ## List the Supabase commands
	$(HELP_SECTION) "🗄️  SUPABASE  (SUPABASE_MODE=$(SUPABASE_MODE))"
	$(HELP_CMD) supabase-up "Start the local dev stack (ports 544xx, emails on :54424), apply new migrations"
	$(HELP_CMD) supabase-down "Stop the local dev stack (data kept)"
	$(HELP_CMD) supabase-reset "Empty the local dev database, apply every migration again"
	$(HELP_CMD) generate-types "Generate TypeScript types from the schema (dev stack or hosted)"
	$(HELP_CMD) supabase-login "Log in to the Supabase CLI [one-time, hosted mode only]"
	$(HELP_CMD) supabase-status "Check the CLI installation and auth status"
	$(HELP_NOTE) "SUPABASE_MODE=local (default): dev-docker, dev-local and generate-types use the local stack"
	$(HELP_NOTE) "SUPABASE_MODE=hosted: they use the project in backend/.env (needed by dev-tunnel for now)"
	@echo ""

redis: ## List the Redis commands
	$(HELP_SECTION) "🔴 REDIS (rate limiting)"
	$(HELP_CMD) redis-start "Start the Redis container"
	$(HELP_CMD) redis-stop "Stop the Redis container"
	$(HELP_CMD) redis-restart "Restart the Redis container"
	$(HELP_CMD) redis-logs "Show Redis logs (live)"
	$(HELP_CMD) redis-health "Check Redis health"
	$(HELP_CMD) redis-status "Quick status check"
	$(HELP_CMD) redis-shell "Open the Redis CLI"
	$(HELP_CMD) redis-info "Show Redis server info"
	$(HELP_CMD) redis-flush "Flush all Redis data [confirmation]"
	$(HELP_CMD) redis-clean "Remove the Redis container and volume"
	$(HELP_NOTE) "Redis + local backend: make redis-start && make backend-local"
	@echo ""

backend: ## List the standalone backend commands
	$(HELP_SECTION) "⚙️  BACKEND (standalone)"
	$(HELP_CMD) backend-docker "Start the backend in Docker"
	$(HELP_CMD) backend-local "Start the backend locally (npm run dev)"
	$(HELP_CMD) backend-stop "Stop the backend container"
	$(HELP_CMD) backend-restart "Restart the backend container"
	$(HELP_CMD) backend-logs "Show backend logs (live)"
	$(HELP_CMD) backend-health "Check backend health"
	$(HELP_CMD) backend-status "Quick status check"
	$(HELP_NOTE) "Full stack: make dev-docker or make dev-local"
	@echo ""

cleanup: ## List the cleanup commands
	$(HELP_SECTION) "🧹 CLEANUP"
	@echo "  $(YELLOW)Project:$(NC)"
	$(HELP_CMD) clean "Docker + project artifacts [confirmation]"
	$(HELP_CMD) clean-project "Project artifacts only (no Docker, no global)"
	$(HELP_CMD) clean-emulators "Emulator snapshots, locks and APK cache"
	@echo "  $(YELLOW)Docker:$(NC)"
	$(HELP_CMD) clean-docker "Zumik Docker resources only"
	$(HELP_CMD) prune "Unused Docker resources"
	@echo "  $(RED)Global (affects ALL projects):$(NC)"
	$(HELP_CMD) clean-global-cache "Expo, Metro, Watchman caches [type 'yes']"
	$(HELP_CMD) clean-gradle "Gradle/Android caches [type 'yes']"
	$(HELP_CMD) clean-all "Everything: Docker + project + global [type 'yes']"
	@echo ""

setup: ## List the setup and utility commands
	$(HELP_SECTION) "🔧 SETUP & UTILITIES"
	$(HELP_CMD) install "Install all dependencies (backend + mobile)"
	$(HELP_CMD) check-setup "Verify the development environment"
	$(HELP_CMD) dev "Show the development mode menu"
	$(HELP_CMD) info "Show system information"
	$(HELP_CMD) health "Check services health"
	$(HELP_CMD) fix-permissions "Fix file permissions for Docker"
	$(HELP_CMD) fix-node-modules "Fix node_modules ownership (local builds)"
	@echo ""

redis-help: redis
backend-help: backend

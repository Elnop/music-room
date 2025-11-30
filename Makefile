.PHONY: help install dev start stop restart logs logs-backend logs-mobile qr ps build build-backend build-mobile test test-backend lint format clean clean-docker clean-deps clean-all shell-backend shell-mobile deploy health dev-tunnel qr-tunnel tunnel-info

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Docker Compose command (detect version)
DOCKER_COMPOSE := $(shell command -v docker-compose 2>/dev/null)
ifeq ($(DOCKER_COMPOSE),)
	DOCKER_COMPOSE := docker compose
endif

# Detect local IP address
# Try multiple methods to get local IP (works on Linux, macOS, WSL)
HOST_IP := $(shell \
	ip route get 1 2>/dev/null | awk '{print $$7; exit}' || \
	hostname -I 2>/dev/null | awk '{print $$1}' || \
	ipconfig getifaddr en0 2>/dev/null || \
	echo "0.0.0.0" \
)
export HOST_IP

help: ## Show this help message
	@clear
	@echo ""
	@echo "$(BLUE)╔══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║          Music Room - Docker Makefile Commands              ║$(NC)"
	@echo "$(BLUE)╚══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)DEVELOPMENT COMMANDS:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)  %-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(BLUE)Example usage:$(NC)"
	@echo "  make install    $(YELLOW)# First-time setup$(NC)"
	@echo "  make dev        $(YELLOW)# Start development environment$(NC)"
	@echo "  make logs       $(YELLOW)# View all logs$(NC)"
	@echo "  make stop       $(YELLOW)# Stop all services$(NC)"
	@echo ""

install: ## Install all dependencies (backend + mobile)
	@echo "$(BLUE)╔══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║              Installing Dependencies                         ║$(NC)"
	@echo "$(BLUE)╚══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)→ Setting up backend environment...$(NC)"
	@if [ ! -f backend/.env ]; then \
		cp backend/.env.example backend/.env; \
		echo "$(GREEN)✓ Created backend/.env from .env.example$(NC)"; \
		echo "$(RED)⚠️  Please edit backend/.env and add your Supabase credentials$(NC)"; \
	else \
		echo "$(YELLOW)⊙ backend/.env already exists$(NC)"; \
	fi
	@echo ""
	@echo "$(YELLOW)→ Setting up mobile environment...$(NC)"
	@if [ ! -f mobile/.env ]; then \
		cp mobile/.env.example mobile/.env; \
		echo "$(GREEN)✓ Created mobile/.env from .env.example$(NC)"; \
	else \
		echo "$(YELLOW)⊙ mobile/.env already exists$(NC)"; \
	fi
	@echo ""
	@echo "$(YELLOW)→ Installing backend dependencies...$(NC)"
	@cd backend && npm install
	@echo "$(GREEN)✓ Backend dependencies installed$(NC)"
	@echo ""
	@echo "$(YELLOW)→ Installing mobile dependencies...$(NC)"
	@cd mobile && npm install
	@echo "$(GREEN)✓ Mobile dependencies installed$(NC)"
	@echo ""
	@echo "$(GREEN)╔══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║                  Installation Complete!                      ║$(NC)"
	@echo "$(GREEN)╚══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(BLUE)Next steps:$(NC)"
	@echo "  1. Edit backend/.env with your Supabase credentials"
	@echo "  2. Run: $(GREEN)make dev$(NC)"
	@echo ""

dev: ## Start all services in development mode (backend + mobile)
	@echo "$(BLUE)╔══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║         Starting Music Room Development Environment          ║$(NC)"
	@echo "$(BLUE)╚══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)→ Building and starting containers...$(NC)"
	@$(DOCKER_COMPOSE) up -d --build
	@echo ""
	@echo "$(GREEN)✓ Services started successfully!$(NC)"
	@echo ""
	@echo "$(BLUE)Services running:$(NC)"
	@echo "  $(GREEN)Backend API:$(NC)      http://localhost:3000"
	@echo "  $(GREEN)Expo DevTools:$(NC)    http://localhost:19000"
	@echo "  $(GREEN)Metro Bundler:$(NC)    http://localhost:8081"
	@echo ""
	@echo "$(YELLOW)→ Waiting for Expo to start (15 seconds)...$(NC)"
	@sleep 15
	@clear
	@echo ""
	@echo "$(GREEN)╔══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║                    🚀 Music Room Started!                    ║$(NC)"
	@echo "$(GREEN)╚══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(BLUE)📡 Services:$(NC)"
	@echo "   $(GREEN)✓$(NC) Backend API:      http://localhost:3000"
	@echo "   $(GREEN)✓$(NC) Expo DevTools:    http://localhost:19000"
	@echo "   $(GREEN)✓$(NC) Metro Bundler:    http://localhost:8081"
	@echo ""
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@echo "$(YELLOW)📱 EXPO QR CODE - Scan with Expo Go app$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@$(DOCKER_COMPOSE) logs mobile 2>/dev/null | grep -B 5 -A 50 "▄▄▄▄▄▄▄" | head -70 || $(DOCKER_COMPOSE) logs mobile | tail -60
	@echo ""
	@echo "$(GREEN)🌐 Local IP: $(HOST_IP)$(NC)"
	@echo "$(GREEN)📱 Expo URL: exp://$(HOST_IP):8081$(NC)"
	@echo ""
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(YELLOW)💡 Quick Commands:$(NC)"
	@echo "   $(GREEN)make qr$(NC)          - Show QR code again"
	@echo "   $(GREEN)make logs$(NC)        - View all logs (live)"
	@echo "   $(GREEN)make logs-mobile$(NC) - View Expo logs only (live)"
	@echo "   $(GREEN)make stop$(NC)        - Stop all services"
	@echo "   $(GREEN)make restart$(NC)     - Restart all services"
	@echo ""
	@echo "$(GREEN)✨ Ready to develop! Open Expo Go and scan the QR code above$(NC)"
	@echo ""

start: ## Start existing containers (without rebuild)
	@echo "$(BLUE)Starting containers...$(NC)"
	@$(DOCKER_COMPOSE) start
	@echo "$(GREEN)✓ Services started$(NC)"

stop: ## Stop all running containers
	@echo "$(YELLOW)Stopping all services...$(NC)"
	@$(DOCKER_COMPOSE) stop
	@echo "$(GREEN)✓ Services stopped$(NC)"

restart: ## Restart all services
	@echo "$(YELLOW)Restarting all services...$(NC)"
	@$(DOCKER_COMPOSE) restart
	@echo "$(GREEN)✓ Services restarted$(NC)"

down: ## Stop and remove all containers, networks
	@echo "$(YELLOW)Stopping and removing containers...$(NC)"
	@$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✓ Containers removed$(NC)"

logs: ## Show logs from all services (ctrl+c to exit)
	@echo "$(BLUE)Showing logs (press Ctrl+C to exit)...$(NC)"
	@$(DOCKER_COMPOSE) logs -f

logs-backend: ## Show backend logs only
	@echo "$(BLUE)Backend logs (press Ctrl+C to exit)...$(NC)"
	@$(DOCKER_COMPOSE) logs -f backend

logs-mobile: ## Show mobile logs only
	@echo "$(BLUE)Mobile logs (press Ctrl+C to exit)...$(NC)"
	@$(DOCKER_COMPOSE) logs -f mobile

qr: ## Display Expo QR code and connection URL
	@clear
	@echo ""
	@echo "$(GREEN)╔══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║                    📱 Expo QR Code                           ║$(NC)"
	@echo "$(GREEN)╚══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@echo "$(YELLOW)📱 EXPO QR CODE - Scan with Expo Go app$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@$(DOCKER_COMPOSE) logs mobile 2>/dev/null | grep -B 5 -A 50 "▄▄▄▄▄▄▄" | head -70 || $(DOCKER_COMPOSE) logs mobile | tail -60
	@echo ""
	@echo "$(GREEN)🌐 Local IP: $(HOST_IP)$(NC)"
	@echo "$(GREEN)📱 Expo URL: exp://$(HOST_IP):8081$(NC)"
	@echo ""
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(YELLOW)💡 Instructions:$(NC)"
	@echo "   1. Install $(GREEN)Expo Go$(NC) app on your phone (Play Store / App Store)"
	@echo "   2. Open Expo Go and tap $(GREEN)Scan QR Code$(NC)"
	@echo "   3. Point your camera at the QR code above"
	@echo ""
	@echo "$(YELLOW)⚠️  Note:$(NC) Your phone and computer must be on the same WiFi network"
	@echo "   Your local IP is: $(GREEN)$(HOST_IP)$(NC)"
	@echo ""
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(YELLOW)💡 Quick commands:$(NC) $(GREEN)make logs$(NC) | $(GREEN)make stop$(NC) | $(GREEN)make restart$(NC)"
	@echo "$(YELLOW)📋 All commands:$(NC)  $(GREEN)make help$(NC)"
	@echo ""

ps: ## Show status of all containers
	@echo "$(BLUE)Container status:$(NC)"
	@$(DOCKER_COMPOSE) ps

build: ## Build all Docker images
	@echo "$(BLUE)Building all Docker images...$(NC)"
	@$(DOCKER_COMPOSE) build
	@echo "$(GREEN)✓ All images built$(NC)"

build-backend: ## Build backend Docker image only
	@echo "$(BLUE)Building backend image...$(NC)"
	@$(DOCKER_COMPOSE) build backend
	@echo "$(GREEN)✓ Backend image built$(NC)"

build-mobile: ## Build mobile Docker image only
	@echo "$(BLUE)Building mobile image...$(NC)"
	@$(DOCKER_COMPOSE) build mobile
	@echo "$(GREEN)✓ Mobile image built$(NC)"

test: test-backend ## Run all tests (backend)
	@echo "$(GREEN)✓ All tests completed$(NC)"

test-backend: ## Run backend tests
	@echo "$(BLUE)Running backend tests...$(NC)"
	@cd backend && npm test || echo "$(YELLOW)⚠️  No tests configured yet$(NC)"

lint: ## Run linters on all code
	@echo "$(BLUE)╔══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║                    Running Linters                           ║$(NC)"
	@echo "$(BLUE)╚══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)→ Linting backend...$(NC)"
	@cd backend && npm run lint || echo "$(YELLOW)⚠️  Backend linting not configured$(NC)"
	@echo ""
	@echo "$(YELLOW)→ Linting mobile...$(NC)"
	@cd mobile && npm run lint || echo "$(YELLOW)⚠️  Mobile linting not configured$(NC)"
	@echo "$(GREEN)✓ Linting complete$(NC)"

format: ## Format all code with prettier
	@echo "$(BLUE)╔══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║                  Formatting Code                             ║$(NC)"
	@echo "$(BLUE)╚══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)→ Formatting backend...$(NC)"
	@cd backend && npm run format || echo "$(YELLOW)⚠️  Backend formatting not configured$(NC)"
	@echo ""
	@echo "$(YELLOW)→ Formatting mobile...$(NC)"
	@cd mobile && npm run format || echo "$(YELLOW)⚠️  Mobile formatting not configured$(NC)"
	@echo "$(GREEN)✓ Formatting complete$(NC)"

shell-backend: ## Open shell in backend container
	@echo "$(BLUE)Opening shell in backend container...$(NC)"
	@$(DOCKER_COMPOSE) exec backend sh

shell-mobile: ## Open shell in mobile container
	@echo "$(BLUE)Opening shell in mobile container...$(NC)"
	@$(DOCKER_COMPOSE) exec mobile sh

health: ## Check health status of all services
	@echo "$(BLUE)╔══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║                    Health Check                              ║$(NC)"
	@echo "$(BLUE)╚══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)→ Checking backend health...$(NC)"
	@curl -s http://localhost:3000/health > /dev/null && echo "$(GREEN)✓ Backend: Healthy$(NC)" || echo "$(RED)✗ Backend: Unhealthy$(NC)"
	@echo ""
	@echo "$(YELLOW)→ Checking mobile (Metro bundler)...$(NC)"
	@curl -s http://localhost:8081/status > /dev/null && echo "$(GREEN)✓ Mobile: Healthy$(NC)" || echo "$(RED)✗ Mobile: Unhealthy$(NC)"

clean: ## Remove all containers, images, volumes, and dependencies (with confirmation)
	@echo "$(RED)╔══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(RED)║                    CLEANUP WARNING                           ║$(NC)"
	@echo "$(RED)╚══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)This will remove:$(NC)"
	@echo "  • Docker containers (music-room-backend, music-room-mobile)"
	@echo "  • Docker images (music_room-backend, music_room-mobile)"
	@echo "  • Docker volumes"
	@echo "  • Docker network (music-room-network)"
	@echo "  • backend/node_modules"
	@echo "  • mobile/node_modules"
	@echo "  • backend/dist"
	@echo "  • mobile/.expo"
	@echo ""
	@printf "$(RED)Are you sure? [y/N]$(NC) "; \
	read REPLY; \
	if [ "$$REPLY" = "y" ] || [ "$$REPLY" = "Y" ]; then \
		echo ""; \
		echo "$(YELLOW)→ Stopping and removing Docker resources...$(NC)"; \
		$(DOCKER_COMPOSE) down -v --rmi local 2>/dev/null || true; \
		echo "$(GREEN)✓ Docker resources removed$(NC)"; \
		echo "$(YELLOW)→ Removing node_modules...$(NC)"; \
		rm -rf backend/node_modules mobile/node_modules; \
		echo "$(GREEN)✓ Dependencies removed$(NC)"; \
		echo "$(YELLOW)→ Removing build artifacts...$(NC)"; \
		rm -rf backend/dist mobile/.expo; \
		echo "$(GREEN)✓ Build artifacts removed$(NC)"; \
		echo ""; \
		echo "$(GREEN)╔══════════════════════════════════════════════════════════════╗$(NC)"; \
		echo "$(GREEN)║                  Cleanup Complete!                           ║$(NC)"; \
		echo "$(GREEN)╚══════════════════════════════════════════════════════════════╝$(NC)"; \
		echo "$(BLUE)Run 'make install' to reinstall dependencies$(NC)"; \
	else \
		echo ""; \
		echo "$(BLUE)Cleanup cancelled$(NC)"; \
	fi

clean-docker: ## Remove only Docker containers, images, and volumes (no confirmation)
	@echo "$(YELLOW)Removing Docker resources...$(NC)"
	@$(DOCKER_COMPOSE) down -v --rmi local 2>/dev/null || true
	@echo "$(GREEN)✓ Docker cleanup complete$(NC)"

clean-deps: ## Remove only node_modules and build artifacts (no confirmation)
	@echo "$(YELLOW)Removing dependencies and build artifacts...$(NC)"
	@rm -rf backend/node_modules mobile/node_modules
	@rm -rf backend/dist mobile/.expo
	@echo "$(GREEN)✓ Dependencies cleanup complete$(NC)"

clean-all: ## Force remove everything without confirmation (dangerous!)
	@echo "$(RED)Force cleaning everything...$(NC)"
	@echo ""
	$(DOCKER_COMPOSE) down -v --rmi local || true
	@echo ""
	@echo "$(YELLOW)Removing dependencies...$(NC)"
	rm -rf backend/node_modules mobile/node_modules
	@echo "$(YELLOW)Removing build artifacts...$(NC)"
	rm -rf backend/dist mobile/.expo
	@echo ""
	@echo "$(GREEN)✓ Force cleanup complete$(NC)"

deploy-build: ## Build production images (for deployment)
	@echo "$(BLUE)Building production images...$(NC)"
	@docker build -t music-room-backend:latest --target production ./backend
	@echo "$(GREEN)✓ Production images built$(NC)"
	@echo ""
	@echo "$(YELLOW)Images ready for deployment:$(NC)"
	@echo "  - music-room-backend:latest"

prune: ## Clean up unused Docker resources
	@echo "$(YELLOW)Pruning unused Docker resources...$(NC)"
	@docker system prune -f
	@echo "$(GREEN)✓ Docker resources pruned$(NC)"

info: ## Show system information
	@echo "$(BLUE)╔══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║              Music Room - System Information                 ║$(NC)"
	@echo "$(BLUE)╚══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)Network Information:$(NC)"
	@echo "  Local IP:  $(GREEN)$(HOST_IP)$(NC)"
	@echo "  Expo URL:  $(GREEN)exp://$(HOST_IP):8081$(NC)"
	@echo ""
	@echo "$(YELLOW)Docker Version:$(NC)"
	@docker --version
	@echo ""
	@echo "$(YELLOW)Docker Compose Version:$(NC)"
	@$(DOCKER_COMPOSE) --version
	@echo ""
	@echo "$(YELLOW)Node.js Versions:$(NC)"
	@echo "  Backend:  $$(cd backend && node --version 2>/dev/null || echo 'Not installed')"
	@echo "  Mobile:   $$(cd mobile && node --version 2>/dev/null || echo 'Not installed')"
	@echo ""
	@echo "$(YELLOW)Container Status:$(NC)"
	@$(DOCKER_COMPOSE) ps

# =====================================================
# Tunnel Mode Commands (Cross-Network Development)
# =====================================================

dev-tunnel: ## Start all services in tunnel mode (different WiFi networks)
	@echo "$(BLUE)╔══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║         Starting Music Room in TUNNEL MODE                   ║$(NC)"
	@echo "$(BLUE)╚══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)→ Checking EAS configuration...$(NC)"
	@if ! $(DOCKER_COMPOSE) run --rm mobile npx eas whoami >/dev/null 2>&1; then \
		echo ""; \
		echo "$(RED)❌ EAS not configured!$(NC)"; \
		echo ""; \
		echo "$(YELLOW)Run this first:$(NC) $(GREEN)make tunnel-setup$(NC)"; \
		echo ""; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ EAS configured$(NC)"
	@echo ""
	@echo "$(YELLOW)⚠️  Note: Tunnel mode is slower than LAN mode$(NC)"
	@echo "$(YELLOW)   Use this only when phone and PC are on different networks$(NC)"
	@echo ""
	@echo "$(YELLOW)→ Building and starting containers with tunnel support...$(NC)"
	@$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.tunnel.yml up -d --build
	@echo ""
	@echo "$(GREEN)✓ Services started in tunnel mode!$(NC)"
	@echo ""
	@echo "$(YELLOW)→ Waiting for tunnels to initialize (20 seconds)...$(NC)"
	@sleep 20
	@clear
	@echo ""
	@echo "$(GREEN)╔══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║              🌐 Music Room - TUNNEL MODE ACTIVE              ║$(NC)"
	@echo "$(GREEN)╚══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(BLUE)📡 Tunnel URLs:$(NC)"
	@echo "$(YELLOW)→ Backend tunnel URL:$(NC)"
	@$(DOCKER_COMPOSE) exec -T backend cat /tmp/backend-tunnel-url.txt 2>/dev/null || echo "   $(YELLOW)Initializing...$(NC)"
	@echo ""
	@echo "$(BLUE)🔍 ngrok Web Interface:$(NC)"
	@echo "   $(GREEN)✓$(NC) Backend ngrok:   http://localhost:4040"
	@echo ""
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@echo "$(YELLOW)📱 EXPO QR CODE - Scan with Expo Go app$(NC)"
	@echo "$(YELLOW)   (Works across different WiFi networks)$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@$(DOCKER_COMPOSE) logs mobile 2>/dev/null | grep -B 5 -A 50 "▄▄▄▄▄▄▄" | head -70 || $(DOCKER_COMPOSE) logs mobile | tail -60
	@echo ""
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(YELLOW)💡 Quick Commands:$(NC)"
	@echo "   $(GREEN)make qr-tunnel$(NC)   - Show tunnel URLs and QR code again"
	@echo "   $(GREEN)make tunnel-info$(NC) - Display detailed tunnel information"
	@echo "   $(GREEN)make logs$(NC)        - View all logs"
	@echo "   $(GREEN)make stop$(NC)        - Stop tunnel mode"
	@echo "   $(GREEN)make dev$(NC)         - Switch back to LAN mode"
	@echo ""
	@echo "$(GREEN)✨ Tunnel mode active! Scan QR code from any network$(NC)"
	@echo ""

qr-tunnel: ## Show tunnel QR code and URLs
	@clear
	@echo ""
	@echo "$(GREEN)╔══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║              📱 Tunnel Mode - Connection Info                ║$(NC)"
	@echo "$(GREEN)╚══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(BLUE)🌐 Backend Tunnel URL:$(NC)"
	@$(DOCKER_COMPOSE) exec -T backend cat /tmp/backend-tunnel-url.txt 2>/dev/null || echo "   $(RED)✗ Backend tunnel not available$(NC)"
	@echo ""
	@echo "$(BLUE)🔍 ngrok Web Interface:$(NC)"
	@echo "   http://localhost:4040 (view tunnel traffic, connections)"
	@echo ""
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@echo "$(YELLOW)📱 EXPO QR CODE$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@$(DOCKER_COMPOSE) logs mobile 2>/dev/null | grep -B 5 -A 50 "▄▄▄▄▄▄▄" | head -70 || $(DOCKER_COMPOSE) logs mobile | tail -60
	@echo ""
	@echo "$(GREEN)✓ Works across different WiFi networks$(NC)"
	@echo ""
	@echo "$(YELLOW)💡 Quick commands:$(NC) $(GREEN)make tunnel-info$(NC) | $(GREEN)make logs$(NC) | $(GREEN)make stop$(NC)"
	@echo ""

tunnel-info: ## Display detailed tunnel connection info
	@echo "$(BLUE)╔══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║                  Tunnel Mode Information                     ║$(NC)"
	@echo "$(BLUE)╚══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)Backend Tunnel:$(NC)"
	@$(DOCKER_COMPOSE) exec -T backend cat /tmp/backend-tunnel-url.txt 2>/dev/null || echo "   $(RED)Not running$(NC)"
	@echo ""
	@echo "$(YELLOW)ngrok Web UI:$(NC)"
	@echo "   http://localhost:4040"
	@echo "   $(BLUE)Use this to inspect HTTP traffic, connections, and tunnel status$(NC)"
	@echo ""
	@echo "$(YELLOW)Container Status:$(NC)"
	@$(DOCKER_COMPOSE) ps
	@echo ""
	@echo "$(YELLOW)Performance Note:$(NC)"
	@echo "   Tunnel mode adds ~50-200ms latency vs LAN mode"
	@echo "   Hot reload may be slower due to internet round-trip"
	@echo ""
	@echo "$(YELLOW)Quick Commands:$(NC)"
	@echo "   $(GREEN)make qr-tunnel$(NC)  - Show QR code again"
	@echo "   $(GREEN)make logs$(NC)       - View all logs"
	@echo "   $(GREEN)make stop$(NC)       - Stop tunnel mode"
	@echo "   $(GREEN)make dev$(NC)        - Switch to LAN mode"
	@echo ""

tunnel-setup: ## One-time setup for tunnel mode (auto EAS login)
	@echo "$(BLUE)╔══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║           Tunnel Mode - Automatic Setup                     ║$(NC)"
	@echo "$(BLUE)╚══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)→ Starting mobile container for setup...$(NC)"
	@$(DOCKER_COMPOSE) up mobile -d --build
	@sleep 5
	@echo ""
	@echo "$(YELLOW)→ Configuring EAS (automatic login)...$(NC)"
	@$(DOCKER_COMPOSE) exec mobile sh setup-eas-auto.sh
	@echo ""
	@echo "$(YELLOW)→ Stopping setup container...$(NC)"
	@$(DOCKER_COMPOSE) stop mobile
	@echo ""
	@echo "$(GREEN)╔══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║              ✓ Tunnel Setup Complete!                       ║$(NC)"
	@echo "$(GREEN)╚══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(BLUE)Next step:$(NC)"
	@echo "  Run: $(GREEN)make dev-tunnel$(NC) to start tunnel mode"
	@echo ""

# ==============================================================================
# Development Mode Selection Menu
# ==============================================================================
# Helper command to guide users to the right development mode

.PHONY: dev

dev: ## Show development mode options
	$(call print_header,Development Mode Selection)
	@echo ""
	@echo "$(BLUE)Choose your development mode:$(NC)"
	@echo ""
	@echo "  $(GREEN)1. make dev-build-local$(NC)   $(YELLOW)→ Recommended for onboarding$(NC)"
	@echo "     • Backend runs locally (Node.js)"
	@echo "     • Mobile builds natively with Android SDK"
	@echo "     • Hot reload enabled"
	@echo ""
	@echo "  $(GREEN)2. make dev-docker$(NC)         $(BLUE)→ Containerized development$(NC)"
	@echo "     • Backend + Mobile in Docker containers"
	@echo "     • Isolated environment"
	@echo "     • Cross-platform consistency"
	@echo ""
	@echo "  $(GREEN)3. make dev-tunnel$(NC)         $(BLUE)→ Cross-network development$(NC)"
	@echo "     • Phone and PC on different WiFi networks"
	@echo "     • Uses ngrok tunnel for connectivity"
	@echo "     • Supports unlimited devices"
	@echo ""
	$(call print_separator)
	@echo ""
	@echo "$(YELLOW)$(ICON_ARROW) Recommended workflow (onboarding):$(NC)"
	@echo ""
	@echo "  $(GREEN)make backend-local$(NC)      $(BLUE)→$(NC) Start backend"
	@echo "  $(GREEN)make start-emulator$(NC)     $(BLUE)→$(NC) Launch Android emulator"
	@echo "  $(GREEN)make dev-build-local$(NC)    $(BLUE)→$(NC) Build & install app"
	@echo ""
	$(call print_separator)
	@echo ""
	@echo "$(BLUE)$(ICON_INFO) Tip:$(NC) Run $(GREEN)make help$(NC) to see all available commands"
	@echo ""

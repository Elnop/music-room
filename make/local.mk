# ==============================================================================
# Local Development Commands (No Docker)
# ==============================================================================
# Commands for local development, useful with Android Studio emulator

.PHONY: dev-local expo-android expo-clear check-devices start-emulator start-emulators start-emulators-app restart-emulators open-app kill-emulator restart-emulator list-emulators open-emulator

ADB := $(ANDROID_HOME)/platform-tools/adb

# Cold boot by default: the emulator neither resumes nor overwrites its saved
# state, so a frozen app or an old bundle does not come back. FAST=1 keeps
# Android's quick boot (resume the snapshot, save it on exit).
EMULATOR_FLAGS := -gpu swiftshader_indirect $(if $(FAST),,-no-snapshot-load -no-snapshot-save)

# Wait until Android reports the boot as complete (3 minutes max)
# Usage: @$(call wait_emulator_boot)
define wait_emulator_boot
	i=0; until [ "$$($(ADB) shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do \
		i=$$((i + 1)); \
		if [ $$i -gt 90 ]; then echo "$(RED)$(ICON_ERROR) Emulator did not boot within 3 minutes$(NC)"; exit 1; fi; \
		sleep 2; \
	done
endef

# The app calls the local backend, whatever mobile/.env says (see DEV_API_URL).
dev-local expo-android expo-clear: export EXPO_PUBLIC_API_URL := $(DEV_API_URL)
dev-local expo-android expo-clear: export EXPO_PUBLIC_WS_URL := $(DEV_WS_URL)

dev-local: .ensure-backend-deps .ensure-mobile-deps ## Start development locally (no Docker) - for Android Studio emulator
	@$(call write_mobile_dev_env)
	$(call print_header,Starting Local Development Mode)
	$(call print_success,Dependencies OK)
	$(call blank_line)
	$(call print_arrow,Starting backend server...)
	$(call npm_backend,run dev) &
	@sleep $(SHORT_WAIT_TIME)
	$(call print_success,Backend started: $(BACKEND_URL))
	$(call blank_line)
	$(call print_arrow,Starting Expo for Android...)
	$(call blank_line)
	$(call expo_mobile,start --localhost --android)

expo-android: ## Quick start: Open app directly in Android emulator
	@$(call write_mobile_dev_env)
	$(call print_info,📱 Opening in Android emulator...)
	$(call expo_mobile,start --localhost --android)

expo-clear: ## Start Expo with cleared cache (local)
	@$(call write_mobile_dev_env)
	$(call print_info,🧹 Starting Expo (cleared cache)...)
	$(call expo_mobile,start --localhost --clear)

check-devices: ## Check if Android device is connected
	$(call print_header,Checking Connected Devices)
	$(call print_subsection,📱 Android Devices)
	@if docker ps --format '{{.Names}}' | grep -q zumik-$(MOBILE_SERVICE); then \
		echo "$(BLUE)$(ICON_INFO) Using Docker container$(NC)"; \
		$(call docker_exec,zumik-$(MOBILE_SERVICE),adb devices) 2>/dev/null || echo "$(RED)$(ICON_ERROR) No devices$(NC)"; \
	else \
		if command -v adb >/dev/null 2>&1; then \
			echo "$(BLUE)$(ICON_INFO) Using local adb$(NC)"; \
			adb devices; \
		else \
			echo "$(RED)$(ICON_ERROR) adb not found$(NC)"; \
			echo "$(YELLOW)$(ICON_WARNING) Start Docker: make dev-docker$(NC)"; \
			echo "$(YELLOW)$(ICON_WARNING) Or install Android SDK$(NC)"; \
		fi; \
	fi
	$(call blank_line)
	$(call print_subsection,💡 Tips)
	@echo "   • Enable USB debugging on device"
	@echo "   • Accept USB authorization popup"
	@echo "   • Use $(GREEN)make dev-android$(NC) to launch"
	$(call blank_line)

start-emulator: ## Start the Android emulator, cold boot by default (AVD=name, FAST=1 to resume saved state)
	$(call print_header,Starting Android Emulator)
	$(call print_subsection,🔧 Configuration)
	@echo "   • GPU: Software rendering (swiftshader_indirect)"
	@echo "   • Fixes black screen issues on Linux"
	@echo "   • Boot: $(if $(FAST),quick boot (resumes saved state),cold boot (FAST=1 to resume saved state))"
	@echo ""
	$(call print_arrow,Checking for running emulators...)
	@RUNNING=$$($(ANDROID_HOME)/platform-tools/adb devices | grep emulator | wc -l); \
	if [ $$RUNNING -gt 0 ]; then \
		echo "$(YELLOW)$(ICON_WARNING) Emulator already running$(NC)"; \
		echo "$(BLUE)$(ICON_INFO) Use $(GREEN)make kill-emulator$(NC) to stop it first$(NC)"; \
		exit 1; \
	fi
	$(call blank_line)
	$(call print_arrow,Listing available AVDs...)
	@$(ANDROID_HOME)/emulator/emulator -list-avds | while read avd; do \
		echo "  $(GREEN)$$avd$(NC)"; \
	done
	$(call blank_line)
	$(call print_arrow,Starting emulator with software rendering...)
	@AVD="$(AVD)"; [ -n "$$AVD" ] || AVD=$$($(ANDROID_HOME)/emulator/emulator -list-avds | head -1); \
	if [ -z "$$AVD" ]; then \
		echo "$(RED)$(ICON_ERROR) No AVD found$(NC)"; \
		echo "$(YELLOW)$(ICON_WARNING) Create one in Android Studio: Tools > Device Manager$(NC)"; \
		exit 1; \
	fi; \
	echo "$(BLUE)$(ICON_INFO) Launching: $$AVD$(NC)"; \
	$(ANDROID_HOME)/emulator/emulator -avd $$AVD $(EMULATOR_FLAGS) > /dev/null 2>&1 &
	$(call blank_line)
	$(call print_info,⏳ Waiting for emulator to boot...)
	@$(call wait_emulator_boot)
	$(call blank_line)
	$(call print_success,Emulator started!)
	$(call print_info,Open Zumik on the emulator: it loads the code served by $(GREEN)make dev-docker$(NC) or $(GREEN)make dev-local$(NC))
	$(call blank_line)

start-emulators: ## Start two Android emulators for two-account tests (AVD1=name AVD2=name, FAST=1 to resume saved state)
	$(call print_header,Starting Two Android Emulators)
	@RUNNING=$$($(ADB) devices | grep emulator | wc -l); \
	if [ $$RUNNING -gt 0 ]; then \
		echo "$(YELLOW)$(ICON_WARNING) Emulator already running$(NC)"; \
		echo "$(BLUE)$(ICON_INFO) Use $(GREEN)make kill-emulator$(NC) to stop it first$(NC)"; \
		exit 1; \
	fi; \
	AVDS=$$($(ANDROID_HOME)/emulator/emulator -list-avds 2>/dev/null); \
	AVD1="$(AVD1)"; [ -n "$$AVD1" ] || AVD1=$$(echo "$$AVDS" | sed -n 1p); \
	AVD2="$(AVD2)"; [ -n "$$AVD2" ] || AVD2=$$(echo "$$AVDS" | grep -vxF "$$AVD1" | sed -n 1p); \
	if [ -z "$$AVD1" ] || [ -z "$$AVD2" ]; then \
		echo "$(RED)$(ICON_ERROR) Two AVDs are needed$(NC)"; \
		echo "$(YELLOW)$(ICON_WARNING) Create another one in Android Studio: Tools > Device Manager$(NC)"; \
		exit 1; \
	fi; \
	if [ "$$AVD1" = "$$AVD2" ]; then \
		echo "$(RED)$(ICON_ERROR) AVD1 and AVD2 must be different (one AVD cannot run twice)$(NC)"; \
		exit 1; \
	fi; \
	echo "$(BLUE)$(ICON_INFO) emulator-5554: $(GREEN)$$AVD1$(NC)"; \
	echo "$(BLUE)$(ICON_INFO) emulator-5556: $(GREEN)$$AVD2$(NC)"; \
	$(ANDROID_HOME)/emulator/emulator -avd "$$AVD1" -port 5554 $(EMULATOR_FLAGS) > /dev/null 2>&1 & \
	$(ANDROID_HOME)/emulator/emulator -avd "$$AVD2" -port 5556 $(EMULATOR_FLAGS) > /dev/null 2>&1 & \
	echo ""; \
	echo "$(BLUE)$(ICON_INFO) ⏳ Waiting for both emulators to boot...$(NC)"; \
	for serial in emulator-5554 emulator-5556; do \
		i=0; until [ "$$($(ADB) -s $$serial shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do \
			i=$$((i + 1)); \
			if [ $$i -gt 90 ]; then echo "$(RED)$(ICON_ERROR) $$serial did not boot within 3 minutes$(NC)"; exit 1; fi; \
			sleep 2; \
		done; \
		echo "$(GREEN)$(ICON_SUCCESS) $$serial booted$(NC)"; \
	done
	$(call blank_line)
	$(call print_info,Open the app on both: $(GREEN)make open-app$(NC))
	$(call blank_line)

# The app runs as the Zumik debug build (Expo Go cannot load its native modules,
# e.g. Google Sign-In). A debug build loads the JS from Metro on the host
# (10.0.2.2:8081 from an emulator), so it runs the current branch.
APP_PACKAGE := com.zumik.app
APP_APK_CACHE := $(HOME)/.cache/zumik/zumik-debug.apk

open-app: ## Launch the Zumik debug build on every running emulator, copying it where missing
	$(call print_header,Opening Zumik on Emulators)
	@DEVICES=$$($(ADB) devices | grep '^emulator' | grep -w device | cut -f1); \
	if [ -z "$$DEVICES" ]; then \
		echo "$(RED)$(ICON_ERROR) No emulator running$(NC)"; \
		echo "$(BLUE)$(ICON_INFO) Use $(GREEN)make start-emulators-app$(NC)"; \
		exit 1; \
	fi; \
	for serial in $$(echo "$$DEVICES"); do \
		if ! $(ADB) -s $$serial shell pm path $(APP_PACKAGE) 2>/dev/null | grep -q package; then \
			if [ ! -f "$(APP_APK_CACHE)" ]; then \
				for other in $$(echo "$$DEVICES"); do \
					APK=$$($(ADB) -s $$other shell pm path $(APP_PACKAGE) 2>/dev/null | grep base.apk | sed 's/^package://' | tr -d '\r'); \
					if [ -n "$$APK" ]; then \
						mkdir -p "$$(dirname "$(APP_APK_CACHE)")"; \
						$(ADB) -s $$other pull "$$APK" "$(APP_APK_CACHE)" > /dev/null 2>&1 && break; \
					fi; \
				done; \
			fi; \
			if [ ! -f "$(APP_APK_CACHE)" ]; then \
				echo "$(RED)$(ICON_ERROR) Zumik is not installed on $$serial nor on any other emulator$(NC)"; \
				echo "$(YELLOW)$(ICON_WARNING) Install a debug build once: cd mobile && npx expo run:android (it is then reused)$(NC)"; \
				exit 1; \
			fi; \
			echo "$(BLUE)$(ICON_INFO) Installing Zumik on $$serial...$(NC)"; \
			$(ADB) -s $$serial install -r "$(APP_APK_CACHE)" > /dev/null || exit 1; \
		fi; \
		$(ADB) -s $$serial shell am start -n $(APP_PACKAGE)/.MainActivity > /dev/null 2>&1 || exit 1; \
		echo "$(GREEN)$(ICON_SUCCESS) $$serial: Zumik started$(NC)"; \
	done; \
	echo "$(BLUE)$(ICON_INFO) ⏳ Checking the app stays open (a launch right after boot can crash)...$(NC)"; \
	sleep 20; \
	for serial in $$(echo "$$DEVICES"); do \
		if ! $(ADB) -s $$serial shell dumpsys activity activities 2>/dev/null | grep -m1 topResumedActivity | grep -q $(APP_PACKAGE); then \
			echo "$(YELLOW)$(ICON_WARNING) Zumik is not in the foreground on $$serial, relaunching$(NC)"; \
			$(ADB) -s $$serial shell am start -n $(APP_PACKAGE)/.MainActivity > /dev/null 2>&1 || exit 1; \
		fi; \
	done
	$(call blank_line)

start-emulators-app: ## Start two emulators and open the app on both (AVD1= AVD2=)
	@$(MAKE) --no-print-directory start-emulators
	@$(MAKE) --no-print-directory open-app

restart-emulators: ## Stop all emulators, cold boot two again (no saved state) and open the app on both
	@$(MAKE) --no-print-directory kill-emulator
	@i=0; while $(ADB) devices | grep -q emulator; do \
		i=$$((i + 1)); [ $$i -gt 30 ] && break; sleep 1; \
	done
	@$(MAKE) --no-print-directory start-emulators-app FAST=

restart-emulator: ## Stop the emulator and cold boot it again (AVD=name, FAST=1 to resume saved state)
	@$(MAKE) --no-print-directory kill-emulator
	@i=0; while $(ADB) devices | grep -q emulator; do \
		i=$$((i + 1)); [ $$i -gt 30 ] && break; sleep 1; \
	done
	@$(MAKE) --no-print-directory start-emulator

kill-emulator: ## Stop all running Android emulators
	$(call print_header,Stopping Android Emulators)
	$(call print_arrow,Checking for running emulators...)
	@RUNNING=$$($(ANDROID_HOME)/platform-tools/adb devices | grep emulator | wc -l); \
	if [ $$RUNNING -eq 0 ]; then \
		echo "$(YELLOW)$(ICON_WARNING) No emulators running$(NC)"; \
		exit 0; \
	fi
	$(call blank_line)
	$(call print_arrow,Killing emulators...)
	@$(ANDROID_HOME)/platform-tools/adb devices | grep emulator | cut -f1 | while read device; do \
		echo "  $(YELLOW)Stopping $$device$(NC)"; \
		$(ANDROID_HOME)/platform-tools/adb -s $$device emu kill 2>/dev/null || true; \
	done
	@sleep 2
	$(call print_success,All emulators stopped)
	$(call blank_line)

list-emulators: ## List all available Android Virtual Devices (AVDs)
	$(call print_header,Available Android Emulators)
	@if [ -z "$(ANDROID_HOME)" ]; then \
		echo "$(RED)$(ICON_ERROR) ANDROID_HOME not set$(NC)"; \
		exit 1; \
	fi
	@if [ ! -f "$(ANDROID_HOME)/emulator/emulator" ]; then \
		echo "$(RED)$(ICON_ERROR) Android emulator not found$(NC)"; \
		exit 1; \
	fi
	$(call print_subsection,📱 Available AVDs)
	@AVD_COUNT=$$($(ANDROID_HOME)/emulator/emulator -list-avds 2>/dev/null | wc -l); \
	if [ $$AVD_COUNT -eq 0 ]; then \
		echo "$(YELLOW)$(ICON_WARNING) No AVDs found$(NC)"; \
		echo "$(BLUE)$(ICON_INFO) Create one in Android Studio: Tools > Device Manager$(NC)"; \
	else \
		$(ANDROID_HOME)/emulator/emulator -list-avds 2>/dev/null | nl -w2 -s'. ' | while read line; do \
			echo "  $(GREEN)$$line$(NC)"; \
		done; \
	fi
	$(call blank_line)

open-emulator: ## Open a specific Android emulator (interactive selection or specify AVD=name)
	$(call print_header,Open Android Emulator)
	@if [ -z "$(ANDROID_HOME)" ]; then \
		echo "$(RED)$(ICON_ERROR) ANDROID_HOME not set$(NC)"; \
		exit 1; \
	fi
	@if [ ! -f "$(ANDROID_HOME)/emulator/emulator" ]; then \
		echo "$(RED)$(ICON_ERROR) Android emulator not found$(NC)"; \
		exit 1; \
	fi
	$(call print_arrow,Checking for running emulators...)
	@RUNNING=$$($(ANDROID_HOME)/platform-tools/adb devices | grep emulator | wc -l); \
	if [ $$RUNNING -gt 0 ]; then \
		echo "$(YELLOW)$(ICON_WARNING) Emulator already running$(NC)"; \
		$(ANDROID_HOME)/platform-tools/adb devices | grep emulator | while read device rest; do \
			echo "  $(GREEN)$$device$(NC) - $$rest"; \
		done; \
		echo ""; \
		echo "$(BLUE)$(ICON_INFO) Use $(GREEN)make kill-emulator$(NC) to stop running emulators$(NC)"; \
		exit 1; \
	fi
	@echo ""
	@if [ -n "$(AVD)" ]; then \
		echo "$(BLUE)$(ICON_INFO) Opening emulator: $(GREEN)$(AVD)$(NC)"; \
		$(ANDROID_HOME)/emulator/emulator -avd $(AVD) $(EMULATOR_FLAGS) > /dev/null 2>&1 & \
		echo ""; \
		echo "$(GREEN)$(ICON_SUCCESS) Emulator starting in background...$(NC)"; \
		echo "$(BLUE)$(ICON_INFO) Wait ~30 seconds for boot$(NC)"; \
		echo ""; \
	else \
		echo "$(YELLOW)📱 Available AVDs$(NC)"; \
		echo "$(YELLOW)──────────────────$(NC)"; \
		AVDS=$$($(ANDROID_HOME)/emulator/emulator -list-avds 2>/dev/null); \
		if [ -z "$$AVDS" ]; then \
			echo "$(RED)$(ICON_ERROR) No AVDs found$(NC)"; \
			echo "$(YELLOW)$(ICON_WARNING) Create one in Android Studio: Tools > Device Manager$(NC)"; \
			exit 1; \
		fi; \
		COUNT=1; \
		echo "$$AVDS" | while read avd; do \
			echo "  $(GREEN)$$COUNT.$(NC) $$avd"; \
			COUNT=$$((COUNT + 1)); \
		done; \
		echo ""; \
		printf "$(YELLOW)Select emulator (1-$$(echo "$$AVDS" | wc -l)): $(NC)"; \
		read -r SELECTION; \
		SELECTED_AVD=$$(echo "$$AVDS" | sed -n "$${SELECTION}p"); \
		if [ -z "$$SELECTED_AVD" ]; then \
			echo "$(RED)$(ICON_ERROR) Invalid selection$(NC)"; \
			exit 1; \
		fi; \
		echo ""; \
		echo "$(BLUE)$(ICON_INFO) Opening emulator: $(GREEN)$$SELECTED_AVD$(NC)"; \
		$(ANDROID_HOME)/emulator/emulator -avd $$SELECTED_AVD $(EMULATOR_FLAGS) > /dev/null 2>&1 & \
		echo ""; \
		echo "$(GREEN)$(ICON_SUCCESS) Emulator starting in background...$(NC)"; \
		echo "$(BLUE)$(ICON_INFO) Wait ~30 seconds for boot$(NC)"; \
		echo ""; \
	fi

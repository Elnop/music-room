# ==============================================================================
# Local Development Commands (No Docker)
# ==============================================================================
# Commands for local development, useful with Android Studio emulator

.PHONY: dev-local expo-android expo-clear check-devices start-emulator start-emulators .boot-emulators restart-emulators restart-emulators-clean clean-emulators .stop-emulators .clear-emulator-snapshots .clear-metro-cache .cache-app-apk .open-app-when-metro open-app kill-emulator restart-emulator list-emulators open-emulator

# Rendering goes through the host GPU: software rendering (swiftshader) puts the
# whole screen on the CPU and two emulators lag. GPU=swiftshader_indirect brings
# it back if the window stays black.
GPU ?= host

# Cold boot by default: the emulator neither resumes nor overwrites its saved
# state, so a frozen app or an old bundle does not come back. FAST=1 keeps
# Android's quick boot (resume the snapshot, save it on exit).
EMULATOR_FLAGS := -gpu $(GPU) -no-boot-anim $(if $(FAST),,-no-snapshot-load -no-snapshot-save)

# Two emulators share the CPU with Metro and the backend: each one gets fewer
# cores and less RAM than an AVD usually asks for.
EMULATOR_CORES ?= 2
EMULATOR_MEMORY ?= 2048
EMULATOR_PAIR_FLAGS := $(EMULATOR_FLAGS) -cores $(EMULATOR_CORES) -memory $(EMULATOR_MEMORY) $(if $(WIPE),-wipe-data)

AVD_HOME := $(or $(ANDROID_AVD_HOME),$(HOME)/.android/avd)
# The emulator VM itself (netsimd and crashpad_handler outlive it on purpose).
# [q] keeps pgrep/pkill from matching the shell that runs them.
EMULATOR_PROCESS := $(ANDROID_HOME)/emulator/qemu/.*/[q]emu-system

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
# The local backend reaches the Redis container through its published port.
dev-local: export REDIS_HOST := localhost

dev-local: .ensure-backend-deps .ensure-mobile-deps ## Start development locally (no Docker) - for Android Studio emulator
	$(SUPABASE_UP_IF_LOCAL)
	@$(call write_mobile_dev_env)
	$(call print_header,Starting Local Development Mode)
	$(call print_success,Dependencies OK)
	$(call blank_line)
	$(call print_arrow,Starting Redis (session revocation needs it)...)
	@$(call start_redis)
	$(call blank_line)
	$(call print_arrow,Starting backend server...)
	@cd $(BACKEND_DIR) && $(LOCAL_SUPABASE_ENV) npm run dev &
	@sleep $(SHORT_WAIT_TIME)
	$(call print_success,Backend started: $(BACKEND_URL))
	$(call blank_line)
	$(call print_arrow,Starting Metro; the Zumik debug build opens on the emulator once it is up...)
	$(call blank_line)
	@$(MAKE) --no-print-directory .open-app-when-metro &
	$(call expo_mobile,start --localhost --dev-client)

expo-android: ## Quick start: Start Metro and open the debug build on the Android emulator
	@$(call write_mobile_dev_env)
	$(call print_info,📱 Starting Metro, then opening the debug build on the emulator...)
	@$(MAKE) --no-print-directory .open-app-when-metro &
	$(call expo_mobile,start --localhost --dev-client)

# Wait (up to 2 minutes) until Metro answers, then open the debug build.
# Expo CLI's --android would open Expo Go, which cannot run the app.
.open-app-when-metro:
	@i=0; until curl -s --max-time 2 $(METRO_URL)/status | grep -q packager-status:running; do \
		i=$$((i + 1)); \
		if [ $$i -gt 60 ]; then echo "$(YELLOW)$(ICON_WARNING) Metro did not start; run make open-app once it is up$(NC)"; exit 0; fi; \
		sleep 2; \
	done; \
	$(MAKE) --no-print-directory open-app

expo-clear: ## Start Expo with cleared cache (local)
	@$(call write_mobile_dev_env)
	$(call print_info,🧹 Starting Expo (cleared cache)...)
	$(call expo_mobile,start --localhost --clear)

check-devices: ## Check if Android device is connected
	$(call print_header,Checking Connected Devices)
	$(call print_subsection,📱 Android Devices)
	@if command -v $(ADB) >/dev/null 2>&1; then \
		echo "$(BLUE)$(ICON_INFO) Using $(ADB)$(NC)"; \
		$(ADB) devices -l; \
	else \
		echo "$(RED)$(ICON_ERROR) adb not found: $(ADB)$(NC)"; \
		echo "$(YELLOW)$(ICON_WARNING) Set ANDROID_HOME, or pass ADB=<path to adb> (WSL2: doc/development/wsl2.md)$(NC)"; \
		exit 1; \
	fi
	$(call blank_line)
	$(call print_subsection,💡 Tips)
	@echo "   • Enable USB debugging on device"
	@echo "   • Accept USB authorization popup"
	@echo "   • Use $(GREEN)make dev-android$(NC) to launch"
	$(call blank_line)

start-emulator: ## Start the Android emulator and open the app, cold boot by default (AVD=name, FAST=1 to resume saved state)
	$(call print_header,Starting Android Emulator)
	$(call print_subsection,🔧 Configuration)
	@echo "   • GPU: $(GPU) (GPU=swiftshader_indirect if the screen stays black)"
	@echo "   • Boot: $(if $(FAST),quick boot (resumes saved state),cold boot (FAST=1 to resume saved state))"
	@echo ""
	$(call print_arrow,Checking for running emulators...)
	@RUNNING=$$($(ADB) devices | grep emulator | wc -l); \
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
	$(call print_arrow,Starting emulator...)
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
	@$(MAKE) --no-print-directory open-app

start-emulators: ## Start two Android emulators for two-account tests and open the app on both (AVD1=name AVD2=name, FAST=1 to resume saved state, GPU=, EMULATOR_CORES=, EMULATOR_MEMORY=)
	@$(MAKE) --no-print-directory .boot-emulators
	@$(MAKE) --no-print-directory open-app

# Boot two emulators on fixed ports, without opening the app
.boot-emulators:
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
	$(ANDROID_HOME)/emulator/emulator -avd "$$AVD1" -port 5554 $(EMULATOR_PAIR_FLAGS) > /dev/null 2>&1 & \
	$(ANDROID_HOME)/emulator/emulator -avd "$$AVD2" -port 5556 $(EMULATOR_PAIR_FLAGS) > /dev/null 2>&1 & \
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

# The app runs as the Zumik debug build (Expo Go cannot load its native modules,
# e.g. Google Sign-In). A debug build loads the JS from Metro on the host
# (10.0.2.2:8081 from an emulator), so it runs the current branch.
# The debug build is "Zumik Dev" (mobile/plugins/withDevVariant.js), next to the
# release; its activity keeps the namespace of the release.
APP_PACKAGE := com.zumik.app.dev
APP_ACTIVITY := $(APP_PACKAGE)/com.zumik.app.MainActivity
# The host as seen from an emulator. Android reports the boot as complete
# before its network is up: launched then, the app misses Metro and shows
# "Unable to load script", so open-app waits until Metro answers here.
EMULATOR_HOST := 10.0.2.2
APP_APK_CACHE := $(HOME)/.cache/zumik/zumik-dev-debug.apk

# Copy the debug build from a running emulator into APP_APK_CACHE, once
.cache-app-apk:
	@[ -f "$(APP_APK_CACHE)" ] && exit 0; \
	for serial in $$($(ADB) devices | grep '^emulator' | grep -w device | cut -f1); do \
		APK=$$($(ADB) -s $$serial shell pm path $(APP_PACKAGE) 2>/dev/null | grep base.apk | sed 's/^package://' | tr -d '\r'); \
		if [ -n "$$APK" ]; then \
			mkdir -p "$$(dirname "$(APP_APK_CACHE)")"; \
			$(ADB) -s $$serial pull "$$APK" "$(APP_APK_CACHE)" > /dev/null 2>&1 && exit 0; \
		fi; \
	done; \
	rm -f "$(APP_APK_CACHE)"

open-app: ## Launch the Zumik debug build on every running emulator, copying it where missing
	$(call print_header,Opening Zumik on Emulators)
	@DEVICES=$$($(ADB) devices | grep '^emulator' | grep -w device | cut -f1); \
	if [ -z "$$DEVICES" ]; then \
		echo "$(RED)$(ICON_ERROR) No emulator running$(NC)"; \
		echo "$(BLUE)$(ICON_INFO) Use $(GREEN)make start-emulator$(NC) or $(GREEN)make start-emulators$(NC)"; \
		exit 1; \
	fi; \
	METRO=1; \
	if ! curl -s --max-time 2 $(METRO_URL)/status | grep -q packager-status:running; then \
		METRO=; \
		echo "$(YELLOW)$(ICON_WARNING) Metro is not running on $(METRO_URL): the app opens on \"Unable to load script\"$(NC)"; \
		echo "$(BLUE)$(ICON_INFO) Start it with $(GREEN)make dev-local$(NC) or $(GREEN)make dev-docker$(NC), then tap RELOAD in the app$(NC)"; \
	fi; \
	for serial in $$(echo "$$DEVICES"); do \
		if [ -n "$$METRO" ]; then \
			i=0; until $(ADB) -s $$serial shell 'printf "GET /status HTTP/1.0\r\n\r\n" | toybox nc -w 2 $(EMULATOR_HOST) $(METRO_PORT)' 2>/dev/null | grep -q packager-status:running; do \
				i=$$((i + 1)); \
				if [ $$i -gt 30 ]; then echo "$(YELLOW)$(ICON_WARNING) $$serial cannot reach Metro yet, launching anyway$(NC)"; break; fi; \
				sleep 2; \
			done; \
		fi; \
		if ! $(ADB) -s $$serial shell pm path $(APP_PACKAGE) 2>/dev/null | grep -q package; then \
			$(MAKE) --no-print-directory .cache-app-apk; \
			if [ ! -f "$(APP_APK_CACHE)" ]; then \
				echo "$(RED)$(ICON_ERROR) Zumik is not installed on $$serial nor on any other emulator$(NC)"; \
				echo "$(YELLOW)$(ICON_WARNING) Install a debug build once: cd mobile && npx expo run:android --app-id com.zumik.app.dev --no-bundler (it is then reused)$(NC)"; \
				exit 1; \
			fi; \
			echo "$(BLUE)$(ICON_INFO) Installing Zumik on $$serial...$(NC)"; \
			$(ADB) -s $$serial install -r "$(APP_APK_CACHE)" > /dev/null || exit 1; \
		fi; \
		$(ADB) -s $$serial shell am start -n $(APP_ACTIVITY) > /dev/null 2>&1 || exit 1; \
		echo "$(GREEN)$(ICON_SUCCESS) $$serial: Zumik started$(NC)"; \
	done; \
	echo "$(BLUE)$(ICON_INFO) ⏳ Checking the app stays open (a launch right after boot can crash)...$(NC)"; \
	sleep 20; \
	for serial in $$(echo "$$DEVICES"); do \
		if ! $(ADB) -s $$serial shell dumpsys activity activities 2>/dev/null | grep -m1 topResumedActivity | grep -q $(APP_PACKAGE); then \
			echo "$(YELLOW)$(ICON_WARNING) Zumik is not in the foreground on $$serial, relaunching$(NC)"; \
			$(ADB) -s $$serial shell am start -n $(APP_ACTIVITY) > /dev/null 2>&1 || exit 1; \
		fi; \
	done
	$(call blank_line)

restart-emulators: ## Stop all emulators, cold boot two again (no saved state) and open the app on both
	@$(MAKE) --no-print-directory kill-emulator
	@i=0; while $(ADB) devices | grep -q emulator; do \
		i=$$((i + 1)); [ $$i -gt 30 ] && break; sleep 1; \
	done
	@$(MAKE) --no-print-directory start-emulators FAST=

restart-emulators-clean: ## Restart two emulators with no cache: snapshots, Metro cache and app data cleared (WIPE=1 also resets the AVDs)
	$(call print_header,Restarting Emulators With a Clean Cache)
	@if [ -n "$(WIPE)" ]; then \
		$(MAKE) --no-print-directory .cache-app-apk; \
		if [ ! -f "$(APP_APK_CACHE)" ]; then \
			echo "$(RED)$(ICON_ERROR) WIPE=1 removes Zumik and no copy of it is cached to reinstall it$(NC)"; \
			echo "$(BLUE)$(ICON_INFO) Start an emulator where Zumik is installed first, or run without WIPE=1$(NC)"; \
			exit 1; \
		fi; \
	fi
	@$(MAKE) --no-print-directory .stop-emulators
	@$(MAKE) --no-print-directory .clear-emulator-snapshots
	@$(MAKE) --no-print-directory .clear-metro-cache
	@$(MAKE) --no-print-directory .boot-emulators FAST=
	@for serial in emulator-5554 emulator-5556; do \
		if $(ADB) -s $$serial shell pm path $(APP_PACKAGE) 2>/dev/null | grep -q package; then \
			$(ADB) -s $$serial shell pm clear $(APP_PACKAGE) > /dev/null 2>&1 \
				&& echo "$(GREEN)$(ICON_SUCCESS) $$serial: Zumik data cleared$(NC)"; \
		elif [ -f "$(APP_APK_CACHE)" ]; then \
			$(ADB) -s $$serial install "$(APP_APK_CACHE)" > /dev/null \
				&& echo "$(GREEN)$(ICON_SUCCESS) $$serial: Zumik reinstalled$(NC)"; \
		fi; \
	done
	@$(MAKE) --no-print-directory open-app

clean-emulators: ## Stop the emulators and remove their snapshots, stale locks and the cached Zumik APK
	$(call print_header,Cleaning Android Emulators)
	@$(MAKE) --no-print-directory .stop-emulators
	@$(MAKE) --no-print-directory .clear-emulator-snapshots
	@rm -rf "$$(dirname "$(APP_APK_CACHE)")"
	$(call print_success,Cached Zumik APK removed)
	$(call blank_line)

# Stop every emulator, kill the ones that ignore "adb emu kill" (frozen), then
# remove the lock files a crashed emulator leaves behind
.stop-emulators:
	@$(MAKE) --no-print-directory kill-emulator
	@i=0; while pgrep -u "$$(id -u)" -f "$(EMULATOR_PROCESS)" > /dev/null; do \
		i=$$((i + 1)); \
		if [ $$i -gt 15 ]; then \
			echo "$(YELLOW)$(ICON_WARNING) Emulator still running, killing it$(NC)"; \
			pkill -9 -u "$$(id -u)" -f "$(EMULATOR_PROCESS)"; sleep 1; break; \
		fi; \
		sleep 1; \
	done
	@find "$(AVD_HOME)" -mindepth 2 -maxdepth 2 -path "*.avd/*.lock" -exec rm -rf {} +
	$(call print_success,Emulators stopped and lock files removed)

# Snapshots only serve quick boot (FAST=1) and take several GB per AVD
.clear-emulator-snapshots:
	@SIZE=$$(find "$(AVD_HOME)" -mindepth 2 -maxdepth 2 -path "*.avd/snapshots" -exec du -shc {} + 2>/dev/null | tail -1 | cut -f1); \
	find "$(AVD_HOME)" -mindepth 3 -maxdepth 3 -path "*.avd/snapshots/*" -exec rm -rf {} +; \
	echo "$(GREEN)$(ICON_SUCCESS) Emulator snapshots removed ($${SIZE:-0} freed)$(NC)"

# Metro keeps its cache in memory while it runs: only a stopped Metro can be
# cleared, a running one must be restarted with make expo-clear
.clear-metro-cache:
	@if curl -s --max-time 2 $(METRO_URL)/status | grep -q packager-status:running; then \
		echo "$(YELLOW)$(ICON_WARNING) Metro is running, its cache is kept: stop it and run $(GREEN)make expo-clear$(NC)"; \
	else \
		find "$${TMPDIR:-/tmp}" -mindepth 1 -maxdepth 1 -user "$$(id -u)" \( -name "metro-*" -o -name "haste-map-*" \) -exec rm -rf {} +; \
		rm -rf mobile/node_modules/.cache; \
		echo "$(GREEN)$(ICON_SUCCESS) Metro cache removed$(NC)"; \
	fi

restart-emulator: ## Stop the emulator and cold boot it again (AVD=name, FAST=1 to resume saved state)
	@$(MAKE) --no-print-directory kill-emulator
	@i=0; while $(ADB) devices | grep -q emulator; do \
		i=$$((i + 1)); [ $$i -gt 30 ] && break; sleep 1; \
	done
	@$(MAKE) --no-print-directory start-emulator

kill-emulator: ## Stop all running Android emulators
	$(call print_header,Stopping Android Emulators)
	$(call print_arrow,Checking for running emulators...)
	@RUNNING=$$($(ADB) devices | grep emulator | wc -l); \
	if [ $$RUNNING -eq 0 ]; then \
		echo "$(YELLOW)$(ICON_WARNING) No emulators running$(NC)"; \
		exit 0; \
	fi
	$(call blank_line)
	$(call print_arrow,Killing emulators...)
	@$(ADB) devices | grep emulator | cut -f1 | while read device; do \
		echo "  $(YELLOW)Stopping $$device$(NC)"; \
		$(ADB) -s $$device emu kill 2>/dev/null || true; \
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

open-emulator: ## Open a specific Android emulator and the app on it (interactive selection or specify AVD=name)
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
	@RUNNING=$$($(ADB) devices | grep emulator | wc -l); \
	if [ $$RUNNING -gt 0 ]; then \
		echo "$(YELLOW)$(ICON_WARNING) Emulator already running$(NC)"; \
		$(ADB) devices | grep emulator | while read device rest; do \
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
	fi
	$(call print_info,⏳ Waiting for emulator to boot...)
	@$(call wait_emulator_boot)
	$(call print_success,Emulator started!)
	@$(MAKE) --no-print-directory open-app

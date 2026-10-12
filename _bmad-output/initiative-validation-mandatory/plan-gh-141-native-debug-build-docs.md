---
title: 'Docs and make messages: run the app as a native debug build, not Expo Go'
type: 'chore'
ticket: ''
created: '2026-10-10'
status: 'built'
baseline_revision: '62bc13fcb5fca2c926a074b75a5c6098e8d33a37'
route: 'full'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The app crashes at startup in Expo Go (`RNGoogleSignin` and other native modules are missing there), yet `AGENTS.md`, the READMEs, `doc/TUNNEL_MODE.md` and the `make` messages still tell people to scan a QR code with Expo Go (GitHub #141). Team decision (2026-10-07): run the native debug build (`com.zumik.app`, `npx expo run:android`), do not make Expo Go compatible.

**Approach:** Rewrite every "launch with Expo Go" instruction into the debug build flow: get it (`cd mobile && npx expo run:android`, or `make open-app`, which copies it between emulators), point it at Metro (emulator, USB phone, Wi-Fi phone, tunnel), and make `AGENTS.md` say the app needs a native debug build and does not run in Expo Go. Stop the mobile container from presenting itself as Expo Go if an Expo CLI option allows it without breaking Metro.

## Boundaries & Constraints

**Always:** Keep every `make` target name (`qr`, `qr-tunnel`, `open-app`, ...) working; only their output and help text change. Mentions of Expo Go that explain why it is not used are fine; no text may present it as a way to run the app. Commands quoted in docs must exist (check `make help`, `mobile/package.json`).

**Never:** No change to app code or native config, no `expo-dev-client` dependency, no EAS build setup, no change to backend.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Emulator | README followed on a machine with an Android emulator | `make dev-local` (or `make dev-docker` + `make open-app`) shows the app loaded from Metro | `open-app` already explains a missing build / Metro |
| Phone, USB | Android phone over adb | `npx expo run:android --device` installs it; `adb reverse tcp:8081 tcp:8081` lets it reach Metro | docs say what to do on "Unable to load script" |
| Phone, same Wi-Fi | debug build installed | dev menu › Change bundle location › `<HOST_IP>:8081` | same |
| Phone, other network | `make dev-tunnel` | dev menu bundle location set to the Expo tunnel host shown by `make qr-tunnel` | documented as the tunnel path |

</frozen-after-approval>

## Code Map

- `AGENTS.md:31` -- "Google and Facebook sign-in need a development build; they fail in Expo Go" -> the whole app needs the native debug build and does not start in Expo Go.
- `README.md` (troubleshooting ~line 144 and any start-up section) -- Expo Go OAuth entry; describe debug build start-up.
- `mobile/README.md:55-125, 174` -- "Développement avec Expo Go", `start:lan` "recommandé avec Expo Go", OAuth note; French, keep the language of each file.
- `doc/TUNNEL_MODE.md:27,120,180-181,398,521` -- QR + Expo Go steps for tunnel mode.
- `make/docker.mk:24,55-67` -- "Open Expo Go and scan the QR code", `qr` target instructions.
- `make/helpers/echo.mk:97-116` -- `display_qr` ("Scan with Expo Go app", greps the QR from mobile container logs); rename/reword so it shows the Metro address to enter (LAN `$(HOST_IP):$(METRO_PORT)`; tunnel: the Expo tunnel host from the container logs / `mobile/scripts/start-expo-tunnel.sh` output) plus the steps; callers in `make/docker.mk`, `make/tunnel.mk`.
- `make/helpers/utils.mk`, `make/help.mk:52,93` -- help texts mentioning QR / Expo Go.
- `make/local.mk:172-260` -- `open-app`, `.cache-app-apk`, `APP_PACKAGE`, `EMULATOR_HOST`: the existing debug build flow to point docs at; do not change its logic.
- `mobile/scripts/start-expo.sh`, `start-expo-tunnel.sh` -- `npx expo start --offline --port 8081` / `--host tunnel`; Expo CLI prints "Using Expo Go" when `expo-dev-client` is absent. Try `--dev-client`: keep it only if Metro still serves the bundle (`curl localhost:8081/status` = `packager-status:running` and an emulator debug build reloads); otherwise leave the flags and note it.
- `mobile/index.ts:6` -- Expo template comment, leave as is.

## Tasks & Acceptance

**Execution:**
- [x] `AGENTS.md` -- one line: the app runs only as a native debug build (`cd mobile && npx expo run:android`), not in Expo Go (native modules: Google/Facebook sign-in, image colors).
- [x] `README.md`, `mobile/README.md`, `doc/TUNNEL_MODE.md` -- replace Expo Go flows with: get the debug build, run Metro (`make dev-docker` / `make dev-local` / `make dev-tunnel`), connect it (emulator automatic via 10.0.2.2; USB `adb reverse`; Wi-Fi bundle location; tunnel bundle location); iOS: `npx expo run:ios` on macOS.
- [x] `make/helpers/echo.mk`, `make/docker.mk`, `make/tunnel.mk`, `make/helpers/utils.mk`, `make/help.mk` -- messages and `qr`/`qr-tunnel` output describe connecting the debug build; no Expo Go wording.
- [x] `mobile/scripts/start-expo.sh`, `start-expo-tunnel.sh` -- `--dev-client` only if verified harmless.

**Acceptance Criteria:**
- Given the repo, when running `git grep -n -i "expo go" -- . ':(exclude)_bmad-output' ':(exclude)_bmad'`, then no remaining line presents Expo Go as a way to run the app.
- Given `make -n dev-docker qr qr-tunnel open-app`, then all parse.

## Implementation Notes

- `display_qr` became `display_metro_connect` (`make/helpers/echo.mk`): LAN prints emulator (`make open-app`, `10.0.2.2:8081`), USB (`adb reverse`), Wi-Fi (Change Bundle Location › `$(METRO_ADDRESS)`); tunnel greps the `*.exp.direct` host from the mobile container logs (matches both the `exp://` and the URL-encoded dev-client form) and tells to enter `<host>:80`.
- `EXPO_URL` (`exp://...`) replaced by `METRO_ADDRESS` (`$(HOST_IP):$(METRO_PORT)`) in `make/config.mk`, used by `make info`. Dead `docker_logs_qr` helper removed from `make/helpers/docker.mk`.
- `--dev-client` kept in both start scripts: verified in the running mobile container that `npx expo start --offline --dev-client` serves `/status` = `packager-status:running` and `index.bundle?platform=android&dev=true` (HTTP 200, ~13.9 MB, 1920 modules). It only changes the URL Expo CLI prints/launches; the debug build fetches the bundle directly. Emulator reload not run (no emulator / cached APK available).
- Not changed (outside the task list): `make dev-local` runs `expo start --localhost --android`, which without `--dev-client` makes Expo CLI open Expo Go on the emulator; `make dev` (`make/dev-menu.mk`) advertises `make dev-build-local`, which does not exist.

## Plan Change Log

## Review Triage Log

Quick review, 4 findings: 1 medium, 2 low patched; 1 maybe-false deferred.

- medium, patched: `make dev-local` / `expo-android` ran `expo start --localhost --android`, which opens Expo Go on the emulator; they now start Metro with `--dev-client` and a background `.open-app-when-metro` waits for Metro, then runs `make open-app` (the debug build).
- low, patched: `make dev` and `make check-setup` sent people to `make dev-build-local`, which does not exist; replaced with `npx expo run:android --no-bundler` then `make dev-local`.
- low, patched: `npx expo run:android` starts its own Metro on 8081, clashing with `make dev-docker` / `dev-local`; the install step now uses `--no-bundler` everywhere it is described.
- maybe-false, deferred: the tunnel bundle location (`<host>.exp.direct:80`) is documented but untested on a phone; would be medium if wrong. Entry in deferred-work.md.

Patches applied by the orchestrator (the implementer session ended on a rate limit). Re-checked: `make -n dev-docker dev-tunnel qr qr-tunnel dev-local` parse; `git grep -i "expo go"` only shows "not Expo Go" explanations.

## Verification

**Commands:**
- `make -n dev-docker dev-tunnel qr qr-tunnel open-app` -- expected: parse.
- `git grep -n -i "expo go"` -- expected: only "not Expo Go" explanations.

**Manual checks (if no CLI):**
- With an emulator holding `com.zumik.app`: `make dev-local` opens the app against Metro.

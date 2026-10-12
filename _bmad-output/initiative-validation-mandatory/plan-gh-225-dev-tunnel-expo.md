---
title: 'make dev-tunnel starts Expo in tunnel mode'
type: 'bugfix'
ticket: ''
created: '2026-10-10'
status: 'built'
baseline_revision: '3fecebe2656a811b157b4559755e7ce792a334ae'
route: 'oneshot'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `make dev-tunnel` starts the same mobile container as LAN mode (`start-expo.sh`, `npx expo start --offline`, LAN host name and API URL), so only the backend goes through ngrok and a phone on another network cannot load the app from the QR code (GitHub #225).

**Approach:** In tunnel mode, run the mobile container with `scripts/start-expo-tunnel.sh`, without `EXPO_DEVTOOLS_LISTEN_ADDRESS`, with the backend tunnel URL for `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_WS_URL`.

</frozen-after-approval>

## Implementation Notes

Oneshot:
- `make/helpers/docker.mk`: `start_mobile_tunnel` (command `sh scripts/start-expo-tunnel.sh`, `tunnel-info` volume, `--env-file mobile/.env`, Metro port only; no `REACT_NATIVE_PACKAGER_HOSTNAME` / `EXPO_DEVTOOLS_LISTEN_ADDRESS` / LAN `EXPO_PUBLIC_*`, and no `write_mobile_dev_env`, since the script writes the tunnel URLs to `.env.development.local`). `docker_up_tunnel` uses it.
- Containers were reused whenever running, so `make dev-tunnel` after `make dev-docker` kept the LAN backend and mobile. New `zumik.mode` label (`lan` / `tunnel`) on backend and mobile; each start function reuses a running container only in its own mode (unlabelled = lan), else recreates it.
- `start_mobile_tunnel` always recreates the mobile container (a running one keeps the backend URL it read at start).
- `mobile/scripts/start-expo-tunnel.sh`: accepts the URL only once `<url>/health` answers (node `fetch`, `ngrok-skip-browser-warning`), up to 60 s; `backend/scripts/start-with-tunnel.sh` deletes the previous run's URL file before starting ngrok. `${BACKEND_TUNNEL_URL/https/wss}` is bash-only; the image's `/bin/sh` is dash (`Bad substitution`), so the script died before Expo. Replaced with `sed`. Its help text no longer points at `make logs-backend` / `docker compose`.
- Checked: the script under dash with a fake tunnel file and a stub `npx` writes `EXPO_PUBLIC_API_URL=https://…`, `EXPO_PUBLIC_WS_URL=wss://…` and runs `npx expo start --host tunnel --port 8081`; `make -n dev-tunnel` parses. The end-to-end check (ngrok token, phone on mobile data) is left to the user.
- `doc/TUNNEL_MODE.md`: #210's "known gap" notes removed, containers section and the LAN-mode troubleshooting entry updated.
- Out of scope, ticketed: `npm run dev:tunnel` points to a missing script (#228).

## Verification

**Manual checks:**
- `make dev-tunnel` (with `NGROK_AUTHTOKEN`), then `make qr-tunnel` shows an `exp.direct` QR; a phone on mobile data opens the app and reaches the backend tunnel.

## Review Triage Log

Quick review, 2 findings: 1 high, 1 low, both patched.

- high, patched: the `tunnel-info` volume keeps the previous run's URL file, so mobile could start Expo on a dead tunnel (old URL after a restart, or a backend that exited early, e.g. no NGROK_AUTHTOKEN), and a reused mobile container kept its old URL when the backend was recreated. The backend script deletes the file first, the mobile script health-checks the URL before accepting it, and `make dev-tunnel` always recreates mobile. Checked with a stale URL (nothing listening) then a live one: the stale one is rejected, the live one accepted.
- low, patched: the troubleshooting check's wording about which value Expo uses. The reviewer suggested `docker exec … printenv`, but that shows the container's environment, not the script's exports; kept `cat .env.development.local` (same value the script exports) with accurate wording.

---
title: 'Fix docker exec -T and the tunnel URL file in the make targets'
type: 'bugfix'
ticket: ''
created: '2026-10-10'
status: 'built'
baseline_revision: '8c4042839bc0c1338a08b659823d313afebd5e95'
route: 'oneshot'
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

**Problem:** `docker exec -T` is a `docker compose exec` flag (`docker exec` answers `unknown shorthand flag: 'T'`), used by `qr-tunnel`, `tunnel-info` and `docker_exec_no_tty`; and `qr-tunnel` / `tunnel-info` read `/tmp/backend-tunnel-url.txt` while `start-with-tunnel.sh` writes `/tmp/shared/backend-tunnel-url.txt` (GitHub #224).

**Approach:** Drop `-T` and read `$(SHARED_TUNNEL_FILE)`; remove `TUNNEL_URL_FILE` once unused.

</frozen-after-approval>

## Implementation Notes

Oneshot: `make/tunnel.mk` (`qr-tunnel`, `tunnel-info`), `make/helpers/docker.mk` (`docker_exec_no_tty`, unused but fixed, comment corrected), `make/helpers/echo.mk` (`display_tunnel_urls`, shown by `make dev-tunnel`, had the same wrong path), `make/config.mk` (`TUNNEL_URL_FILE` removed). Checked with `BACKEND_CONTAINER=` pointed at a throwaway container holding `/tmp/shared/backend-tunnel-url.txt`: `make qr-tunnel` and `make tunnel-info` print the URL.

## Verification

**Manual checks:**
- With `make dev-tunnel` running, `make qr-tunnel` and `make tunnel-info` print the ngrok URL.

## Review Triage Log

Quick review, 2 findings: 1 low patched, 1 false.

- low, patched: the cleanup targets (`make/cleanup.mk`, `make/helpers/cleanup.mk`) still removed the old host path `/tmp/backend-tunnel-url.txt`, which nothing creates; lines dropped (the real file lives in the `tunnel-info` volume, already removed there).
- false: `ticket: ''` is the template's value outside the ticket tree.

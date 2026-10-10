---
title: 'Rewrite the Docker Compose passages of TUNNEL_MODE.md and REDIS.md'
type: 'chore'
ticket: ''
created: '2026-10-10'
status: 'built'
baseline_revision: 'dac2841f1979e4b5a87633fed5747740a5ebfbdb'
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

**Problem:** The repository has no compose file (containers start with `docker run` in `make/helpers/docker.mk`), but `doc/TUNNEL_MODE.md` and `doc/REDIS.md#redis-in-production` still give `docker compose` commands and `docker-compose.yml` snippets (GitHub #210).

**Approach:** Rewrite those passages with the real make targets and `docker run` / `docker exec` commands.

</frozen-after-approval>

## Implementation Notes

Oneshot, docs only:
- `TUNNEL_MODE.md`: every Compose command replaced with `docker exec zumik-…` or make targets (`make tunnel-setup`, `make dev-tunnel`); tunnel URL path corrected to `/tmp/shared/backend-tunnel-url.txt` (`tunnel-info` volume); the override section becomes "How `make dev-tunnel` starts the containers"; `make logs-backend` (no such target) replaced with `docker logs zumik-backend`; `printenv TUNNEL_URL` (exported by the script, not on the container) replaced with the backend's "Tunnel CORS enabled" log line; "Already fixed in docker-compose…" entries rewritten to what `start_mobile` does.
- Found while reading: `make dev-tunnel` does not start Expo with `--tunnel` (mobile runs `start-expo.sh` like LAN mode); the guide now says so in a note at the top and in the containers section, and #225 tracks it. Also `docker exec -T` (a compose-only flag) and the wrong tunnel file path in `qr-tunnel` / `tunnel-info`: #224.
- `REDIS.md` production: a `docker run` command (no published port, `--requirepass`, `--appendonly`, `--maxmemory`), with `noeviction` instead of the old `allkeys-lru` (an LRU policy would evict lockouts and revocations first).
- `SECURITY.md`: pointer to the REDIS.md production section.
- `grep -rni compose doc/`: only sentences saying there is no compose file.

## Verification

**Commands:**
- `grep -rni "docker compose\|docker-compose" doc/` -- expected: only SECURITY.md's "no docker-compose.yml" statement

## Review Triage Log

Quick review, 4 findings, all low (docs), all patched.

- `make logs-backend` (no such target) was still in two places; replaced with `docker logs zumik-backend`.
- REDIS.md overstated `noeviction`: lockouts and the IP blacklist fail open on write errors (`brute-force.service.ts`). The paragraph now says which parts fail closed and which stop counting.
- The EXPO_DEVTOOLS_LISTEN_ADDRESS entry kept a stale Problem/Solution next to the new current-state text; rewritten as the current behavior, #225.
- Passages still assumed the Expo tunnel runs (architecture item, checklist line, `make logs-mobile | grep EXPO_PUBLIC_API_URL`, which also never ends); annotated with #225, the checklist line removed, the check replaced with `docker exec zumik-mobile printenv EXPO_PUBLIC_API_URL`.

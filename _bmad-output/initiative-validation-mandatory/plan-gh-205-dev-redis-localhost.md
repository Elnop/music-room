---
title: 'Publish dev Redis on localhost only'
type: 'bugfix'
ticket: ''
created: '2026-10-10'
status: 'built'
baseline_revision: '8462bda45e506e9dbcd6cf405e9e88e3f4a793c0'
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

**Problem:** `start_redis` in `make/helpers/docker.mk` publishes port 6379 on every host interface without a password, so anyone on the network can wipe the lockouts, IP blacklist and token revocation list (threat model L8, GitHub #205).

**Approach:** Publish on `127.0.0.1` only (`-p 127.0.0.1:6379:6379`); `make dev-docker` keeps working.

</frozen-after-approval>

## Implementation Notes

Oneshot, one line in `make/helpers/docker.mk` (the only `docker run` for Redis; `redis-start` goes through `ensure_redis_started` → `start_redis`).
- Who reaches Redis: the backend container through the Docker network (`REDIS_HOST=zumik-redis`), `make dev-local` on the host through localhost (`make backend-local` reads `REDIS_HOST` from `backend/.env`, default `redis`), `redis-cli` through localhost. None needs the LAN.
- Checked with a throwaway container using the same `-p 127.0.0.1:...` form: reachable on 127.0.0.1, connection refused on the host's LAN address; the running `zumik-redis` (old `0.0.0.0` publication) is reachable from the LAN until recreated: `start_redis` keeps a running container (also across `make redis-restart` and reboots), and recreates a stopped one. Documented in `doc/SECURITY.md`.
- No password added: the issue offers it as optional; dev keeps `REDIS_PASSWORD` empty, noted as the remaining exposure (host processes, Docker network).
- `doc/THREAT_MODEL.md` L8 fixed; `doc/SECURITY.md` Redis section rewritten.

## Verification

**Manual checks:**
- `docker rm -f zumik-redis && make dev-docker`, then `docker port zumik-redis` shows `127.0.0.1:6379`, backend logs Redis connected.

## Review Triage Log

Quick review, 4 findings: 3 low patched (docs), 1 false.

- low, patched: SECURITY.md said `make backend-local` reaches Redis through localhost; that target reads `REDIS_HOST` from `backend/.env` (default `redis`). Now names `make dev-local` and says what `backend-local` needs.
- low, patched: "an old container keeps the old publication" was too broad: only a running one (also across `redis-restart` and reboots); a stopped one is recreated.
- low, patched: SECURITY.md now says L8 is fixed by #205 (remaining: no password), matching THREAT_MODEL.md.
- false: `ticket: ''` is the template's value outside the ticket tree; the PR carries `Closes #205`.

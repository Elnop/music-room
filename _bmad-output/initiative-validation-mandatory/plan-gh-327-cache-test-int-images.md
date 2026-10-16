---
title: 'Cache the test-int Docker images between CI runs (#327)'
type: 'chore'
ticket: ''
created: '2026-10-16'
status: 'built'
baseline_revision: '14c2729192086fa7b0fe4dd4530ca34976fe80d5'
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

**Problem:** The CI `test-int` job pulls the Supabase and Redis images anonymously from ECR Public on every run. Since 2026-10-15 these pulls fail with `toomanyrequests: Data limit exceeded`, ECR Public's anonymous data quota on the IPs that GitHub runners share. Every PR is blocked, whatever it touches (#326, #328).

**Approach:**
- Cache the images used by the test stack between runs with `actions/cache`.
- Restore and `docker load` them before `scripts/test-db.sh up`.
- On a cache miss, `docker save` the images of the stack's containers right after `up` and save the cache.
- The cache key hashes `backend/package-lock.json` (Supabase CLI version), `backend/supabase/config.toml` (Postgres version) and `backend/scripts/test-db.sh` (Redis image).
- No secret needed.

</frozen-after-approval>

## Implementation Notes

Oneshot: one CI file, ~20 lines.
- `.github/workflows/ci.yml`, job `test-int`:
  - `actions/cache/restore` and `actions/cache/save`, pinned by SHA like the other actions (v6.1.0 = `55cc8345863c7cc4c66a329aec7e433d2d1c52a9`).
  - Images are listed from `docker ps -a --format '{{.Image}}'` after `up` (only what the stack uses) and compressed with `zstd` (present on ubuntu-24.04).
  - `supabase start` does not pull an image that is already present.
- The first run after a change of key still needs one successful pull: if the quota is still exhausted, that run fails as before and the next one fills the cache.
- `doc/TESTING.md` describes the CI job: add one line on the cache.

## Verification

**Commands:**
- actionlint on `.github/workflows/ci.yml` -- expected: no new error
- CI run on the PR -- expected: `test-int` green; a second run logs a cache hit and `docker load`

## Review Triage Log

- Pass 1 (quick): 3 findings. 1 medium patched, 1 documented, 1 false.
  - medium, patch: without `restore-keys`, any change to `backend/package-lock.json` dropped the whole cache and pulled every image anonymously again. Fix: `restore-keys: test-int-images-`, with the load gated on `cache-matched-key`, so only the images that are missing get pulled. The save on a partial match still writes the new key.
  - real, documented: a cache saved on a PR run (`refs/pull/N/merge`) is visible only to that PR and to `develop`'s cache. Other PRs benefit once the cache is saved on `develop`. Noted in `doc/TESTING.md` and in the PR.
  - false: "verification not run". actionlint 1.7.7 was run through Docker (no new error; the `ubuntu-slim` label warning was already there), and the CI run is the PR itself.

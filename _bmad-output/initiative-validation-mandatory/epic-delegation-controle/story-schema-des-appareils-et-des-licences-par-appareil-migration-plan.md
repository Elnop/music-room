---
title: 'Schéma des appareils et des licences par appareil (migration 015)'
type: 'feature'
ticket: '1'
created: '2026-10-08'
status: 'built'
baseline_revision: 'bb694227501922d2d52e22ae43433160733b7970'
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

**Problem:** Story 4.1 (#78). Music control delegation is a single per-friend switch (`follows.can_control_music`); subject IV.2.2 wants the license to be specific to each device. There is no table for a user's devices nor for per-device licenses.

**Approach:** Migration `backend/migrations/015_devices.sql`: `devices` (owner, client deviceId persisted by the app, name, platform, model, last seen; one row per (user, deviceId)) and `device_control_licenses` (owner's device, grantee friend), both with RLS. `follows.can_control_music` stays and now means "all my devices" (comment updated). Regenerate `supabase.generated.ts` from the hosted project once the migration is applied there, with the root `make generate-types` (`make/supabase.mk`).

</frozen-after-approval>

## Implementation Notes

Oneshot: one SQL migration (~70 lines); the services, API and realtime checks are stories 4.3 to 4.5. Risk medium: a schema mistake is cheap to fix before 4.3 writes to it, but it is applied by hand on the hosted database.

Files: `backend/migrations/015_devices.sql` only so far. `make generate-types` already exists at the root (`make/supabase.mk`); the committed `supabase.generated.ts` comes from the hosted project (it holds `email_verification_token`/`_expires_at`, which no migration creates), so it is regenerated from there, not from the local stack, after the human applies 015 in the dashboard.

Design: `devices` keyed by `(user_id, device_id)` (no surrogate id), so 4.5 checks a license with the values it already has (target user, target deviceId, requester). Licenses reference `devices` by that composite key, and `follows(follower_id, following_id)` as `(grantee_id, owner_id)` with `ON DELETE CASCADE`: a license needs the grantee to follow the owner (the same row that carries the "all my devices" switch) and disappears on unfollow. Mutual follow (friendship) stays checked in 4.4. `CHECK owner_id != grantee_id`, `device_id` 1–128 chars.

Checked on the local stack (`scripts/test-db.sh up` applies all migrations, transaction rolled back): upsert keeps one row per (user, device); license to a non-follower, on an unknown device, to oneself, and an empty device_id are refused; under RLS as the grantee: sees 1 license and only own devices, cannot grant on the owner's device; unfollow deletes the license.

## Review Triage Log

Quick review: 0 high, 1 medium, 0 low, 1 false, 1 deferred.

- false: types not regenerated. Known pending human step (apply 015 on the hosted project, then `make generate-types`), already in the Implementation Notes; done before commit.
- medium, patch: `devices.device_id` is capped at 128 characters but the handshake accepted any length, so 4.3's upsert would fail for a longer deviceId while the socket connects. `handshakeAuthSchema.deviceId` now has `.max(128)` (`backend/src/realtime/socket-auth.ts`), with a case in the INVALID_HANDSHAKE integration test.
- medium (design), defer: the license foreign key only requires grantee → owner follow; if the owner unfollows the grantee the friendship ends but the license stays. 4.4 and 4.5 must check mutual follow when granting and on every control check.

Migration 015 applied by the human on the hosted project (2026-10-08); `make generate-types` then Prettier: `devices` and `device_control_licenses` in `supabase.generated.ts` (the rest of its diff is generator formatting and PostgrestVersion 14.5). type-check, lint, unit (20) and integration (23) tests pass.

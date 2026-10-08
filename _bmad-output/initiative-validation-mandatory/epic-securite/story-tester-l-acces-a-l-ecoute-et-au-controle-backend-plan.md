---
title: "Tester l'accès à l'écoute et au contrôle (backend)"
type: 'feature'
ticket: '4'
created: '2026-10-08'
status: 'built'
baseline_revision: '89a6e5109934039660a1ea67feecba0d5d214c58'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context:
  - '{project-root}/doc/TESTING.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `listening:subscribe` and `control:action` (`backend/src/realtime/index.ts`) already check `musicControlService.canControl` on the socket's identity, but nothing tests it, their payloads are not validated (a `null` `control:action` payload throws inside the async handler), and a subscriber whose control permission is revoked or who unfollows keeps receiving `listening:status` (subject IV.6, CAP-1, CAP-3).

**Approach:** Validate the three payloads with Zod and answer invalid ones with the existing error events; make a subscriber leave `listening:<owner>` as soon as it loses control (revoke or unfollow), the same way #64 evicts playlist rooms; cover subscribe, control and eviction with integration tests on a real Socket.io server.

## Boundaries & Constraints

**Always:** Identity only from the socket (`socket.data.userId` / `socketToDevice`), never from the payload; extra fields such as `fromUserId` or `controllerId` in a payload are ignored. Keep `canControl` as the single rule (`follows.can_control_music` of follower → following). Error payloads keep the existing shape `{ message, code }` on `listening:error` / `control:error`; new code `INVALID_PAYLOAD`. Socket rooms are tested against a real server and the local Supabase stack (doc/TESTING.md).

**Never:** No change to `canControl`'s rule, to the handshake, to mobile, or to the per-device licences of Epic 4 (#80-#84). No new HTTP endpoint. Eviction never fails the HTTP request that triggered it.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Allowed subscribe | Bob follows Alice with `can_control_music` | Bob gets `listening:status`, then Alice's updates | No error expected |
| Subscribe to a non-friend | No follow row, or `can_control_music` false | Not in `listening:<id>`, no `listening:status` from Alice's updates | `listening:error` `NOT_AUTHORIZED` |
| Bad subscribe payload | Not a UUID string | No room joined, no DB call | `listening:error` `INVALID_PAYLOAD` |
| Allowed control | Bob may control Alice, Alice's device online | Alice's device gets `control:command` with `fromUserId` = Bob; Bob gets `control:success` | No error expected |
| Control on behalf of another | Carol (no permission) sends `control:action` for Alice, payload may carry `fromUserId: bob` | Alice's device gets nothing | `control:error` `NOT_AUTHORIZED` |
| Forged sender field | Bob (allowed) sends payload with `fromUserId: carol` | `control:command.fromUserId` is Bob | No error expected |
| Bad control payload | `null`, missing field, `action` not play/pause | Nothing sent, no crash | `control:error` `INVALID_PAYLOAD` |
| Permission revoked while subscribed | Alice revokes Bob (`revokeControl`) | Bob's sockets leave `listening:<alice>`, get no later status | Bob still gets `permission:changed` |
| Unfollow while subscribed | Bob unfollows Alice (`unfollowUser`) | Bob's sockets leave `listening:<alice>` | — |

</frozen-after-approval>

## Code Map

- `backend/src/realtime/index.ts` `registerMusicControlHandlers` -- `listening:subscribe` (`canControl` → `listening:error NOT_AUTHORIZED`, joins `listening:<target>`), `listening:unsubscribe` (no check), `control:action` (typed `ControlActionPayload`, unvalidated; `canControl` → `control:error`; `deviceToSocket` → `control:command { action, fromUserId: controllerId }`). `notifyPermissionChange(targetUserId, ownerId, granted)` emits `permission:changed` to `user:<target>`. `index.ts` is ~520 lines: put schemas and the eviction helper in a new `realtime/music-control-access.ts`.
- `backend/src/realtime/playlist-room.ts` -- pattern from #64: Zod schema + small exported helpers next to `index.ts`.
- `backend/src/features/music-control/music-control.service.ts` -- `canControl(controllerId, targetId)` (follows row follower=controller, following=target); `revokeControl` calls `realtime.notifyPermissionChange(allowedUserId, ownerId, false)` (l.~96).
- `backend/src/features/friends/services/friends.service.ts:144` `unfollowUser(currentUserId, targetUserId)` -- deletes follows(current → target): current loses control of target.
- `backend/src/features/music-control/music-control.types.ts:46` `ControlActionPayload` -- keep as the type; derive or check against the Zod schema.
- `backend/src/realtime/socket-auth.int.test.ts` and `playlist-room.int.test.ts` -- golden examples (server on port 0, `createUser` with anon sign-in, follows inserted with `supabaseAdmin`, Redis connected in `beforeAll`, `nextEvent` helper, "no event" checks after the expected events arrive). Do not duplicate their handshake cases.
- `mobile/src/hooks/useMusicControl.ts` -- client contract (`listening:subscribe <id>`, `control:action { targetUserId, targetDeviceId, action }`); unchanged.
- `backend/README.md` § "Temps réel (Socket.io)" -- document `INVALID_PAYLOAD` and the eviction.

## Tasks & Acceptance

**Execution:**
- [ ] `backend/src/realtime/music-control-access.ts` -- new: `listeningTargetSchema` (UUID), `controlActionSchema` (`targetUserId` UUID, `targetDeviceId` string 1-128, `action` `play`|`pause`, unknown keys stripped), and `leaveListeningRoom(io, controllerId, ownerId)` = `io.in('user:<controllerId>').socketsLeave('listening:<ownerId>')`, errors logged.
- [ ] `backend/src/realtime/index.ts` -- validate `listening:subscribe`, `listening:unsubscribe` (ignore invalid) and `control:action` before any lookup; `INVALID_PAYLOAD` on the error events; add `revokeListeningAccess(controllerId, ownerId)` (no-op before initialize) and call it from `notifyPermissionChange` when `granted` is false.
- [ ] `backend/src/features/friends/services/friends.service.ts` -- after a successful `unfollowUser`, `realtime.revokeListeningAccess(currentUserId, targetUserId)`.
- [ ] `backend/src/realtime/music-control-access.test.ts` -- unit: schemas accept/reject each matrix payload; extra fields stripped.
- [ ] `backend/src/realtime/music-control-access.int.test.ts` -- every matrix row with real users (Alice owner with a device socket, Bob allowed, Carol stranger), through `MusicControlService.revokeControl` and `FriendsService.unfollowUser` for the eviction rows.
- [ ] `backend/README.md` -- document `INVALID_PAYLOAD` and the eviction.

**Acceptance Criteria:**
- Given Carol does not follow Alice with control, when she subscribes to Alice's listening status, then she gets `listening:error` `NOT_AUTHORIZED` and none of Alice's statuses.
- Given Carol has no control permission, when she sends `control:action` for Alice's device (with any sender field), then Alice's device receives no `control:command`.
- Given the change, then `npm run type-check`, `npm run lint`, `npm test` and `make test-int` pass.

## Implementation Notes

## Plan Change Log

## Review Triage Log

Pass 1 (quick): high 0, medium 1, low 2, false 0, maybe-false 0.

| # | Finding | Verdict | Route | Evidence / action |
|---|---------|---------|-------|-------------------|
| 1 | Revoke/unfollow landing while `listening:subscribe` awaits `canControl` lets the join happen after the eviction | low | reject | Real but needs the DB read and the revoke write to straddle within milliseconds; same verdict as #64 finding 4; fix needs a re-check after join or locking. |
| 2 | Quick `listening:subscribe X` + `listening:unsubscribe X` ends subscribed (sync leave runs before the awaited join) | medium | defer | Pre-existing: the join already ran after `await canControl` before this change; `useMusicControl` cleanup can trigger it. Fix: per-socket ordering as in #64's `enqueue`. |
| 3 | Realtime bridge helper defined at the top of `friends.service.ts` instead of `utils/` (AGENTS.md layout) | low | patch | Verified: module-level `revokeListeningAccess` in the service file. Move it to `features/friends/utils/`; the lazy import and its comment stay (the cycle is real). |

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint && npm test` -- expected: all green
- `make test-int` -- expected: `music-control-access.int.test.ts` and the existing int tests pass
- `cd backend && GOOGLE_CLIENT_ID= FACEBOOK_APP_ID= npx vitest run --config vitest.int.config.ts` (after `make test-db-up`) -- expected: green without OAuth env, as in CI

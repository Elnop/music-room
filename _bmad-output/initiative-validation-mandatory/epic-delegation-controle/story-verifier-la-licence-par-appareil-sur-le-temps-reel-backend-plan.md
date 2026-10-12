---
title: 'Vérifier la licence par appareil sur le temps réel'
type: 'feature'
ticket: '5'
created: '2026-10-09'
status: 'built'
baseline_revision: '8efd99b507e5aba5f140f3e9feb9448a8c0aa6da'
route: 'full'
route_source: 'auto'
risk: 'high'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 4.5 (#82). Licenses can be granted per device (4.4), but the realtime path ignores them: `control:action` and `listening:subscribe` only check `musicControlService.canControl(controller, owner)`, the per-friend "all my devices" switch, which also stays true after the owner unfollows. Subject IV.2.2 wants control decided per device.

**Approach:** One access rule, shared by realtime and 4.4's controllable-devices listing: the controller and the owner are mutual friends, and either the owner's "all my devices" switch is on for the controller or the controller holds a license on the targeted device. `control:action` checks the targeted device; `listening:subscribe` requires access to at least one device. Listening subscriptions are re-checked when access is lost.

**Decision (2026-10-09):** a subscriber with access to at least one device receives the status of all the owner's devices (the room broadcast is unchanged); the app tells controllable devices apart with `GET /users/{userId}/devices`.

## Boundaries & Constraints

**Always:** Identity from `socket.data`, never the payload. Refusals keep the existing events and codes: `control:error` / `listening:error` with `NOT_AUTHORIZED`. Mutual friendship checked on every control and subscribe (the deferred 4.1 finding). A database error during a check refuses (fail closed) and is logged.

**Never:** No change to the REST `/permissions` and `/can-control` behavior, to the 4.2 contract, or to the handshake. No new socket event. No migration. No mobile change (4.7).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Licensed device | bob mutual friend of alice, license on A, switch off; `control:action` → A | `control:command` reaches A, `control:success` to bob | none |
| Unlicensed device | same; `control:action` → B | nothing reaches B | `control:error` `NOT_AUTHORIZED` |
| Switch on | mutual friends, switch on, no license; → B | command reaches B | none |
| Switch cut | switch turned off, license only on A; → B | refused | `NOT_AUTHORIZED` |
| Stale switch | switch on but alice unfollowed bob | refused | `NOT_AUTHORIZED` |
| Subscribe with a license | license on A only | joins `listening:<alice>`, gets `listening:status` with all of alice's devices | none |
| Subscribe without access | no switch, no license, or not mutual | not joined | `listening:error` `NOT_AUTHORIZED` |
| Last access lost | bob subscribed through a license on A; alice revokes it (or turns the switch off with no license left, or unfollows bob) | bob's sockets leave `listening:<alice>` | none |
| Access kept | switch turned off but license on A remains | bob stays subscribed | none |

</frozen-after-approval>

## Code Map

- `backend/src/realtime/index.ts` -- `listening:subscribe` (~line 277) and `control:action` (~line 339) call `musicControlService.canControl`; switch them to the new rule (`control:action` with `data.targetDeviceId`). `revokeListeningAccess(controller, owner)` (~line 558) evicts unconditionally; `notifyPermissionChange(..., false)` calls it on switch revoke.
- `backend/src/realtime/music-control-access.ts` -- rule doc comment (top) and `leaveListeningRoom`; update the comment to the new rule.
- `backend/src/features/music-control/services/control-access.service.ts` (new) -- `canControlDevice(controllerId, ownerId, deviceId)` and `canControlAnyDevice(controllerId, ownerId)`: mutual follow (both `follows` rows), `can_control_music` on `follows(controller → owner)`, license row in `device_control_licenses`. Lean queries (do not call `getFollowStatus`, it also counts followers). Errors → logged, `false`.
- `backend/src/features/music-control/services/device-license.service.ts` -- 159 lines. `listControllable` must use the same friendship + switch rule from the new service instead of its own; `revoke` must re-check and evict (below). Bring the file back under ~150 lines.
- `backend/src/features/music-control/music-control.service.ts` -- `revokeControl` → `notifyPermissionChange(..., false)`: evict only if `canControlAnyDevice` is now false. `canControl` stays for REST `/can-control`.
- `backend/src/features/friends/services/friends.service.ts` `unfollowUser` + `features/friends/utils/listening-access.ts` -- today evicts the unfollower from the target's room; also evict the target from the unfollower's room (the owner unfollowing ends the grantee's access). Keep the lazy import (cycle note in that file).
- `backend/src/realtime/music-control-access.int.test.ts` -- fixtures: `setFollows` makes one-way follows (bob → alice with switch). With mutual friendship required, add the reverse rows so existing cases keep their meaning; owner devices exist once they connected (4.3), so licenses can be inserted after `connect`.

## Tasks & Acceptance

**Execution:**
- [x] `control-access.service.ts` -- the two checks, fail closed.
- [x] `realtime/index.ts` + `music-control-access.ts` -- use them in `control:action` and `listening:subscribe`; add a `revalidateListeningAccess(controller, owner)` that evicts only when `canControlAnyDevice` is false; doc comment.
- [x] `device-license.service.ts` -- `listControllable` on the shared rule; `revoke` calls the revalidation after the delete.
- [x] `music-control.service.ts`, `friends.service.ts`, `listening-access.ts` -- switch revoke and unfollow (both directions) go through the revalidation.
- [x] `music-control-access.int.test.ts` -- fixture update, then every matrix row.
- [x] `control-access.service` unit test -- database error → `false`.

**Acceptance Criteria:**
- Given bob licensed on alice's device A only, when he sends `control:action` to A then to B, then A receives the command and B does not until B is licensed or the switch is on (story Verify).
- Given the existing realtime and license suites, when they run, then they pass (fixtures updated only for mutual friendship).

## Design Notes

Eviction is a re-check, not an unconditional leave: losing the switch while a license remains must not drop the subscription, and losing the last license must. `control:action` already answers `DEVICE_OFFLINE` for an offline device; the access check runs first, so a refused controller learns nothing about which devices are online.

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint && npm test` -- expected: pass.
- `cd backend && npm run test:int` (local stack already running; leave it running) -- expected: pass.

## Implementation Notes

- `ControlAccessService.getAccess` holds the rule and throws a 500 `DEVICE_FETCH_ERROR` on a query error (kept for `listControllable`, so 4.4's REST behavior is unchanged); `canControlDevice` / `canControlAnyDevice` wrap it, log and fail closed.
- `realtime.revokeListeningAccess` is replaced by `revalidateListeningAccess`; `notifyPermissionChange` is now async and awaited by `grantControl` / `revokeControl` so the eviction is done when the REST call returns. `permission:changed` still says `canControl: false` on a switch revoke even if a license remains (it describes the switch).
- `socket-auth.int.test.ts` fixture also needed the reverse follow (alice → bob) for mutual friendship.

## Plan Change Log

## Review Triage Log

Quick review, pass 1: 0 high, 2 medium, 0 low, 0 false; both patched.

- medium, patch: `listening:subscribe` checked access (now 2–3 queries) then joined; a revoke/unfollow whose revalidation ran during the check evicted nothing and the stale "allowed" joined, so the controller kept receiving status without access (breaks "Last access lost"). The gap pre-existed with one query; this change widened it. Fix: re-check after the join, leave and answer `listening:error` NOT_AUTHORIZED if access is gone (first check kept so a refused socket never enters the room).
- medium, patch: `backend/README.md` still described the realtime rule as `musicControlService.canControl` (switch only) and unconditional eviction on revoke / controller unfollow. Updated to the per-device rule and the re-check on switch revoke, license revoke and unfollow in either direction.

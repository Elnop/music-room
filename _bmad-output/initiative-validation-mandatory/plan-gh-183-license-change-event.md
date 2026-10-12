---
title: "Prévenir l'ami quand une licence d'appareil change"
type: 'bugfix'
ticket: ''
created: '2026-10-10'
status: 'built'
baseline_revision: 'f4a11c2031142f17b62131cb3ec2e080c2a4b71e'
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

**Problem:** GitHub #183. The server emits `permission:changed` only when the "all my devices" switch changes. A device license grant or revoke (`device-license.service.ts`) emits nothing: a friend's open profile (`useFriendListening`, #84) shows a granted license only on the next visit, and after a revoke keeps stale "online" devices and controls until a command is refused.

**Approach:** Reuse `permission:changed` (`{ ownerId, targetUserId, canControl }`), which the app already handles by reloading its controllable devices. After a grant, notify the grantee with `canControl: true`. After a revoke, notify with `canControl` = whether at least one device remains controllable (`controlAccessService.canControlAnyDevice`); `realtime.notifyPermissionChange` evicts from the listening room when it is false, replacing the bare revalidation. New helper `notifyListeningAccessChange` (lazy import, never throws, like `revalidateListeningAccess`). No new event, no mobile change. README realtime section updated.

</frozen-after-approval>

## Implementation Notes

Oneshot. Mutation check: with the old service both new realtime tests fail.

## Verification

**Commands:**
- `cd backend && npm run lint && npm run type-check && npm test && npm run test:int` -- expected: green

## Review Triage Log

Pass 1 (quick): medium 1 · low 1 · false 1.

| # | Finding | Verdict | Route | Evidence / action |
|---|---------|---------|-------|-------------------|
| 1 | `revoke` notifies even when no license was deleted: any owner could send `permission:changed` to any user id, repeats re-send it, self-revoke notifies the owner | medium | patch | `.delete()` did not check the count. Now `delete({ count: 'exact' })` and return when 0 + test (fails without the check). |
| 2 | Access checked twice on revoke (service, then `revalidateListeningAccess`); the event's `canControl` and the eviction come from separate reads | low | rejected | A few extra queries; the app ignores `canControl` and reloads; the race needs the switch to flip between two reads. |
| 3 | Eviction not asserted in the new revoke test | false | — | The existing test "evicts Bob when Alice revokes his last license" goes through `revoke`, hence the new notify path, and asserts the eviction. |

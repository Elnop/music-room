---
title: "Contrôler l'accès aux rooms de playlist (backend)"
type: 'feature'
ticket: '3'
created: '2026-10-08'
status: 'built'
baseline_revision: '4689aa23b31928c900c92ceafd9a74a4fd826a0d'
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

**Problem:** `playlist:join` (`backend/src/realtime/index.ts`) puts any authenticated socket in `playlist:<id>` with no check, so anyone who knows a private playlist's id receives its `playlist:updated` events (subject IV.6, CAP-1).

**Approach:** Before joining, validate the payload, load the playlist and check `canViewPlaylist` with the identity from `socket.data` (set by the JWT handshake, 2.1). On refusal, do not join and emit `playlist:error` to that socket, following the existing `listening:error` / `control:error` convention. Decision (2026-10-08): access is also re-checked when it can be lost: after a viewer or collaborator is removed, a playlist is updated (visibility) or deleted, the backend re-checks every socket in `playlist:<id>`, makes those without access leave and emits `playlist:error` to them.

## Boundaries & Constraints

**Always:** Identity only from `socket.data.userId`, never from the payload. Validate the payload with Zod (`playlistId` is a UUID). Reuse `canViewPlaylist` from `features/playlists/permissions/playlist.permissions.ts`; no second permission rule. `playlist:error` payload is `{ playlistId, code, message }` with codes `INVALID_PAYLOAD`, `PLAYLIST_NOT_FOUND`, `PLAYLIST_ACCESS_DENIED`. Log refusals with `socketLogger.event` (level `warn`, no token). Room membership is tested against a real Socket.io server and the local Supabase stack (doc/TESTING.md: socket rooms are integration tests).

**Never:** No change to `notifyPlaylistUpdate`'s emit or to mobile (`usePlaylistSocket` keeps emitting `playlist:join <id>`). No new HTTP endpoint. A failed re-check never fails the HTTP request that triggered it (logged only). No change to the handshake (`socket-auth.ts`).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Invited joins private | Viewer, collaborator or owner of a private playlist | Joins `playlist:<id>`, receives its `playlist:updated` | No error expected |
| Anyone joins public | Any authenticated user, public playlist | Joins, receives updates | No error expected |
| Non-invited joins private | User not owner/viewer/collaborator | Not in the room, receives no `playlist:updated` | `playlist:error` `PLAYLIST_ACCESS_DENIED` |
| Unknown playlist | Valid UUID, no such row | Not in the room | `playlist:error` `PLAYLIST_NOT_FOUND` |
| Bad payload | Not a UUID string (number, object, empty) | Not in the room, no DB call | `playlist:error` `INVALID_PAYLOAD` (`playlistId: null` when not a string) |
| Viewer/collaborator removed while in room | Removed user's socket in `playlist:<id>` of a private playlist | Socket leaves the room, gets no later `playlist:updated`; other members stay | `playlist:error` `PLAYLIST_ACCESS_DENIED` |
| Playlist made private while in room | Outsider's socket in the room of a public playlist switched to private | Outsider leaves; owner/viewers/collaborators stay | `playlist:error` `PLAYLIST_ACCESS_DENIED` |
| Playlist deleted while in room | Any socket in the room | Every socket leaves | `playlist:error` `PLAYLIST_NOT_FOUND` |
| Supabase error on lookup | DB unreachable | Not in the room | `playlist:error` `PLAYLIST_NOT_FOUND`, error logged |

</frozen-after-approval>

## Code Map

- `backend/src/realtime/index.ts:162-181` -- `registerPlaylistHandlers`: `playlist:join` joins blindly, `playlist:leave` leaves; make `join` async with the check; `leave` only validates the payload. Error-event style to copy: `listening:subscribe` (l.~205-235, `canControl` → `socket.emit('listening:error', { message, code })`).
- `backend/src/realtime/index.ts:422-449` -- `notifyPlaylistUpdate` emits `playlist:updated` to `playlist:<id>`: unchanged, used by the test to broadcast.
- `backend/src/realtime/socket-auth.ts` -- `SocketData` (`userId`, `device`), `AppSocket`; Zod already used there (`handshakeAuthSchema`).
- `backend/src/features/playlists/permissions/playlist.permissions.ts` -- `canViewPlaylist(playlist, userId)` (pure), `getPlaylistForPermissionCheck(id)` (select `*`, throws `AppError(404, PLAYLIST_NOT_FOUND)`): reuse both.
- `backend/src/shared/middleware/socket-logger.middleware.ts` -- `socketLogger.event(name, socketId, meta)`.
- `backend/src/realtime/socket-auth.int.test.ts` -- golden example: real server on port 0 (`realtime.initialize`), `createUser` with anon sign-in, `connect`/`connected`/`nextEvent`/`serverSocket` helpers, Redis connect in `beforeAll` (verifyToken fails closed without it), users deleted in `afterAll`.
- `mobile/src/hooks/usePlaylistSocket.ts` -- client contract (`playlist:join` with a bare id string, listens to `playlist:updated`); not changed.
- `backend/src/features/playlists/services/viewer.service.ts:81` `removeViewer`, `services/collaborator.service.ts:69` `removeCollaborator`, `playlist.service.ts:418` `updatePlaylist`, `:459` `deletePlaylist` -- call the re-check after a successful write (fire-and-forget, `void`). `playlist-track.service.ts` already imports `realtime` the same way.
- `backend/src/realtime/index.ts` is 491 lines: put the re-check logic in `playlist-room.ts`, keep `index.ts` to a thin method.
- `backend/README.md` § "Temps réel (Socket.io)" -- event list: add `playlist:error`.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/realtime/playlist-room.ts` -- new: Zod schema for the join/leave payload and `authorizePlaylistJoin(playlistId: unknown, userId)` returning `{ ok: true, playlistId }` or `{ ok: false, playlistId, code, message }`, using `getPlaylistForPermissionCheck` + `canViewPlaylist` -- keeps `index.ts` from growing and is unit-testable.
- [x] `backend/src/realtime/index.ts` -- `playlist:join` awaits `authorizePlaylistJoin` with `socket.data.userId`, joins on success, else emits `playlist:error` and logs; `playlist:leave` ignores an invalid payload.
- [x] `backend/src/realtime/index.ts` -- `revalidatePlaylistRoom(playlistId)`: `io.in('playlist:<id>').fetchSockets()`, load the playlist once, for each socket without access (or all if not found) `socket.leave` + `playlist:error`; no-op when `io` is null; errors logged, never thrown.
- [x] `viewer.service.ts`, `collaborator.service.ts`, `playlist.service.ts` -- `void realtime.revalidatePlaylistRoom(playlistId)` after a successful `removeViewer`, `removeCollaborator`, `updatePlaylist`, `deletePlaylist`.
- [x] `backend/src/realtime/playlist-room.test.ts` -- unit tests (Supabase mocked): each matrix error row returns the right code; public / owner / viewer / collaborator allowed.
- [x] `backend/src/realtime/playlist-room.int.test.ts` -- owner, viewer and outsider users; a private playlist with the viewer; all three join; `realtime.notifyPlaylistUpdate(..., 'reordered')`; owner and viewer get `playlist:updated`, outsider gets `playlist:error` `PLAYLIST_ACCESS_DENIED` and no `playlist:updated` (wait for the invited sockets' event, then assert the outsider's handler never fired). Public playlist: outsider receives. Then the re-check rows: removing the viewer (through `ViewerService.removeViewer`) evicts them and they miss the next update while the owner gets it; switching a public playlist to private (`updatePlaylist`) evicts the outsider; deleting evicts everyone with `PLAYLIST_NOT_FOUND`.
- [x] `backend/README.md` -- document `playlist:error` and its codes.

**Acceptance Criteria:**
- Given a private playlist, when a non-invited user emits `playlist:join` with its id, then they receive no `playlist:updated` for it and get `playlist:error` `PLAYLIST_ACCESS_DENIED`; an invited user receives the updates.
- Given a viewer in the room of a private playlist, when the owner removes them, then they get `playlist:error` and no later `playlist:updated`, while the owner still does.
- Given the change, then `npm run type-check`, `npm run lint`, `npm test` and `make test-int` pass.

## Implementation Notes

## Plan Change Log

## Review Triage Log

Pass 1 (quick): high 0, medium 2, low 2, false 1, maybe-false 0.

| # | Finding | Verdict | Route | Evidence / action |
|---|---------|---------|-------|-------------------|
| 1 | DB error on lookup is reported as not found and never logged; in the re-check it evicts every member | medium | patch | Verified: `getPlaylistForPermissionCheck` maps any `{ error }` to `AppError 404 PLAYLIST_NOT_FOUND`, `loadPlaylist` skips logging that code; supabase-js returns errors, does not throw. Fix: own lookup with `maybeSingle()` in `playlist-room.ts` telling not-found from error; error → logged, join refused `PLAYLIST_NOT_FOUND`, re-check evicts nobody. |
| 2 | Async `playlist:join` vs sync `playlist:leave`: a leave sent during the lookup is lost and the socket stays in the room | medium | patch | Verified: `usePlaylistSocket` emits join on mount, leave on cleanup; leave runs before the awaited join. Fix: run join/leave of one socket in order (per-socket promise chain). |
| 3 | Socket disconnected during the await leaves a stale adapter entry | false | reject | `Socket._cleanup()` sets `this.join = noop` (`node_modules/socket.io/dist/socket.js:561`), so a join after disconnect does nothing. |
| 4 | Join authorized on pre-removal data can land after the re-check's `fetchSockets()` | low | reject | Real but needs a DB read and a socket join to straddle a write within milliseconds; fix needs a second check or locking (added complexity). |
| 5 | `removeCollaborator` re-check has no test | low | patch | Verified: only `removeViewer` is exercised in `playlist-room.int.test.ts`. Fix: add the collaborator eviction case. |

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint && npm test` -- expected: all green
- `make test-int` -- expected: `playlist-room.int.test.ts` and the existing int tests pass

# Playlist editor

Subject IV.2.3 (Music Playlist Editor): several users edit the same playlist in real time, with visibility and editing rights, and concurrent edits never corrupt it.

Code: `backend/src/features/playlists/`, `backend/src/realtime/handlers/playlist.handler.ts`, `playlist-room.ts`; mobile `src/features/playlists/`.

## Rights

Two independent settings, chosen by the owner:

- **Visibility**: `public` (default, anyone can see it) or `private` (only the owner, viewers and collaborators).
- **Edit mode**: `open` (default, anyone who can see it can edit it) or `restricted` (only the owner and collaborators).

| visibility | edit_mode | Can view | Can edit |
|---|---|---|---|
| public | open | everyone | everyone |
| public | restricted | everyone | owner + collaborators |
| private | open | owner + viewers + collaborators | owner + viewers + collaborators |
| private | restricted | owner + viewers + collaborators | owner + collaborators |

The owner invites friends as viewers or collaborators (`/api/playlists/:id/viewers`, `/collaborators`). Rules: `canViewPlaylist` and `canEditPlaylist` in `permissions/playlist.permissions.ts`. Only the owner renames, changes the settings or deletes the playlist (#342).

## Editing

- Add a track from a SoundCloud search, remove it (swipe left), or move it by drag and drop (#271). Each drop sends one move: "put this track after the track with this rank".
- Every operation is a Postgres function that locks the playlist, so the server applies them one at a time. The order uses fractional ranks, so a move only touches the moved track. A move based on a stale version of the same track gets `409` and the app reloads; adds, removes and moves of different tracks always apply. `added_by` keeps the user who added the track.
- The full design, the concurrency cases of the subject and the alternatives considered: [playlist-concurrency.md](playlist-concurrency.md).

## Real time

- Opening a playlist joins the socket room `playlist:<id>`, only if the user can see it. Every change is broadcast to the room (`playlist:updated` with the new version, `playlist:details` for metadata, `playlist:deleted`), and the app applies it to its cache (`utils/playlistSocketRules.ts`), so every client converges on the server's order.
- When access is withdrawn (viewer or collaborator removed, playlist made private or deleted), the sockets that lost it are evicted from the room (threat M10).
- Metadata edits (name, description, settings) are last-write-wins.

## Link with the play queue

Playing a playlist copies its tracks into the play queue as a block. Until the user detaches it, later changes to the playlist (add, remove, move) are applied to the upcoming part of that block in every queue (#278). See [queue-and-connect.md](queue-and-connect.md).

## Tests

`backend/src/features/playlists/services/track-operations.int.test.ts` (concurrent moves, adds and removes, invariants), `playlist-track.int.test.ts`, `playlist.permissions.test.ts`, `backend/src/realtime/playlist-room.int.test.ts` (room access and eviction); on mobile, the move queue, the socket rules and the detail screen. Full list: [playlist-concurrency.md](playlist-concurrency.md#tests).

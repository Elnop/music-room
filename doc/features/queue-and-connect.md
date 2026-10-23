# Play queue and Connect

Each user has one play queue, shared by all their devices. Friends who control one of their devices manage that queue too, and anyone can move what is playing to another device they control, Spotify Connect style. This extends Music Control Delegation (IV.2.2); Music Track Vote (IV.2.1) is not implemented, so the queue has no voting.

Code: `backend/src/features/queue/`, `backend/src/realtime/emitters/queue.emitters.ts`, migrations `021` to `025`; mobile `src/features/queue/` (`queueModal/`, `devicePicker/`, `stores/queueStore.ts`, `stores/connectStore.ts`) and `src/features/player/`.

## The queue

- Tables `play_queues` (one row per user: pointer to the current item, version) and `play_queue_items` (items ordered by fractional rank, the same rank functions as playlists). Every change is a SQL function serialized per user by a lock (#273).
- `/api/queue`: read the queue, add a track, remove, move, play an item, next, previous, play a playlist. In the app: swipe a track right to add it to the queue (#275), open the queue from the player to reorder, play or remove (#276), play a whole playlist with the floating Play button (#277).
- **Playing a playlist** inserts its tracks as a block right after the current item; the track that was playing becomes history. As long as the block is not detached, later changes to the playlist are applied to its upcoming part, in every user's queue (#278).
- **Versions** (#285): every change increments `play_queues.version` (a trigger, under the lock; a sync that changes nothing keeps it). `queue:updated` carries the whole state with its version, and the app ignores a state not newer than the one it has, per owner, so late HTTP answers and socket events cannot roll it back.
- The device that plays chains to the next item itself at the end of a track, and prefetches the next stream URL in the last 20 seconds (#314).

## Delegated queue access

Decisions of the design (#294):

- A friend who can control **at least one** of the owner's devices sees and manages the owner's queue like the owner does: same routes under `/api/users/:userId/queue`. There is no second rights system as for playlists.
- An action that changes what plays (play an item, next, previous, play a playlist) targets a device (`deviceId`): the delegate must hold a license on that device (or the switch) and it must be online, checked before anything changes. The server then sends that device `control:command` `play-item`.
- `queue:updated` goes to the owner's devices (`user:<id>`) and to the delegates listening to them (`listening:<id>`). A delegate who loses their last device gets `control:revoked` and leaves the room.

## Moving playback (Connect)

From the player, a device picker (#298) lists "This phone", "My devices" and "My friends' devices" (from `GET /api/music-control/controllable-devices`; offline devices greyed out). Choosing one calls `POST /api/queue/transfer` (#295):

- **To one of my devices**: the queue does not change; the target starts the current track at the same position and the source pauses.
- **To a friend's device**: my current track and my upcoming tracks are inserted as one block right after the friend's current track, and the first one starts at my position; then their queue goes on.
- Every check (license, online, the played item belongs to my queue) runs before any change: `403`, `409 DEVICE_OFFLINE` or `404`, and nothing changes.

The phone then becomes a remote control (#297): `connectStore` holds the active device, `local` or `remote`, and `useNowPlaying` gives the mini player and the player modal one interface for both cases (local player, or the target's `listening:status`). The mini player is always visible, so the device picker is always reachable (#296).

## Tests

Backend integration tests per surface: `queue.service.int.test.ts`, `queue-sync.int.test.ts`, `queue-delegation.int.test.ts`, `queue-transfer.int.test.ts`, `queue-transfer-sql.int.test.ts`, `backend/src/realtime/queue-updated.int.test.ts`, `controllable-devices.int.test.ts`; mobile tests of `queueStore` (stale states ignored), `connectStore`, the queue modal and the device picker. Security analysis: [threat-model.md](../security/threat-model.md#m11-music-control-of-an-unauthorized-device).

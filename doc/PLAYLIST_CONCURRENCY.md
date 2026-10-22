# Playlist Concurrency

How several users add, remove and move tracks in the same playlist at the same time without corrupting it. Epic #85 implements it; change it through a PR, not per feature.

Subject requirement (IV.2.3): *"You should especially care about the management of competition problems: for instance, if several people move different tracks or the same one in a playlist."* Goal (CAP-5): under concurrent reorder, add and remove, every track ends present exactly once, no move is lost without its author being told, all clients converge on the server order, and `added_by` keeps the original adder.

Scope: track order and membership. Playlist metadata (name, description, visibility, edit mode) stays last-write-wins.

## The two cases of the subject

| Case | What happens | Why |
|---|---|---|
| **Different tracks** moved at the same time | Both moves apply, each where its author dropped it. | A move rewrites only the moved track's row; other tracks keep their keys, so a concurrent move cannot shift anyone else's target. |
| **The same track** moved at the same time | The first move applies; the second gets `409` and its author sees the track's new place. | The server sees that the track moved after the version the second client was looking at. |

## Order: fractional ranks

Each `playlist_tracks` row carries a `rank`: a text key compared byte by byte (`COLLATE "C"`). The playlist order is the rows sorted by `rank`. Between any two keys there is always room for another one, so placing a track never renumbers the others.

- Keys are base-62 digit strings read as a fraction in (0, 1). `rank_between(a, b)` returns a key strictly between `a` and `b`; a `NULL` bound means the start or the end of the list. It is project code (a SQL function), not a library: the subject forbids an SDK doing the core work.
- `UNIQUE (playlist_id, rank)` and `UNIQUE (playlist_id, track_id)` guard the invariants: a track appears once, and two tracks never share a place.
- The old integer `position` column and its renumbering go away. The API still returns tracks in order; a client that needs an index derives it from the order.

**Rebalancing.** Moving tracks again and again into the same gap makes keys longer (Jira's LexoRank, the same idea at a much larger scale, rebalances past 128 characters). When a key generated for a playlist exceeds a length threshold, the operation that produced it respaces every rank of that playlist evenly within the same transaction and bumps the version like any other change. The threshold is `rank_max_length() = 64` characters (`backend/migrations/016_playlist_track_ranks.sql`), reached after about 320 moves into the same gap. The add or move result and its `playlist:updated` event carry `rebalanced: true`, and `playlists.ranks_rebalanced_at_version` records the version of the last rebalance.

**A client holding old ranks.** After a rebalance, every rank a client displayed from before it is meaningless. A move whose `expectedVersion` is older than `ranks_rebalanced_at_version` is therefore refused with `409 PLAYLIST_REBALANCED`, since its `afterRank` points into the old key space; the client reloads the playlist and the user drops the track again. A client that receives `rebalanced: true` reloads before its next move.

## Versions

- `playlists.tracks_version` (bigint): incremented by every add, remove and move.
- `playlist_tracks.moved_at_version` (bigint): the `tracks_version` at which this track was last added or moved.

Every response to a track operation, the playlist fetch, and every `playlist:updated` event carry the current `tracks_version`. The client always knows which version it is displaying.

## Operations

Each operation is one Postgres function called through `supabaseAdmin.rpc`. Supabase's client has no transactions, so the function is the atomic unit. Every function starts by locking the playlist row:

```sql
SELECT 1 FROM playlists WHERE id = p_playlist_id FOR UPDATE;
```

Under READ COMMITTED, this makes the writers of one playlist go one at a time: the second waits, then reads the state the first left. Every function takes this lock first and no other, so they cannot deadlock. Writers of different playlists never wait for each other.

| Operation | Request | Server, under the lock | Refusals |
|---|---|---|---|
| **Add** | `POST /api/playlists/:id/tracks` `{ track }` | `rank = rank_between(last rank, NULL)`; `added_by` set; version + 1 | `409 TRACK_DUPLICATE` if the track is already in the playlist |
| **Remove** | `DELETE /api/playlists/:id/tracks/:trackId` | delete the row; version + 1 | `404 TRACK_NOT_IN_PLAYLIST` |
| **Move** | `POST /api/playlists/:id/tracks/:trackId/move` `{ afterRank, expectedVersion }` | see below | `409 TRACK_NOT_IN_PLAYLIST`, `409 TRACK_MOVED_CONCURRENTLY`, `409 PLAYLIST_REBALANCED` |

Add and remove are never refused because of concurrency: two adds append one after the other, a remove does not disturb any other row.

### Move

The client sends the rank of the track it drops the moved track after (`afterRank`, `NULL` for the top of the list) and the version it was displaying (`expectedVersion`). The server:

1. reads the moved track's row; if it is gone, `409 TRACK_NOT_IN_PLAYLIST`;
2. if `moved_at_version > expectedVersion`, someone moved this track after the client's version: `409 TRACK_MOVED_CONCURRENTLY`;
3. if `ranks_rebalanced_at_version > expectedVersion`, the ranks were respaced after the client's version and `afterRank` no longer means anything: `409 PLAYLIST_REBALANCED`;
4. otherwise takes `next`, the smallest existing rank greater than `afterRank` (other than the moved track's own), and sets the moved track's `rank = rank_between(afterRank, next)`, `moved_at_version = tracks_version + 1`, `tracks_version + 1`.

`afterRank` is a point in key space, not a track: if the track the user dropped after was itself moved or removed in the meantime, the point stays where the user saw it, and the moved track lands there. If another track was moved into the same gap meanwhile, the server places the moved track right after `afterRank`, before the newcomer; both stay where their authors put them, give or take that neighbour.

Only `rank` and `moved_at_version` change: `added_by` and `added_at` keep the original adder.

### Example

The playlist is at version 10. Alice and Bob both display version 10; track E has `moved_at_version = 4`.

1. Alice moves E with `expectedVersion = 10`. 4 ≤ 10: applied. Version 11, E has `moved_at_version = 11`.
2. Bob moves D with `expectedVersion = 10`. D has `moved_at_version ≤ 10`: applied, version 12. Different tracks, no conflict.
3. Bob moves E with `expectedVersion = 10`. 11 > 10: `409 TRACK_MOVED_CONCURRENTLY`. Bob's app reloads, shows E at Alice's place, and tells him the track was moved by someone else.

## Broadcast and convergence

After each operation the backend emits `playlist:updated` to the `playlist:<id>` room. The payload is a per-operation delta carrying the new `tracksVersion` (types `PlaylistUpdatedPayload` in `backend/src/features/playlists/playlist.types.ts` and `PlaylistUpdatedEvent` in `mobile/src/types/playlist.types.ts`):

```ts
{ playlistId, tracksVersion, rebalanced, event: 'track_added', track }    // track carries rank, addedBy, addedAt
{ playlistId, tracksVersion, rebalanced, event: 'track_removed', trackId }
{ playlistId, tracksVersion, rebalanced, event: 'track_moved', trackId, rank }
```

A client:

- ignores an event whose version is not above the one it displays;
- applies an event whose version is exactly one above, unless `rebalanced` is true;
- reloads the playlist when it skipped a version or when `rebalanced` is true.

All clients therefore end on the server's order. The HTTP contract (move endpoint, add and remove results, `tracksVersion` on the fetch, `rank` on each track) is in `backend/src/features/playlists/playlist-tracks.openapi.ts` (schemas in `playlist.validators.ts` and `playlist-responses.validators.ts`).

**Moves from one client go one at a time.** A user who taps twice quickly would otherwise send the second move with the version from before the first, and get a `409` against themselves. The mobile store (`mobile/src/store/playlistStore.ts`, `moveTrack`) queues moves: each is sent only after the previous one answered, with the version from that answer. The playlist screen moves a track one row with up / down buttons, shown to users who can edit and disabled at the list edges and while a move is pending; `afterRank` is the rank of the track two rows above (`null` for the second row) to go up, or of the next track to go down (`mobile/src/store/moveTarget.ts`).

**Own operations.** The answer to an add, remove or move carries the new `tracksVersion`; the store applies it like an event, so the echo of that operation on the socket arrives with a version already displayed and is ignored. The store never reorders before the answer: the order changes when the answer or the event arrives. Only a remove hides the track at once, and a reload brings it back if the remove fails.

**On a `409`** (`TRACK_MOVED_CONCURRENTLY`, `TRACK_NOT_IN_PLAYLIST` or `PLAYLIST_REBALANCED`), the mobile store reloads the playlist and the screen tells the user "This track was changed by someone else".

The pure rules (sort by rank, apply an event → new playlist, ignore or reload) are in `mobile/src/store/playlistSync.ts`; `mobile/src/hooks/usePlaylistSocket.ts` passes each event to the store and reloads when it answers `reload`.

## Tests

Concurrency is tested on the integration Postgres (story 1.10, see `doc/TESTING.md`), with separate connections running operations at the same time. Every test checks the invariants: each track appears once, ranks are unique, `added_by` is unchanged by moves, and the final order is the same for every client. Cases: concurrent moves of different tracks (all apply), concurrent moves of the same track (one applies, the others get `409`), moves concurrent with adds and removes, and a long run of moves into one gap (rebalancing).

| File | Covers |
|---|---|
| `backend/src/features/playlists/services/track-ranks.int.test.ts` | `rank_between` and rank ordering |
| `backend/src/features/playlists/services/track-operations.int.test.ts` | add, remove, move, concurrency, rebalancing |
| `backend/src/realtime/playlist-updated.int.test.ts` | the `playlist:updated` deltas |
| `mobile/src/store/playlistSync.test.ts` | sort by rank, event application (apply, ignore, reload) |
| `mobile/src/store/moveTarget.test.ts` | `afterRank` for up / down and the list edges |
| `mobile/src/store/playlistStore.test.ts` | move queue, `409` reload and message, events, loading, CRUD, add and remove |
| `mobile/src/hooks/usePlaylistSocket.test.ts` | events through the store, reload |
| `mobile/src/api/playlistApi.test.ts` | move request, collaborators and viewers |

## Alternatives not chosen

- **Relative move (`+x` / `-x`) or absolute target index:** counted on the list the client saw, so a concurrent move of another track across the span lands the track next to the wrong neighbours without anyone being told. Serializing does not fix it ([Sun et al., 1998](https://www.cs.cityu.edu.hk/~jia/research/reduce98.pdf)).
- **Anchor on a track ("after track Y"):** when Y is moved concurrently, the moved track follows Y somewhere its author never pointed at.
- **Server-side transformation of operations (OT):** keeps intentions but needs every operation type transformed against every other, and an operation log; Figma rejected it for that cost ([Figma, 2017](https://www.figma.com/blog/realtime-editing-of-ordered-sequences/)).
- **List CRDT with move ([Kleppmann, 2020](https://martin.kleppmann.com/papers/list-move-papoc20.pdf)):** built for peers without a central server; we have one, and a CRDT library would do the work the subject asks for.
- **Optimistic lock on the whole playlist (any change since `expectedVersion` → `409`):** safe, but refuses moves of different tracks, the case the subject expects to work.

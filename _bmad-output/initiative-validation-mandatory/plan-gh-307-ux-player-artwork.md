---
title: 'Pochette nette dans le lecteur plein écran (#307, groupe « Lecteur »)'
type: 'bugfix'
ticket: 'https://github.com/Elnop/music-room/issues/307'
created: '2026-10-17'
status: 'built'
baseline_revision: '713cf019f27a1b9816eb1234c19d8bcc73c06702'
route: 'oneshot'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Audit #307, section « Lecteur »: the full-screen player blurs the artwork. SoundCloud's API returns artwork and avatar URLs in their `-large` variant (100×100), stored as is in `tracks.album_art` and shown stretched to the screen width. The lock-screen artwork (`MediaSessionBridge`) uses the same small image.

**Approach:** A mobile helper rewrites a SoundCloud CDN image URL (`sndcdn.com`, `-large.`) to its `-t500x500.` variant and leaves any other URL untouched. The full-screen player and the lock-screen metadata use it; lists keep the small image. Existing playlists benefit without a migration since the rewrite happens at display time.

</frozen-after-approval>

## Implementation Notes

Oneshot: a pure helper with tests and two call sites. The other item of the group (a quick swipe up opening the player) is to confirm on a phone and needs no code here.

`largeArtwork` (`mobile/src/utils/artwork.ts`) is used by `PlayerModal` and `MediaSessionBridge`; lists keep the small image.

## Review Triage Log

Quick review: 2 findings, both low, both patched.

- low, patched: an overload typed `largeArtwork('')` as `string` though it returns null. Overload removed.
- low, patched: the host was not anchored, so `evilsndcdn.com` matched. Now only `sndcdn.com` and its subdomains match, with a test.

---
title: 'Plantage natif du bouton d''en-tête de PlaylistDetail'
type: 'bugfix'
ticket: 'https://github.com/Elnop/music-room/issues/343'
created: '2026-10-16'
status: 'built'
baseline_revision: 'ee92713644eaddf76b8780d9ca541f69f1730dc6'
route: 'oneshot'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'auto'
lenses_ran: []
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #343. On Android, going back quickly to a playlist and tapping its header `⋯` shows the native error "The specified child already has a parent" (`ScreenStackHeaderConfig.onUpdate`): a crash in a release build. `PlaylistDetailScreen` sets `headerRight` to `undefined` when `isOwner` is false and to a new element when it is true. `isOwner` goes false while the store reloads the playlist (`currentPlaylist` set to null without a cached copy, `playlistStore.ts:138`), so the native header subview is removed and added again while the screen re-attaches during the back transition.

**Approach:** `headerRight` is always set and always renders the same component: the `⋯` button for the owner, an empty placeholder of the same size otherwise. The header subview is never added or removed after the first render. `isOwner` becomes a strict boolean. A jest test checks that `headerRight` is defined for a non-owner and renders the button for the owner. The button gets an accessibility label.

</frozen-after-approval>

## Implementation Notes

Oneshot: one screen, a few lines plus a test. Not reproducible under jest (native view); the on-device repro from #343 goes into the PR for the acceptance pass on `main`.

Emulator repro (Medium_Phone API 36, debug build): 5 runs of the #343 scenario on the old code gave no crash, so the device check stays for the acceptance pass on `main`.

## Review Triage Log

Quick review by a context-free subagent: no bug or regression found.

- Low, fixed: no test covered the owner's playlist turning null during a reload. Added a rerender test that checks every `setOptions` call keeps `headerRight`.
- Low, fixed: pressing the button was untested. The owner test now checks navigation to `PlaylistSharing`.

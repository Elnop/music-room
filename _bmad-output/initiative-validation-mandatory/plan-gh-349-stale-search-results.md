---
title: 'Recherche SoundCloud : ignorer les réponses périmées (#349)'
type: 'bugfix'
ticket: 'https://github.com/Elnop/music-room/issues/349'
created: '2026-10-17'
status: 'built'
baseline_revision: 'a4dd656093cefd97b8988d6c9ffb61e2762164a1'
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

**Problem:** GitHub #349. `soundcloudStore.search` has no request id. A search sent before the field is cleared, or overtaken by a newer one, still writes its results when it answers: an empty field fills with results, or « a »'s results replace « ab »'s. `clearSearch` leaves `isSearching` true while a request is in flight.

**Approach:** The store numbers its searches. Only the latest one writes `searchResults`, `error` and `isSearching`. `clearSearch` and an empty query invalidate any search in flight and stop the loading state. A store test covers clear-during-request and out-of-order answers.

</frozen-after-approval>

## Implementation Notes

Oneshot: one store and its test.

## Review Triage Log

Quick review: no findings. Noted, not a defect: a blank query passed to `search` keeps `error` (pre-existing; both screens clear it through `clearSearch`/`clearError`).

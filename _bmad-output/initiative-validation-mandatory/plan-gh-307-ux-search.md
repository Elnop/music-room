---
title: 'Irritants UX de la recherche (#307, groupe « Recherche »)'
type: 'bugfix'
ticket: 'https://github.com/Elnop/music-room/issues/307'
created: '2026-10-17'
status: 'built'
baseline_revision: 'eab443b98f7ebaccb2f09f51d533d99bdf6eb6a6'
route: 'full'
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

**Problem:** Audit #307, section « Recherche »:
1. While a search is on its way, the Search tab says « Aucun titre trouvé » instead of showing a loader.
2. On « Ajouter des titres », the previous results stay on screen during a new search with nothing saying it is loading.
3. A long title runs into the duration.
4. 30-second previews (SoundCloud Go tracks) look like full tracks.
5. The Search tab field has neither a magnifier nor a clear button, unlike the one on « Ajouter des titres ».
6. Missing artwork falls back to `https://via.placeholder.com/...`, a closed service, so a blank square shows.

**Approach:**
1. The Search tab counts a typed query waiting for its debounce as loading.
2. A shared `SearchBar` gets a magnifier, a clear button and a `loading` spinner. Both search screens use it, so the add screen shows the spinner while old results stay.
3. Track rows keep a gap before the duration, which never shrinks.
4. A « Extrait » badge marks preview-only tracks, read from the fields SoundCloud already sends.
5. Covered by the shared `SearchBar` (2).
6. A shared artwork component draws a local placeholder (icon on `surfaceAlt`) when there is no image. It replaces every `via.placeholder.com` use.

## Boundaries & Constraints

**Always:** French UI text, formal register. The search request, debounce, pull-to-refresh and error states keep working as today. `SearchBar` stays backward compatible for its other users (Partage, Amis): clearing calls `onChangeText('')`. A preview is detected from SoundCloud's own fields (`policy === 'SNIP'`, or every `media.transcodings[].snipped` true), and a track without these fields is never flagged.

**Never:** Filtering previews out of the results. Changing the backend search logic. Adding a dependency.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Typing, no results yet | Query typed, debounce pending | Skeleton, never « Aucun titre trouvé » | No error expected |
| Truly empty | Search done, 0 results | « Aucun titre trouvé » | No error expected |
| New search over results | Results shown, new query sent | Results stay, spinner in the search bar | Search error as today |
| Clear | Clear button pressed | Field empty, `onChangeText('')` | No error expected |
| Preview | `policy: 'SNIP'` or all transcodings `snipped` | « Extrait » badge on the row | No error expected |
| Full track | `policy: 'ALLOW'`, or fields absent | No badge | No error expected |
| No artwork | `artwork_url` and avatar null | Local placeholder, no network image | No error expected |

</frozen-after-approval>

## Code Map

- `mobile/src/screens/search/SoundCloudSearchScreen.tsx` -- debounced `search` (l.32, 500 ms); skeleton only when `isSearching` (l.86); `ListEmptyComponent` says « Aucun titre trouvé » when `!isSearching` (l.113–126). Add a pending state set on change and cleared when the debounce fires or the query is emptied (cancel the debounce then). Replace its raw `TextInput` (l.76) with `SearchBar` (+ `loading`).
- `mobile/src/screens/playlists/SearchTracksScreen.tsx` -- own inline search field with icon and clear (l.~177–206, styles `searchInputWrapper`/`searchIcon`/`searchInput`): replace with `SearchBar` (`autoFocus`, `loading={isSearching}`), drop those styles. Row: `trackInfo` column holds title, artist, duration (l.142–149); placeholder URL at l.126.
- `mobile/src/components/common/SearchBar.tsx` (+ `SearchBar.test.tsx`) -- today a bare `TextInput`; used also by `PlaylistSharingScreen.tsx` and `FriendsScreen.tsx`. Add `search` icon, a clear button (`close-circle`, `accessibilityLabel` « Effacer la recherche ») shown when `value` is non-empty, and an optional `loading` `ActivityIndicator`.
- `mobile/src/screens/search/components/SoundCloudTrackItem.tsx` -- `info` (flex 1) has no right margin before `duration`; give `info` `marginRight` and `duration` `flexShrink: 0`. Placeholder at l.28. Add the badge.
- `mobile/src/types/soundcloud.types.ts` -- add optional `policy?: string` and `snipped?: boolean` on transcodings (the backend passes SoundCloud's search objects through as is: `soundcloud-search.service.ts` l.55–64). Mirror both as optional in `backend/src/features/soundcloud/soundcloud.types.ts` and the `SoundCloudTrack` schema of `soundcloud.openapi.ts` (l.318).
- `mobile/src/utils/` -- new `soundcloudPreview.ts` (+ test): `isPreviewOnly(track)`.
- `mobile/src/components/common/` -- new `Artwork.tsx` (+ test): `uri?: string | null`, `size`, style; `Image` when uri, else a `musical-notes` icon on `surfaceAlt`. Replace placeholders in `SoundCloudTrackItem.tsx` l.28, `SearchTracksScreen.tsx` l.126, `MiniPlayer.tsx` l.227, `PlayerModal.tsx` l.201 (keep its `largeArtwork`), `music-control/DeviceListeningCard.tsx` l.60.

## Tasks & Acceptance

**Execution:**
- [x] `SearchBar.tsx` + test -- icon, clear, `loading`.
- [x] `SoundCloudSearchScreen.tsx` -- `SearchBar`, pending state; test the « Typing » and « Truly empty » rows (new `SoundCloudSearchScreen.test.tsx`).
- [x] `SearchTracksScreen.tsx` -- `SearchBar` with `loading`; `Artwork`; badge; row gap.
- [x] `soundcloudPreview.ts` + test; types (mobile, backend, OpenAPI).
- [x] `SoundCloudTrackItem.tsx` -- row gap, badge, `Artwork`.
- [x] `Artwork.tsx` + test; replace the other placeholders.

**Acceptance Criteria:**
- Given the Search tab, when a query is typed, then a loader shows until results or « Aucun titre trouvé ».
- Given any list or player, when a track has no artwork, then a local placeholder shows and no `via.placeholder.com` URL remains in `mobile/src`.

## Verification

**Commands:**
- `cd mobile && npm test && npm run type-check && npm run lint` -- expected: all pass.
- `cd backend && npm run type-check && npm run lint` -- expected: pass (type and OpenAPI change only).
- `grep -rn "via.placeholder" mobile/src` -- expected: no match.

**Manual checks (if no CLI):**
- At the `main` acceptance pass: type in Search, new search on « Ajouter des titres », long title, a SoundCloud Go track, clear button, a track without artwork.

## Implementation Notes

- The « Extrait » badge is a shared `mobile/src/components/track/PreviewBadge.tsx` (not listed in the Code Map) so both rows draw the same badge.
- `SearchTracksScreen` has the same pending state as the Search tab (skeleton, empty state and bar spinner during the debounce).
- `SearchTracksScreen`: clearing the field now cancels the debounce and clears results at once (as the old inline clear did), since `SearchBar` clears through `onChangeText('')`.
- `SoundCloudSearchScreen` cancels its debounce on unmount; the bar spinner is hidden during pull-to-refresh (the refresh control already shows one).
- `SearchBar` now always shows a magnifier and a clear button, also on Partage and Amis.
- `MiniPlayer` and `PlayerModal` keep their own empty-state (no track) blocks; only the track artwork goes through `Artwork`.

## Plan Change Log

## Review Triage Log

Quick review, pass 1: 3 findings, medium 2, low 1. Two patched, one deferred to a ticket.

- medium, patched: « Ajouter des titres » still showed « Aucun titre trouvé » during the debounce; the matrix row is not scoped to the Search tab. It got the same pending state, with a test.
- low, patched: `PlayerModal`'s `styles.artwork` background (`surface`) overrode the placeholder's `surfaceAlt`. Now `surfaceAlt`.
- medium, deferred: clearing during an in-flight search, or out-of-order responses, can bring back stale results; `soundcloudStore.search` has no request id or abort. Pre-existing, not caused by this change. Ticket #349.

Also deferred: the `SoundCloudTrack` OpenAPI schema documents a shape (`artist`, `trackUri`, …) that the search endpoint does not return; pre-existing.

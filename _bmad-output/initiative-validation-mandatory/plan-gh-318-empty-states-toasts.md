---
title: 'États vides et toasts unifiés (#318)'
type: 'feature'
ticket: ''
created: '2026-10-16'
status: 'built'
baseline_revision: '434883dd72e81ee8b767d7abae45215f45add001'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Empty lists are rendered case by case (ad-hoc `<Text>`, English text, one section blank: friends' playlists on PlaylistsScreen), toasts use the library's default look outside the theme (`config/toastConfig.ts` is dead code), and API errors reach the user through six local helpers or raw English `ApiError.message` ("Session expired. Please login again.", fetch's "Network request failed").

**Approach:** One `EmptyState` (with an optional action button) for every empty list; one themed toast renderer used by every `<Toast />` mount; one `apiErrorMessage(error, fallback)` helper that turns any error into a readable French message, used by every error toast.

## Boundaries & Constraints

**Always:** user-facing text in French; toasts keep `utils/toast.ts` as the only entry point (`showSuccess/showError/showInfo/showWarning`, top position, 3 s / 4 s); toast colours come from the active theme (`success`, `error`, `warning`, `info` or nearest theme tokens; text readable on them); `apiErrorMessage` maps known `ApiError.code`/`status` to French and otherwise returns the caller's French fallback, never a raw English server/fetch message.

**Never:** no new dependency; no `Alert.alert`; form field validation errors (Login/Register/ForgotPassword/ResetPassword/EditProfile `FormError`, code input) stay inline; page load-failure states stay as page states; compact section texts inside sheets (`DevicePickerSheet`, `TrackActionsSheet`) stay as they are; store-internal English error strings (`authStore`, `playlistStore`) are not rewritten except `CONFLICT_MESSAGE`, which is toasted.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Network down | `ApiError` code `NETWORK_ERROR` | « Impossible de joindre le serveur. Vérifiez votre connexion. » | — |
| Session expired | code `SESSION_EXPIRED` | « Session expirée, reconnectez-vous. » | — |
| Rate limited | status 429 | « Trop de tentatives, réessayez dans un instant. » | — |
| Server error | status ≥ 500 | « Le serveur a rencontré un problème. Réessayez plus tard. » | — |
| Known domain code | `TRACK_DUPLICATE`, `PLAYLIST_ACCESS_DENIED`, `PLAYLIST_NOT_FOUND`, `DEVICE_OFFLINE`, `QUEUE_ACCESS_DENIED`/403 on control | the French text the local helpers use today | — |
| Unknown error | other `ApiError`, plain `Error`, non-error | caller's fallback | — |
| Empty list with action | e.g. no own playlist | `EmptyState` with message + button (« Créer une playlist ») that navigates | — |

</frozen-after-approval>

## Code Map

All under `mobile/src/`.
- `components/common/EmptyState.tsx` -- `{ message, icon?, style? }`; add `action?: { label; onPress }` (themed button, `accessibilityRole="button"`).
- `utils/toast.ts` -- keep API. `config/toastConfig.ts` -- unused, replace by a themed renderer (e.g. `components/common/AppToast.tsx` rendering `<Toast config={...} />` from `useTheme()`; theme tokens in `themes/types.ts`). Mounts: `App.tsx:28` (outside `ThemeProvider`: move inside), `components/player/QueueModal.tsx:133`, `DevicePickerSheet.tsx:237` (inside Modals: use the same component).
- `services/api.ts:44` -- `ApiError { message, code, details?, status? }`; leave its thrown messages alone, map them in the helper.
- Local helpers to replace by `utils/apiErrorMessage.ts`: `errorMessage` (`screens/profile/MyDevicesScreen.tsx:29`, `LinkedAccountsScreen.tsx:36`), `getErrorMessage` (`screens/playlists/SearchTracksScreen.tsx:96`, English), `addTrackError` (`components/track/TrackActionsSheet.tsx:35`), `transferErrorMessage` (`store/transferPlayback.ts:67`); `controlErrorMessage` (`hooks/useMusicControl.ts:143`) works on a socket `ControlError`, not an `ApiError`: keep it. Other `showError(err.message …)` call sites: `PlaylistSharingScreen.tsx:244`, `EditProfileScreen.tsx:91`, `PrivacySettingsScreen.tsx:41,84`, `MusicPreferencesScreen.tsx:43,81`.
- English toasts: `LinkedAccountsScreen.tsx:61-94`, `BackendUrlField.tsx:49,59`, `store/playlistStore.ts:16` `CONFLICT_MESSAGE`.
- Inline action-error banners to turn into `showError`: `screens/friends/FriendsScreen.tsx:260` ('Search error'), `screens/search/SoundCloudSearchScreen.tsx:67`.
- Empty lists to move onto `EmptyState` (routes from `navigation/AppNavigator.tsx`): `PlaylistsScreen.tsx:229` own (action `CreatePlaylist`), `:285` public, `:181` + `components/playlist/FriendPlaylistSection.tsx:31` friends section renders blank because `PlaylistsScreen.tsx:104` filters out friends without playlists (action: `FriendsTab`); `PlaylistDetailScreen.tsx:249` English (action `SearchTracks{playlistId}` when `canEdit`); `screens/search/SoundCloudSearchScreen.tsx:94`; `FriendsScreen.tsx:278` English (action: switch local tab to `'search'`), `:307` English; `UserProfileScreen.tsx:281` "No playlist"; `PlaylistSharingScreen.tsx:576` "No user found", `:519` `getEmptyMessage` English; `MyDevicesScreen.tsx:193` (action `FriendsTab`), `:217`. `QueueModal.tsx:84` and `SearchTracksScreen.tsx:240` already use `EmptyState`.

## Tasks & Acceptance

**Execution:**
- [x] `components/common/EmptyState.tsx` (+ test) -- optional action button.
- [x] `utils/apiErrorMessage.ts` (+ test covering every matrix row) -- the helper.
- [x] `components/common/AppToast.tsx` (+ jest-expo test: each type renders its message with theme colours) -- themed `<Toast config>`; delete `config/toastConfig.ts`; mount it in `App.tsx` inside `ThemeProvider`, `QueueModal.tsx`, `DevicePickerSheet.tsx`.
- [x] Error call sites listed in the Code Map -- use `apiErrorMessage` with a French fallback; remove the replaced local helpers; French for the English toasts and `CONFLICT_MESSAGE`; FriendsScreen and SoundCloudSearchScreen search failures become `showError` toasts, their banners go.
- [x] Empty lists listed in the Code Map -- `EmptyState` with French message and the action named there; fix the blank friends section.
- [x] Update the tests that assert the changed texts.

**Acceptance Criteria:**
- Given any list in the Code Map with no item, when the screen shows, then an `EmptyState` with a French message is visible (never a blank area).
- Given an add, delete, share or transfer action that succeeds or fails, then feedback appears through the same themed toast.
- Given an API failure of any kind, then the toast text is French and readable.

## Implementation Notes

- Toast look: theme `surface` background, 6 px left bar and icon in the state colour, text in `text`/`textSecondary` (white on `warning`/`success` is unreadable in some themes; `textInverse` is black in `original`).
- `apiErrorMessage` also maps `QUEUE_ITEM_NOT_FOUND` (replaces `transferErrorMessage`'s 404 case) and the codes whose English text the screens used to show: `DEVICE_NOT_FOUND`, `NOT_FRIENDS`, `PROVIDER_ALREADY_LINKED`, `PROVIDER_ALREADY_SET`, `INVALID_PROVIDER_TOKEN`, `LAST_PROVIDER`.
- SoundCloudSearchScreen: `soundcloudStore.error` is a string, so the toast uses a fixed French text and clears the store error.
- FriendsScreen: tab labels and search placeholder translated along the way.

## Plan Change Log

## Review Triage Log

Pass 1 (quick) — high 0, medium 1, low 1, false 2, maybe-false 0.

| Finding | Verdict | Route | Evidence / action |
|---|---|---|---|
| Failed search ends on a false « aucun résultat » EmptyState once the toast fades (SoundCloudSearch, Friends) | medium | patch | Verified in `soundcloudStore` catch (`searchResults: []`) and FriendsScreen catch. Patched: failed-search EmptyState with « Réessayer ». |
| API-failure toasts in FriendsScreen:96, PlaylistSharing ×5, CreatePlaylist:87 bypass `apiErrorMessage` | low | patch | Fixed text hides network/session/429/5xx. Patched: wrapped with the current text as fallback. ShareLinkButton is not an API call (false). |
| Global code → text map could name the wrong context for future callers | false | reject | No current call site misbehaves (reviewer's own trace). |
| EditProfile FormError now shows the mapped/fallback text | false | reject | Intended: Always clause forbids raw English server text; the error stays inline as the Never clause asks. |

## Verification

**Commands:**
- `cd mobile && npm test` -- expected: all suites pass
- `cd mobile && npm run type-check && npm run lint` -- expected: no errors

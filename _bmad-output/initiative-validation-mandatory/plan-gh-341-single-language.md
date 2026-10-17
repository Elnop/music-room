---
title: 'Une seule langue : toute l''app en français (#341)'
type: 'refactor'
ticket: 'https://github.com/Elnop/music-room/issues/341'
created: '2026-10-17'
status: 'built'
baseline_revision: 'cb99efee55e7ad4b5593cfb391f97ec37b0c0e55'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md', '{project-root}/_bmad-output/initiative-validation-mandatory/plan-gh-341-inventory.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #341. The app mixes English and French, sometimes on one screen. Examples:
- the whole authentication flow and its toasts, including backend messages shown as is (« Invalid email or password »);
- headers in French over English content;
- dates in `en-US` (« Member since October 2026 »);
- « NOW PLAYING »;
- tutoiement (« Choisis un son ») next to vouvoiement.

Several screens repeat their header title as a big in-content title.

**Approach:** French everywhere, formal register, in `mobile/src`:
- **Text:** every user-visible string is translated: JSX text, props such as `title`/`label`/`placeholder`/`accessibilityLabel`, toasts, alerts, zod messages, store and service fallbacks, navigation titles.
- **Backend errors:** `authStore` and the other pass-throughs map them through `apiErrorMessage` (backend error codes → French), never showing the server's English text.
- **Dates:** formatted `fr-FR`.
- **Duplicate titles:** keep the header title and drop the in-content one, keeping its subtitle.
- **Wording:** « titre » for a track and « file d'attente » for the queue, as already used.

## Boundaries & Constraints

**Always:**
- Vouvoiement.
- Proper nouns stay: SoundCloud, Google, Facebook, Zumik, theme names « Original » and « Lime ».
- User content is untouched.
- Logs (`console.*`, `logger`) and dev-only text may stay in English.
- Existing behaviour unchanged; only text, date locale and the removed duplicate titles change.
- Tests that assert the old English text are updated to the French one, never deleted.

**Never:**
- Changing backend messages: the backend API stays in English, and the app maps codes.
- Adding an i18n library or a second language.
- Translating identifiers, error codes, or log messages.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Wrong password | API `INVALID_CREDENTIALS` | « Email ou mot de passe incorrect » | No error expected |
| Unknown auth code | API error with an unmapped code | French fallback for that action, not the server text | No error expected |
| Member since | `createdAt` 2026-10-01 | « Membre depuis octobre 2026 » | No error expected |
| Player empty | Nothing playing | « Choisissez un titre pour commencer » | No error expected |

</frozen-after-approval>

## Code Map

The file-by-file inventory (strings, lines, codes, tests to update) is `plan-gh-341-inventory.md` beside this plan, loaded through `context:`. Key points:
- `mobile/src/utils/apiErrorMessage.ts` -- `CODE_MESSAGES` maps codes to French and never returns the raw message. Add the auth codes listed in the inventory, checking each against `backend/src/features/auth/`. `authStore` then uses `apiErrorMessage(error, '<French fallback>')` instead of `error.message`, and so do `queueStore` l.292/308 and `useMusicControl` `controlErrorMessage`'s default.
- `mobile/src/utils/formatters.ts` -- `formatDate` to `fr-FR`. `formatRelativeTime` in French (« à l'instant », « il y a 5 min »…).
- `mobile/src/types/user.types.ts` -- `VISIBILITY_LABELS`, `GENRE_INFO` labels.
- Duplicate titles: PrivacySettings, LinkedAccounts, MyDevices, MusicPreferences (+ `GenreSelector` heading), EditProfile. PlaylistSharing only translated.

## Tasks & Acceptance

**Execution:**
- [x] `apiErrorMessage.ts` (+ test) -- auth codes; `authStore.ts` (+ test), `queueStore.ts`, `useMusicControl.ts` -- map errors.
- [x] Auth screens, `validators.ts`, `AuthNavigator.tsx` -- translate.
- [x] Profile, friends, playlist screens and their components -- translate; remove duplicate titles.
- [x] Player (`PlayerModal`, `MiniPlayer`, `PlayerContext`), `ErrorBoundary`, `BackendUrlField`, `ThemeSelector`, `PlaylistCard`, `SwipeableUserItem`, `GenreSelector`, `user.types.ts`, services, stores -- translate.
- [x] `formatters.ts` (+ test), `ProfileScreen`, `UserProfileScreen` -- `fr-FR` dates.
- [x] Tests asserting English text -- update.

**Acceptance Criteria:**
- Given any screen of `mobile/src/screens` and `components`, when it renders, then no English text shows, apart from proper nouns, user content and dev-only text.
- Given an auth failure, when the API answers with a known code, then the toast and form error are French.

## Verification

**Commands:**
- `cd mobile && npm test && npm run type-check && npm run lint` -- expected: all pass.
- A grep over `mobile/src` (excluding tests) for common English UI words ("Loading", "Save", "Failed", "Please", "Unable", "Sign", "Password") -- expected: only identifiers, logs and dev-only text remain.

**Manual checks (if no CLI):**
- At the `main` acceptance pass: walk the auth flow with a wrong password, the profile screens, Partage, the empty player.

## Implementation Notes

- `VALIDATION_ERROR` is not mapped in `CODE_MESSAGES`: it is shared by every endpoint, and the caller's action-specific French fallback says more than a generic text.
- `PROVIDER_NOT_LINKED`, `NO_CODE_FOUND`, `CODE_EXPIRED`, `RESEND_COOLDOWN`, `RESEND_LIMIT_EXCEEDED`, `ACCOUNT_LOCKED`, `IP_BLOCKED` added after checking `backend/src/features/auth/`. `INVALID_TOKEN` covers the Google/Facebook token refusals.
- OAuth: the `Login failed: ${error.message}` branch is gone; an unknown native error keeps the French per-provider fallback. `oauth.ts` messages are internal (compared by `authStore`) and stay English.
- `ErrorBoundary` shows the raw error message in `__DEV__` only; production shows a French generic text.
- `playlistStore`/`soundcloudStore` keep storing `error.message` (no screen displays them); only their fallbacks are translated. `api.ts` client-side `ApiError` messages translated too.
- Also translated: `SearchBar` default placeholder, theme names « Bleu royal » / « Noël », role « Lecteur », genre labels « Classique », « Électro », « Latino ».

## Plan Change Log

## Review Triage Log

Quick review, pass 1: 6 findings, medium 3, low 3, all patched by the implementer, then full verification green (792 tests in UTC and America/New_York, type-check, lint).

- medium, patched: `INVALID_TOKEN` is also `authMiddleware`'s 401 on every protected endpoint; mapping it globally replaced each action's French fallback. Removed from the map; OAuth paths keep their provider text.
- medium, patched: translating PlaylistSharing's public/open title to « Partage » duplicated the stack header. Now « Playlist ouverte à tous ».
- medium, patched: `deviceService` fallbacks `${Platform.OS} Device` / `Unknown` showed in Mes appareils. Now « Appareil Android/iOS » / « Modèle inconnu ».
- low, patched: the « Membre depuis » test failed west of UTC (midnight fixture). Mid-month noon fixture.
- low, patched: `updateProfile` used a fixed text instead of `apiErrorMessage`. Aligned.
- low, patched: a LinkedAccounts assertion still matched the English labels and could not fail. Now matches « Lier/Délier Email ».

---
title: 'Tests de playerStore, soundcloudStore et composants communs (mobile)'
type: 'chore'
ticket: '8'
created: '2026-10-10'
status: 'built'
baseline_revision: '35641158ca69994d63108ce36cd47c9d375a1e18'
route: 'full'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/doc/TESTING.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `playerStore`, `soundcloudStore` and nine common components (Avatar, Button, Card, EmptyState, ErrorBoundary, FormError, Input, LoadingSpinner, SearchBar) have no unit tests, so CAP-3 / subject IV.8 is not covered for them (GitHub #101, epic #93).

**Approach:** Add jest-expo unit tests next to each file: stores tested directly through their actions (no rendering), components rendered with `@testing-library/react-native` against the real `originalTheme`. The suite must fail if `playTrack` stops setting `currentTrack`.

## Boundaries & Constraints

**Always:** One test file per module, named after it, next to it. Reset store state in `beforeEach` (`useXStore.setState(initial)`), reset mocks; no test depends on another's order. Mock `@/services/api` (`apiRequest`) and `@/contexts/ThemeContext` as existing tests do; never reach the network. No `any`. Assert behaviour (state, rendered text, callbacks), not styles or snapshots.

**Never:** No production code change (if a bug blocks a test, record it under Open Questions / a new issue instead). No snapshot tests. No tests for other components (SwipeableTrackItem, BackendUrlField, ...) or other stores. No barrel `index.ts`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| playTrack | idle store, track T | `currentTrack` = T, `pendingTrackId` = T.id, `playbackState` 'loading', `loading` true, `streamUrl` null, `error` null, `isModalOpen` false, `loadCounter` +1 | No error expected |
| playTrack same track twice | T played twice | `loadCounter` incremented each time | No error expected |
| State machine guards | `play`/`pause`/`resume`/`setPlaybackReady`/`setPlaybackPlaying` from each relevant state | transitions only from allowed states (e.g. `pause` no-op when not playing, `setPlaybackReady` only from 'loading') | No error expected |
| setError / setTrackUnavailableError / stop | error string or stop | `setError` resets to 'idle' and clears `pendingTrackId`; `setError(null)` keeps state; unavailable/stop clear track and stream | No error expected |
| search blank | `search('  ')` | results [], total 0, `apiRequest` not called | No error expected |
| search ok | `apiRequest` resolves `{collection, total_results}` | URL `/api/soundcloud/search?q=<q>&limit=20` (custom limit honoured), results/total set, `isSearching` false; missing fields → [] / 0 | No error expected |
| search fails | `apiRequest` rejects Error('x') / non-Error | `error` 'x' / 'Search failed', results [], `isSearching` false | caught in store |
| FormError empty | `message=''` | renders nothing | No error expected |
| ErrorBoundary | child throws | 'Something went wrong' + message; 'Try Again' resets and re-renders children once they no longer throw | silence `console.error` in that test |

</frozen-after-approval>

## Code Map

- `mobile/src/store/playerStore.ts` -- `usePlayerStore`; the guard is `playTrack` at lines 127-145, `currentTrack: track` at line 135.
- `mobile/src/store/soundcloudStore.ts` -- `useSoundCloudStore.search/clearSearch/clearError`; calls `apiRequest` from `@/services/api`.
- `mobile/src/types/soundcloud.types.ts` -- `SoundCloudTrack`, `SoundCloudSearchResult` for fixtures.
- `mobile/src/components/common/{Avatar,Button,Card,EmptyState,ErrorBoundary,FormError,Input,LoadingSpinner,SearchBar}.tsx` -- components under test; all but ErrorBoundary call `useTheme()`.
- `mobile/src/api/playlistApi.test.ts:4` -- pattern `jest.mock('@/services/api', () => ({ apiRequest: jest.fn() }))`.
- `mobile/src/screens/profile/MyDevicesScreen.test.tsx` -- pattern for mocking `@/contexts/ThemeContext` with `originalTheme` from `@themes/original.theme`, and RNTL usage.
- `mobile/src/store/playlistStore.test.ts` -- pattern for `setState` reset in `beforeEach`.
- `mobile/package.json` -- `"jest": { "preset": "jest-expo" }`; `npm test` runs all.

## Tasks & Acceptance

**Execution:**
- [x] `mobile/src/store/playerStore.test.ts` -- cover the playerStore rows of the matrix plus `toggleModal`/`setModalOpen`, `setLoading` ('idle'→'loading' only), `clearError`, `setStreamUrl` -- the acceptance guard lives here.
- [x] `mobile/src/store/soundcloudStore.test.ts` -- mock `apiRequest`; cover blank, ok (URL, default/custom limit, missing fields), Error and non-Error failures, `clearSearch`, `clearError`.
- [x] `mobile/src/components/common/Avatar.test.tsx` -- initials: two words → 'JD', one word → first two letters upper-cased, no name → '?'; `uri` renders an Image with that source and no initials.
- [x] `mobile/src/components/common/Button.test.tsx` -- `title` or `children` text shown; press calls `onPress`; `disabled` and `loading` block `onPress`; `loading` hides text and shows an ActivityIndicator; `icon` rendered.
- [x] `mobile/src/components/common/Card.test.tsx` -- renders children; with `onPress` pressing calls it; without `onPress` nothing pressable.
- [x] `mobile/src/components/common/EmptyState.test.tsx` -- message shown; icon rendered only when `icon` is given.
- [x] `mobile/src/components/common/ErrorBoundary.test.tsx` -- children rendered normally; thrown error shows fallback and message; 'Try Again' recovers.
- [x] `mobile/src/components/common/FormError.test.tsx` -- message shown; empty message renders null.
- [x] `mobile/src/components/common/Input.test.tsx` -- label shown; typing calls `onChangeText`; `error` text shown only when set; extra props (placeholder, `secureTextEntry`) forwarded to TextInput.
- [x] `mobile/src/components/common/LoadingSpinner.test.tsx` -- `message` shown when given; `variant="spinner"` renders ActivityIndicator; default renders the logo Image; unmount stops animations without error.
- [x] `mobile/src/components/common/SearchBar.test.tsx` -- value and default placeholder 'Search...'; custom placeholder; typing calls `onChangeText`.

**Acceptance Criteria:**
- Given the new tests, when `cd mobile && npm test` runs, then all suites pass, including the existing ones.
- Given `currentTrack: track` is removed from `playTrack` (`playerStore.ts:135`) temporarily, when `npm test -- playerStore` runs, then at least one test fails; the change is reverted and the implementer records the failing test name in Implementation Notes.
- Given the tests, when `npm run type-check` and `npm run lint` run in `mobile/`, then both are clean (no new errors).

## Implementation Notes

- Acceptance guard: with `currentTrack: track` commented out in `playerStore.ts:135`, `npx jest playerStore` fails 3 tests: "playerStore playTrack > sets the current track and enters the loading state", "... > increments loadCounter each time, even for the same track", "... > replaces the current track with the new one". Reverted (`git checkout`); 37/37 green again.
- Stores are reset with `setState(initial, true)` (full replace) from a snapshot taken at import; playerStore's `__DEV__` `console.log` calls are silenced with a spy.
- `EmptyState` icon test awaits one `act` tick: `@expo/vector-icons` loads its font asynchronously and re-renders, which otherwise logs an act() warning.
- Element-type queries (`ActivityIndicator`, `Image`, `Ionicons`, `TouchableOpacity`) use RNTL's `UNSAFE_*ByType`, since these components carry no text or testID and the plan forbids production changes.
- No production code changed; no bug found.

## Plan Change Log

## Review Triage Log

Quick review, 2 findings: both rejected.

- low, rejected: the LoadingSpinner unmount test checks only that unmount does not throw, not that the animations stop; asserting it needs spying on `Animated.loop`, more machinery than the cleanup line warrants.
- false: `ticket: '8'` is the ticket-tree id of the story (`tracker_id: "101"`), as the template asks.

## Verification

**Commands:**
- `cd mobile && npm test` -- expected: all suites pass.
- `cd mobile && npm test -- playerStore` with line 135 disabled -- expected: failure; then revert and re-run green.
- `cd mobile && npm run type-check` -- expected: no errors.
- `cd mobile && npm run lint` -- expected: no errors.

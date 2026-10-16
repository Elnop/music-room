---
title: 'Retours haptiques sur les actions de lecture (#319)'
type: 'feature'
ticket: ''
created: '2026-10-16'
status: 'built'
baseline_revision: '7f61a07ac8915ff26f1d5a379e12b53e7f2a6e89'
route: 'full'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Playback actions give no physical feedback: play/pause, next/previous, adding to the queue, picking up and dropping a track while reordering, and a successful playback transfer only change the screen.

**Approach:** One utility `utils/haptics.ts` over the installed `expo-haptics` with three fixed intensities, called from the UI handlers of those actions, once per action (never continuously during a gesture).

## Boundaries & Constraints

**Always:** three helpers only — `hapticTap` (light impact: play/pause, next/previous, buttons and mini-player swipes), `hapticSelection` (selection: reorder pick-up and drop), `hapticSuccess` (success notification: track added to the queue, transfer done); every helper is fire-and-forget and swallows rejections (a device without a vibrator must not throw or log an error); one vibration per action: at most one when a swipe crosses its threshold, none while the finger moves.

**Never:** no new dependency; no haptic from the media session / lock-screen controls (`MediaSessionBridge`) nor from remote socket events (only the user's own touches on this phone); no haptic on a disabled button or a refused action (`if (canToggle)` false, queue add not done, transfer failed, target already active).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Play/pause tap | modal or mini-player, toggle allowed | one `hapticTap` | toggle not allowed: none |
| Mini-player swipe | swipe past threshold left/right | one `hapticTap`, track changes | under threshold or no next/previous: none |
| Queue add | swipe-right open or « Ajouter à la file » / « Lire ensuite » | one `hapticSuccess` when the add succeeds | add refused/failed: none |
| Reorder | drag start, then drop | one `hapticSelection` at each | — |
| Transfer | `transferTo` switches device | one `hapticSuccess` | failed / untransferable / already active: none |
| No vibrator | `expo-haptics` rejects | nothing visible | rejection swallowed |

</frozen-after-approval>

## Code Map

All under `mobile/src/`.
- `components/player/PlayerModal.tsx` -- `handlePlayPause` (`if (canToggle) toggle()`), previous/next `onPress` (`previous`, `next` from `useNowPlaying`).
- `components/player/MiniPlayer.tsx` -- play `onPress` (`if (canToggle) toggle()`), next `onPress`; pan `onEnd` calls `runOnJS(next)()` / `runOnJS(previous)()` (l.~74): wrap in JS-side handlers that vibrate then act.
- `store/queueStore.ts` -- `if (added) showSuccess('Ajouté à la file de lecture')` (l.~295) and `'Lira ensuite'` (l.~306): both swipe (`components/common/QueueSwipe.tsx` `handleOpen`) and quick actions end there, so the success haptic goes next to these toasts — not in `QueueSwipe` (that would vibrate twice).
- `components/common/ReorderableList.tsx` -- wraps `react-native-reorderable-list`, whose `onDragStart` / `onDragEnd` must be worklets: use `runOnJS(hapticSelection)()` inside worklet callbacks.
- `store/transferPlayback.ts` -- `transferTo`: success paths are `switchTarget(); return true` (nothing playing) and after `queueApi.transfer` resolves; the two early `return true` (target already active) and the failure paths get none.
- `components/player/MediaSessionBridge.tsx` -- calls the player directly: leave untouched.
- `expo-haptics` ~15.0.8 is installed; jest mocks live per test file (`jest.mock(...)`).

## Tasks & Acceptance

**Execution:**
- [x] `utils/haptics.ts` + `utils/haptics.test.ts` -- the three helpers (`impactAsync(Light)`, `selectionAsync()`, `notificationAsync(Success)`), rejections swallowed; tests check each call and that a rejection does not throw.
- [x] `components/player/PlayerModal.tsx`, `MiniPlayer.tsx` -- `hapticTap` on allowed play/pause/next/previous presses and on mini-player track swipes.
- [x] `store/queueStore.ts` -- `hapticSuccess` with the two add toasts.
- [x] `components/common/ReorderableList.tsx` -- selection haptic on drag start and drag end.
- [x] `store/transferPlayback.ts` -- `hapticSuccess` on the two switch paths.
- [x] Tests (mock `@/utils/haptics` or `expo-haptics`): PlayerModal / MiniPlayer (`MiniPlayer.test.tsx`, `MiniPlayer.gestures.test.tsx`) tap and swipe call once and not when disabled; `queueStore` add success vs refused; `transferPlayback` success vs failure / already active.

**Acceptance Criteria:**
- Given each listed action done by touch on the phone, then it vibrates lightly once.
- Given a swipe or drag in progress, then no vibration happens until the threshold / pick-up, and only one.

## Implementation Notes

- PlayerModal and MiniPlayer route play/pause, next and previous through small handlers that check the same guard as the button's `disabled` (`canToggle`, `canGoNext`, `canGoPrevious`), vibrate, then act; the mini-player swipe calls the same handlers through `runOnJS`, so one swipe vibrates at most once, on release past the threshold.
- `ReorderableList` passes one worklet to both `onDragStart` and `onDragEnd` that calls `runOnJS(hapticSelection)()`.
- Queue add and transfer vibrate in the store, so `MediaSessionBridge` and socket handlers stay silent (neither calls `addItem`, `playNext` or `transferTo`).

## Plan Change Log

## Review Triage Log

Pass 1 (quick) — high 0, medium 0, low 3, false 2, maybe-false 0. No functional bug found.

| Finding | Verdict | Route | Evidence / action |
|---|---|---|---|
| PlayerModal: allowed next press untested | low | patch | Added « taps once on an enabled next ». |
| PlayerModal 'taps once on previous' does not assert the action | low | patch | Now asserts the restart seek (local, 30 s). |
| Partial haptics mocks leave `hapticSelection`/`hapticSuccess` undefined | low | patch | All three helpers mocked. |
| Disabled-next tests never reach the `canGoNext` guard | false | reject | A disabled button cannot be pressed; the guard is belt-and-braces, behaviour is covered. |
| Reorder test does not fire a "moving" event | false | reject | Nothing is wired to `onIndexChange`; no code path to test. |

## Verification

**Commands:**
- `cd mobile && npm test` -- expected: all suites pass
- `cd mobile && npm run type-check && npm run lint` -- expected: no errors

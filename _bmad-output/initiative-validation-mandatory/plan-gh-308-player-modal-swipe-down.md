---
title: 'Swipe the player modal down to close it on Android (#308)'
type: 'bugfix'
ticket: ''
created: '2026-10-15'
status: 'built'
baseline_revision: '472395899156f6a580cef512b10ee2a80251ccaf'
route: 'oneshot'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context:
  - '{project-root}/doc/TESTING.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** On Android, dragging the player modal down does not close it. `PlayerModal` has a `Gesture.Pan()`, but its React Native `Modal` is a separate native window with no `GestureHandlerRootView` inside, so react-native-gesture-handler never receives the touches there. `QueueModal` already wraps its content.

**Approach:** Wrap the content of `PlayerModal`'s `Modal` in a `GestureHandlerRootView`. Make the pan activate only on a downward drag and fail on horizontal movement (`activeOffsetY` / `failOffsetX`), so the progress slider and the buttons keep working. Under the threshold, the modal snaps back as it does on iOS today.

</frozen-after-approval>

## Implementation Notes

Oneshot: one component and its test. The fix copies the `GestureHandlerRootView` wrapping already used in `mobile/src/components/player/QueueModal.tsx` (lines 85-119).

- `mobile/src/components/player/PlayerModal.tsx`: wrap the `Modal` children (the `GestureDetector` plus the nested `QueueModal` / `DevicePickerSheet`) in `<GestureHandlerRootView style={styles.container}>`. Add `.activeOffsetY(…)` and `.failOffsetX([…])` on `panGesture`. Keep `DISMISS_THRESHOLD`, velocity rule and animations unchanged.
- `mobile/src/components/player/PlayerModal.test.tsx`: already mocks `GestureHandlerRootView` as a `View`. Add tests with RNGH's `fireGestureHandler` / `getByGestureTestId` (pan given a `withTestId`): a long downward drag closes the modal (`isModalOpen` false), a short one keeps it open, and the queue and device picker buttons still open their sheets.
- Manual on Android (native debug build): drag past the threshold closes; under it snaps back; the slider seeks without closing.
- Done: wrapper and offsets as planned (`activeOffsetY(10)`, `failOffsetX([-15, 15])`, `withTestId('player-modal-pan')`). Four new tests: drag past the threshold, quick flick, short drag, and the pan config. `fireGestureHandler` skips RNGH activation rules, so the offsets are asserted on the gesture's config. A positive `activeOffsetY` sets `activeOffsetYEnd` (downward only). The 7 `act(...)` warnings and the `react-hooks/immutability` lint warning on `translateY.value = 0` were already there before this change.
- Not done here: the manual check on an Android phone.

## Review Triage Log

- Pass 1 (quick): 1 finding. low, patched: the activation offsets had no test (`fireGestureHandler` bypasses them). Added a test asserting `activeOffsetYEnd`, `failOffsetXStart` and `failOffsetXEnd` on the pan config. The manual Android check is still open.

## Verification

**Commands:**
- `cd mobile && npx jest src/components/player/PlayerModal.test.tsx` -- expected: all pass
- `cd mobile && npm run type-check && npm run lint` -- expected: no errors
- `make test` -- expected: exit 0

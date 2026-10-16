---
title: 'Mini-player gestures: swipe next/previous, swipe up to open (#311)'
type: 'feature'
ticket: ''
created: '2026-10-16'
status: 'built'
baseline_revision: '14ef55268141d6706a9f6b14f5c02ca9cbe00b4e'
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

**Problem:** The mini-player only reacts to a tap, the play button and the next button. Spotify-style gestures are missing. GitHub #311.

**Approach:**
- A pan on the mini-player:
  - left past a threshold → next;
  - right → previous;
  - up → open the player modal.
- The artwork and the title follow the finger horizontally, then spring back.
- The actions are `useNowPlaying`'s `next` / `previous` (remote mode included). A swipe with nothing to go to springs back.
- Previous is allowed under the same rule as the modal's button: `canToggle && (hasPrevious || (!isRemote && position > RESTART_THRESHOLD_S))`.
- Tap and play/pause keep working.

</frozen-after-approval>

## Implementation Notes

Oneshot: `MiniPlayer.tsx` and its test.
- `Gesture.Pan()` from react-native-gesture-handler. `App.tsx` already has `GestureHandlerRootView`, and the mini-player is not inside a `Modal`.
- `activeOffsetX([-15, 15])` / `activeOffsetY(-15)`, so a tap still reaches the `TouchableOpacity`.
- A reanimated `translateX` on the artwork and info block.
- `withTestId('mini-player-pan')`, tested with `fireGestureHandler`, like #308.
- Done as planned. A test file of its own (`MiniPlayer.gestures.test.tsx`) mocks `useNowPlaying`. The existing `MiniPlayer.test.tsx` runs the real stores.

## Review Triage Log

- Pass 1 (quick): 2 findings. 1 patched, 1 rejected.
  - low, patch: a quick flick under 80 px sprang back, unlike the modal swipe (#308, `velocityY > 500`). Fix: a flick faster than `SWIPE_FLICK_VELOCITY` (800 px/s) also counts, horizontally and up. Test added.
  - low, rejected: the spring-back to 0 has no assertion. The reanimated mock does not expose the animated value, the behaviour is a single `withSpring(0)`, and testing it would add complexity for a cosmetic check.

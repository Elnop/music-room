---
title: 'Accessibilité du lecteur et des listes (#320)'
type: 'feature'
ticket: ''
created: '2026-10-16'
status: 'built'
baseline_revision: 'bb3a6a44e1aea8116dfb0254da27f52d43ffdf71'
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

**Problem:** With TalkBack, several icon-only controls of the player and track lists have no label or role (player close button, mini-player info area, track row and its swipe-delete button), labels mix English and French, the progress slider cannot be adjusted by screen reader, and `getAdaptiveColors` picks black/white text from a rough brightness test that ignores the gradient fading into the theme background, so text can become unreadable (e.g. light artwork over the dark `original` theme turns the bottom of the modal dark under black text).

**Approach:** Label every icon-only control in the player components and list rows (French, with role and state), give every tap target at least 44×44 through `hitSlop`, make the progress slider adjustable with increment/decrement actions, and replace the colour heuristic by a WCAG-based palette computed against the actual gradient ends.

## Boundaries & Constraints

**Always:** labels in French, consistent with the existing ones (`Fermer la file d'attente`, `Réordonner`…); disabled buttons expose `accessibilityState.disabled`; text and secondary text on the player modal keep a contrast ratio ≥ 4.5:1 (WCAG AA) at both ends of the gradient, for every theme background; existing gestures (swipe-down, mini-player swipes, drag to reorder) keep working.

**Never:** no new dependency; no change of layout sizes that moves the design (use `hitSlop`, not bigger buttons); no remote seek (the backend has none, #297): the slider stays disabled in remote mode; screens outside player components and track rows are out of scope.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Very light artwork, dark theme | dominant `#F5F5F5`, base `#0D0D0D` | text/textSecondary ≥ 4.5:1 on both gradient ends | falls back to an opaque gradient when no text colour reaches 4.5:1 on both ends |
| Very dark artwork, light theme | dominant `#0A0A0A`, base `#FEFCE8` | same guarantee | same fallback |
| Mid-grey artwork | dominant `#808080`, any base | same guarantee | same fallback |
| Slider increment | local track at 30 s of 200 s | seeks to 40 s | clamped to [0, duration]; no-op in remote mode or without a player |
| Slider decrement | at 5 s | seeks to 0 s | clamped |

</frozen-after-approval>

## Code Map

- `mobile/src/hooks/useImageColors.ts` -- `isLightColor` (perceived brightness, threshold 0.5), `hexToRgba`, `getAdaptiveColors(dominant)`; only `PlayerModal` uses the last two. Keep `useImageColors` hook untouched.
- `mobile/src/components/player/PlayerModal.tsx` -- builds `colors` (l.114-134) and `gradientColors` (alphas 0.95/0.7/0.5/0.4 over `theme.colors.background`, l.158-170); close button (l.199) has no label; header buttons 40×40; English labels `Previous track`/`Play`/`Pause`/`Next track`; `Slider` (l.278) — `@react-native-community/slider` 5.0.1 forwards `accessibilityActions`, `accessibilityValue`, `onAccessibilityAction`; `handleSeek` (l.148) holds the remote/no-player guard.
- `mobile/src/components/player/MiniPlayer.tsx` -- outer `TouchableOpacity` (opens the modal) has no label; play (40×40, hitSlop 10) and next (36×40, hitSlop 6/10) labelled in English; info lives in `Animated.View styles.swipeArea` under a Pan gesture.
- `mobile/src/components/player/QueueModal.tsx`, `QueueItemRow.tsx`, `DevicePickerSheet.tsx` -- mostly labelled; close buttons 40×40 without `hitSlop`; DevicePickerSheet retry button (l.163) has no role.
- `mobile/src/components/common/SwipeableTrackItem.tsx` -- delete action (l.38) and row `Pressable` (l.53, long-press opens actions) have no label/role; `Reorder track` in English.
- `mobile/src/components/track/TrackActionsButton.tsx` -- 32×32 with `hitSlop={10}`: already ≥ 44.
- Tests asserting English labels: `MiniPlayer.test.tsx`, `MiniPlayer.gestures.test.tsx`, `PlayerModal.test.tsx`, `SwipeableTrackItem.test.tsx`.
- Theme backgrounds: `#0D0D0D` (original), `#FEFCE8`, `#F8FAFC`, `#FFFBEB`.

## Tasks & Acceptance

**Execution:**
- [x] `mobile/src/hooks/useImageColors.ts` -- add WCAG helpers (relative luminance, contrast ratio, alpha compositing over a base) and change `getAdaptiveColors(dominant, base)` to return `{ text, textSecondary, buttonBg, accent, accentBg, onAccent, gradient }`: composite the top and bottom gradient stops over `base`, pick black or white text by the best worst-case contrast; if below 4.5, use an opaque gradient of the dominant colour; pick the lowest secondary alpha (from 0.7 up to 1) that still reaches 4.5 on both ends; `onAccent` is the opposite pole of `accent` -- contrast against the real background, not the raw artwork colour.
- [x] `mobile/src/hooks/useImageColors.test.ts` -- new: the matrix colour cases against each theme background assert ≥ 4.5 for text and textSecondary on both ends.
- [x] `mobile/src/components/player/PlayerModal.tsx` -- use the new palette (gradient and `playBtnIcon` from it); label + role on close/devices/queue buttons, `hitSlop` to reach 44; French labels `Piste précédente`, `Lecture`, `Pause`, `Piste suivante` with `accessibilityRole="button"` and `accessibilityState={{ disabled }}`; slider gets `accessibilityLabel="Position de lecture"`, `accessibilityValue` text `m:ss sur m:ss`, `accessibilityActions` increment/decrement seeking ±10 s through `handleSeek`, clamped.
- [x] `mobile/src/components/player/MiniPlayer.tsx` -- French labels, roles and disabled states on play/next, `hitSlop` to 44 on next; the info area becomes a labelled button (`Ouvrir le lecteur, <titre>, <artiste>`) without breaking the swipe gestures.
- [x] `mobile/src/components/player/QueueModal.tsx`, `DevicePickerSheet.tsx`, `QueueItemRow.tsx` -- role on close buttons, `hitSlop` to 44, role on retry button.
- [x] `mobile/src/components/common/SwipeableTrackItem.tsx` -- label `Supprimer <titre>` + role on the delete action, label `<titre>, <artiste>` and hint on the row, `Réordonner` label.
- [x] Update the four test files for the new labels; add PlayerModal tests for the close button label and slider increment/decrement (seekTo called with clamped value, not called in remote mode).

**Acceptance Criteria:**
- Given TalkBack on, when the user explores the mini-player and the player modal, then every control announces a French name, its role and whether it is disabled, so a track can be played, paused, skipped and the queue opened without seeing the screen.
- Given any player component, when its tests query icon buttons by label, then none is missing a label.
- Given the player modal open on a very light or very dark artwork, under any theme, then title, artist, times and icons stay readable.

## Implementation Notes

- `isLightColor` removed (its only user was `PlayerModal`); `getAdaptiveColors` returns `null` for a non-`#RRGGBB` input and the modal then keeps the theme colours.
- Contrast is checked on the gradient sampled every 0.05 of opacity between the bottom (0.4) and top (0.95) stops, not only the two ends: the blend between stops is linear in sRGB, and luminance along it is not always monotonic.
- MiniPlayer: the outer touchable is `accessible={false}`, so TalkBack reaches the info button, play and next apart; the info area is a nested `TouchableOpacity` labelled `Ouvrir le lecteur, <titre>, <artiste>[, sur <appareil>]`. Next already had a 52×60 target through its existing `hitSlop`.
- PlayerModal header buttons and the Queue/Device close buttons get a 4 px `hitSlop` (48×48); the device picker retry button too. QueueItemRow's swipe "Retirer" action gets its role.
- Slider: `@react-native-community/slider` 5.0.1 drops `onAccessibilityAction`, so the screen-reader surface (label, value, increment/decrement) sits on a wrapping `View` with role `adjustable`; the Slider is `importantForAccessibility="no-hide-descendants"`.
- Out of scope, left as is: the visible English texts `NOW PLAYING` and `Loading audio stream...` in `PlayerModal`.

## Plan Change Log

## Review Triage Log

Pass 1 (quick) — high 2, medium 0, low 0, false 0, maybe-false 0.

| Finding | Verdict | Route | Evidence / action |
|---|---|---|---|
| Slider `onAccessibilityAction` never reaches native on Android | high | patch | Verified: slider 5.0.1 re-emits it as `onRNCSliderAccessibilityAction`, absent from `RNCSliderNativeComponent.ts` and the Android sources. Patched: a11y surface moved to an `adjustable` wrapping `View`, Slider `no-hide-descendants`. |
| Slider a11y tests fire on the mocked Slider and hide the bug | high | patch | Same root cause. Patched: tests fire on the wrapper found by role `adjustable`. |

## Design Notes

Gradient stops are `hexToRgba(dominant, a)` drawn over `theme.colors.background`, so the background the text sits on is `a·dominant + (1−a)·base`. The two extremes are the top (0.95) and bottom (0.4) stops; contrast is checked on both. One of black/white always reaches ≥ 4.58:1 against a single opaque colour, which is why the opaque fallback guarantees the AA ratio.

## Verification

**Commands:**
- `cd mobile && npm test` -- expected: all suites pass
- `cd mobile && npm run type-check && npm run lint` -- expected: no errors

**Manual checks (if no CLI):**
- On device with TalkBack (at the end, build from `main`): play, pause, next, open the queue by touch exploration; adjust the slider with volume keys / swipe up-down.

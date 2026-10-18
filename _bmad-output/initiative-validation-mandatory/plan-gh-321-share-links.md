---
title: 'zumik:// share links to a playlist or a profile (#321)'
type: 'feature'
ticket: ''
created: '2026-10-16'
status: 'built'
baseline_revision: '2828f0c593b65b38fd86c39025ac2cd034c3cbc5'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context:
  - '{project-root}/doc/TESTING.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** There is no way to send someone a link that opens a playlist or a profile in the app. The `zumik` scheme is declared, but React Navigation has no `linking` config, and the Android intent filter only accepts the host `auth`. GitHub #321.

**Approach:**
- `zumik://playlist/<id>` opens the playlist detail. `zumik://user/<id>` opens a user's profile.
- The links are handled by a React Navigation `linking` config on the `NavigationContainer`.
- A link opened while signed out is kept: after sign-in, the app navigates to its target.
- A « Partager » button opens the system share sheet, on the playlist detail and on a user's profile.
- The track sheet's « Partager » (#316) keeps the SoundCloud link. A track has no screen of its own to open.
- Access rights do not change: an inaccessible playlist shows the screen's usual message.

## Boundaries & Constraints

**Always:**
- Keep the existing `zumik://auth` intent-filter entry.
- Add hosts `playlist` and `user` to the Android intent filter in `app.config.js`, and mirror them in `app.json` if it also declares one.
- Link ids are validated (UUID); an unknown path is ignored.
- French UI copy.

**Never:**
- No https universal links.
- No new dependency (`expo-linking` is already installed; React Native's `Share` is enough).
- No backend change.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| App closed, signed in | `zumik://playlist/<id>` | the app opens on that playlist detail | — |
| App open, signed in | the URL event | navigates to the target | — |
| Signed out | link, then sign in | after sign-in, lands on the target | — |
| Inaccessible playlist | private, no access | the detail screen's existing error/empty message | no crash |
| Malformed link | `zumik://playlist/abc`, unknown host | ignored, normal start | — |
| Share | playlist detail / user profile « Partager » | system share sheet with `zumik://playlist/<id>` / `zumik://user/<id>` | cancel → nothing |

</frozen-after-approval>

## Code Map

- **`mobile/app.config.js`:** l.5 `scheme: 'zumik'`; l.40-52 the `intentFilters` entry with only `host: 'auth'`. Add data entries for `playlist` and `user`, and keep `auth`. `autoVerify` only matters for https and can stay.
- **`mobile/src/navigation/RootNavigator.tsx`:**
  - l.99: `<NavigationContainer>` around `isAuthenticated ? <AppNavigator /> : <AuthNavigator />`. Give it `linking` and a navigation ref.
  - With conditional navigators, React Navigation applies the initial URL only to the navigator mounted at that moment. So when signed out:
    1. store the URL (initial URL, and `Linking` url events) in a small pending-link holder;
    2. once `isAuthenticated` turns true and the app navigator is ready, navigate to it with `getStateFromPath(path, linking.config)` and the ref, then clear it.
- **Screens:**
  - Tabs: `PlaylistsTab` → `PlaylistsNavigator` → `PlaylistDetail` (`stacks/PlaylistsStack.tsx` l.55).
  - `FriendsTab` → `FriendsNavigator` → `UserProfile` (`stacks/FriendsStack.tsx` l.48).
  - Read the param names from each stack's ParamList; do not assume them.
- **New `mobile/src/navigation/linking.ts`:** the `LinkingOptions` (prefixes `['zumik://']`, nested screens config), plus helpers `playlistLink(id)` / `userLink(id)` to build the shared URLs.
- **Share buttons:**
  - `mobile/src/screens/playlists/PlaylistDetailScreen.tsx` (its header, or `components/playlist/PlaylistHeader.tsx`).
  - The user profile screen (`screens/friends/UserProfileScreen.tsx`).
  - Use `Share.share({ message })` with no success toast: Android does not report a cancel, as found in #316.
- **Inaccessible playlist:** `PlaylistDetailScreen` already handles a fetch error. Check what it shows for a 403/404 and keep it.

## Tasks & Acceptance

**Execution:**
- [x] `mobile/app.config.js` (+ `app.json` if it carries intent filters) -- the hosts `playlist` and `user`
- [x] `mobile/src/navigation/linking.ts` (+ test: `getStateFromPath` for both links, malformed links ignored, link builders)
- [x] `mobile/src/navigation/RootNavigator.tsx` -- `linking`, the ref, and the pending link across sign-in (+ test)
- [x] share buttons on the playlist detail and the user profile (+ tests)

**Acceptance Criteria:**
- Given `adb shell am start -d zumik://playlist/<id>`, with the app closed or open, then the playlist opens.
- Given a link opened while signed out, when I sign in, then I land on the target screen.
- Given a playlist I cannot access, then its usual message shows and nothing crashes.

## Verification

**Commands:**
- `cd mobile && npm test && npm run type-check && npm run lint` -- expected: pass, 0 errors
- `cd mobile && npx expo config --type introspect | grep -A12 intentFilters` -- expected: hosts `auth`, `playlist` and `user`

## Implementation Notes

- Implemented by a subagent.
  - `createLinking(isSignedIn)` keeps a link that arrives while signed out, and `openPendingLink(ref)` opens it after sign-in. The pending link lives in memory only.
  - The tab params are typed with `NavigatorScreenParams`.
  - `ShareLinkButton` lives in `PlaylistHeader` (both stacks) and in `UserProfileScreen`.
- Found during implementation: `PlaylistDetailScreen` had no message for a failed fetch. It spun on "Chargement..." forever, with an unhandled rejection. A message was added (see the triage below).

## Review Triage Log

- Pass 1 (quick): 4 findings, all real and patched.
  - medium: the new "inaccessible" branch read the store's shared `error`, which stays set until the next fetch starts. A previous playlist's error flashed for a moment. Fix: the load error lives in local state, tied to the requested id.
  - medium: every failure (network, 500) said "introuvable ou inaccessible", with no retry. Fix: that message is shown only for 403/404; other failures get « Impossible de charger » and « Réessayer ».
  - medium: no test covered the third acceptance criterion. Fix: a `PlaylistDetailScreen` test for 404 and for 500 + retry.
  - low: `Share.share` got the link in both `message` and `url`, so it appeared twice on iOS. Fix: `{ message, title }` only.

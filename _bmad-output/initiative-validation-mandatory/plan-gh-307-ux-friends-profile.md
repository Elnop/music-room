---
title: 'Irritants UX amis et profils (#307, groupe « Amis et profils »)'
type: 'bugfix'
ticket: 'https://github.com/Elnop/music-room/issues/307'
created: '2026-10-17'
status: 'built'
baseline_revision: 'acded06d107e859305d56d2ba476afd6532f0837'
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

**Problem:** Audit #307, section « Amis et profils »:
1. Amis shows its loading skeleton and the search empty state at the same time on open.
2. Another user's profile draws a lock for a private avatar, while the list shows their initials.
3. Following someone does not make them a friend (friends = mutual follow, `friends.service.ts` l.58), and only the Amis screen says so.
4. Mon Profil's gear opens « Éditer le profil », and `SettingsScreen` is unreachable.
5. Confidentialité loses unsaved changes without warning.
6. Mes appareils shows the technical model name twice.

**Approach:**
1. The search list waits for the friends load to finish.
2. The profile always uses `Avatar`, which falls back to initials.
3. The rule is explained where friends are missing (Mes appareils empty state, friends' playlists section) and on a profile that follows me but that I don't follow back.
4. Two header buttons on Mon Profil, per the user's decision of 2026-10-17: a pencil « Modifier le profil » opens EditProfile, and the gear opens Settings. Settings is cleaned to Thème and Serveur, without the « coming soon » sections.
5. Leaving Confidentialité with unsaved changes asks for confirmation.
6. The model is hidden in the meta line when it equals the device name.

Changing the avatar (#351) and renaming a device (#352) are separate tickets.

## Boundaries & Constraints

**Always:** New UI text in French with the formal register. The friend rule stays mutual follow; only the text explains it. Saving Confidentialité works as today, and a saved screen leaves without a prompt.

**Never:** Avatar upload or device renaming (#351, #352). Backend changes. Translating unrelated English labels (#341), except the Settings screen being cleaned here.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Amis loading | Friends request pending | Skeleton only | No error expected |
| Amis empty | Loaded, 0 friends | Search tab as today | No error expected |
| Private avatar | Profile with `avatarUrl` hidden | Initials, no lock | No error expected |
| Follows me only | They follow me, I don't | Hint: following back makes us friends | No error expected |
| Leave dirty | Privacy changed, back pressed | Dialog: Annuler / Quitter sans enregistrer | No error expected |
| Leave clean or saved | No change, or after Save | Leaves at once | No error expected |
| Same names | `model === deviceName` | Meta shows only « vu … » | No error expected |

</frozen-after-approval>

## Code Map

- `mobile/src/screens/friends/FriendsScreen.tsx` -- skeleton L291–293; search list rendered when `(activeTab === 'search' || !hasFriends)` (L325) also while loading. Add `!isLoading` to the `!hasFriends` branch. The `loadFriends` switch to the search tab (L63–64) stays.
- `mobile/src/screens/friends/UserProfileScreen.tsx` -- `isAvatarHidden` (L128) and the lock branch (L145–148, style `hiddenAvatar` ~L439): remove, always render `<Avatar size="lg" …>`. « Follows you » badge (L182–186): add a hint below it when not following back, e.g. « Suivez-le en retour pour devenir amis ».
- `mobile/src/screens/profile/MyDevicesScreen.tsx` -- empty text L258 → explain mutual follow. Meta line L249–250 `[device.model, lastSeen]`: drop `model` when equal to `device.deviceName`.
- `mobile/src/components/playlist/FriendPlaylistSection.tsx` L47 -- empty text → explain mutual follow.
- `mobile/src/screens/profile/ProfileScreen.tsx` L54–62 -- `headerRight` with one gear → two buttons: `create-outline` (`accessibilityLabel` « Modifier le profil ») → EditProfile, `settings-outline` (« Réglages ») → Settings. Route `Settings` exists in `ProfileStack.tsx` (L18/27/82–84).
- `mobile/src/screens/settings/SettingsScreen.tsx` -- keep Thème (`ThemeSelector`) and Serveur (`BackendUrlField`); remove Account and Notifications; French titles.
- `mobile/src/screens/profile/PrivacySettingsScreen.tsx` -- `hasChanges` (L62–70), `handleSave` (L72–94) then `goBack`. Add `usePreventRemove(hasChanges && !isSaving, …)` from `@react-navigation/native` with `Alert.alert` (pattern: `ProfileScreen` logout). Make sure the post-save `goBack` is not blocked (state updated before leaving).

## Tasks & Acceptance

**Execution:**
- [x] `FriendsScreen.tsx` -- loading gate; test the « Amis loading » row.
- [x] `UserProfileScreen.tsx` -- `Avatar` always; follow-back hint; tests.
- [x] `MyDevicesScreen.tsx`, `FriendPlaylistSection.tsx` -- texts and meta line; update their tests.
- [x] `ProfileScreen.tsx`, `SettingsScreen.tsx` -- two header buttons; Settings cleaned; test the buttons' navigation.
- [x] `PrivacySettingsScreen.tsx` -- leave guard; test dirty, clean and saved exits.

**Acceptance Criteria:**
- Given Mon Profil, when the pencil is pressed, then « Éditer le profil » opens; when the gear is pressed, then Réglages opens with Thème and Serveur only.

## Verification

**Commands:**
- `cd mobile && npm test && npm run type-check && npm run lint` -- expected: all pass.

**Manual checks (if no CLI):**
- At the `main` acceptance pass: open Amis, a private-avatar profile, a profile that follows me, Mes appareils, both header buttons, leave Confidentialité dirty.

## Implementation Notes

- `FriendsScreen`: one `showSearch` flag gates both the search bar and the search list, so the search bar also waits for the load.
- `MyDevicesScreen`: the model/name comparison ignores case and surrounding spaces.
- `PrivacySettingsScreen`: a `savedRef` set on a successful save lets the guard pass the post-save `goBack` through even if it has not re-rendered yet.
- Réglages: header title `Settings` → `Réglages` in `ProfileStack.tsx`. Mon Profil keeps its own Theme section (out of scope).
- New tests: `FriendsScreen.test.tsx`, `PrivacySettingsScreen.test.tsx`; extended `UserProfileScreen`, `MyDevicesScreen`, `ProfileScreen` tests.

## Plan Change Log

## Review Triage Log

Quick review, pass 1: 2 findings, medium 1, low 1, both patched by the implementer, then full verification green (781 tests, type-check, lint).

- medium, patched: the leave guard was off while the save request ran (`hasChanges && !isSaving`), so back during a save that then failed lost the changes silently. The guard now prevents on `hasChanges`; only the post-save `goBack` passes, through `savedRef` set after success. Test added: back during a failing save still asks.
- low, patched: the « saved » test mocked `goBack` outside the guard and could not catch a blocked exit. The stand-in now routes `goBack` through the guard; removing `savedRef` makes it fail.

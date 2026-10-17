---
title: 'Irritants UX transverses (#307, groupe « Partout »)'
type: 'bugfix'
ticket: 'https://github.com/Elnop/music-room/issues/307'
created: '2026-10-17'
status: 'built'
baseline_revision: '3852158b2c253c50d7c2b46888650fccf54a09a4'
route: 'oneshot'
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

**Problem:** Audit #307, section « Partout ». (1) The status bar icons are dark on the app's black background (`App.tsx` forces `<StatusBar style="dark" />`). (2) The tab bar shows icons only, and the screen reader reads font glyphs since no tab has an accessibility label. (3) A white screen shows at startup and after a reload: the Android window follows the system's light mode because `userInterfaceStyle: 'dark'` needs `expo-system-ui` on Android, and `NavigationContainer` uses react-navigation's light default theme. (4) Logout on « Mon Profil » acts on the first tap, without confirmation.

**Approach:** Light status bar. Visible French tab labels (Playlists, Recherche, Amis, Profil) with matching accessibility labels, the active pill shrunk to fit the label. Install `expo-system-ui` and set the root `backgroundColor` to the theme background, and give `NavigationContainer` a dark theme built from the app theme. A native confirmation dialog (`Alert.alert`, « Se déconnecter ? », Annuler / Se déconnecter) before logout. French text, formal register, per #341.

</frozen-after-approval>

## Implementation Notes

Oneshot: about 60 lines over App.tsx, app.config.js, RootNavigator, AppNavigator and ProfileScreen, plus tests. The native background needs a rebuild; it goes into the acceptance check on `main`.

The audit wrongly said the app had one theme: `ThemeSelector` (Mon Profil) offers four, three of them light (royalBlue, christmas, pastelLime). The fixes therefore follow the active theme instead of assuming dark. `ThemedSystemUI` (new, in `App.tsx`) picks the status bar style from the background luminance (`isDarkBackground`, beside `textColorOn` in `ConnectionBanner.tsx`) and calls `SystemUI.setBackgroundColorAsync`. `RootNavigator` builds its navigation theme from `DarkTheme` or `DefaultTheme` the same way. `app.config.js` `backgroundColor` (the original theme's) only covers the time before JS starts. `expo-system-ui` installed with `npm install` (`expo install` had rewritten package.json and the lockfile with spaces). The « Logout » button became « Se déconnecter » so it matches its dialog. `RootNavigator.test.tsx` now mocks `ThemeContext`. `ProfileScreen.test.tsx` is new.

The debug build compiled, but the emulator's system_server stopped responding after install (host short on memory), so the visual check moves to the acceptance pass on `main`.

## Review Triage Log

Quick review by a context-free subagent: 5 findings, all patched.

- medium, patched: the status bar was hard-coded light, unreadable on the three light themes. It now follows the active theme (`ThemedSystemUI`).
- medium, patched: the navigation theme always used `DarkTheme`. It now uses `DarkTheme` or `DefaultTheme` from the background, and `notification` takes the theme's primary color.
- low, patched: the native window background was fixed at the original theme. `ThemedSystemUI` sets it from the active theme at runtime. A user on a light theme still sees the dark config color during the cold start until JS loads; that is accepted, since the theme is only known once it is read from AsyncStorage.
- low, patched: the button still read « Logout » under a French dialog. It now reads « Se déconnecter ».
- low, patched: the test did not check the button styles. It now checks `cancel` and `destructive`.

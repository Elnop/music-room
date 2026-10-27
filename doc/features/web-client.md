# Web client (responsive)

Bonus V.1 (Multi-platform support): the service is also available in a browser, as a responsive web app that adapts to phone, tablet and desktop. Epic #474, stories #518 to #524.

Code: the same `mobile/` app, built for the web by Expo (`react-native-web`). Every `*.web.ts` file in `mobile/src/`, `shared/hooks/useBreakpoint.ts`, `shared/constants/layout.ts` and `platform.ts`, `shared/components/layout/`, `navigation/screenLayout.tsx`; backend `GET /api/events/geocode` ([events.md](events.md)). The choice of Expo web over a separate client is in [decisions.md](../decisions.md#3-bonus-v1-web-client-epic-474).

## Approach

The browser runs the Android app's code: the same screens, Zustand stores, TanStack Query cache, Socket.io client and API client (`shared/services/api.ts`, so the IV.6 headers are sent: `X-Platform: web`, and `X-Device-Model` read from the user agent, e.g. `Chrome on Linux`). It stays a remote control of the backend (IV.5), and the guardrails of `npm run check` cover it with no second project.

Each native module was already isolated in one service or hook. That file gets a `.web.ts` variant next to it, which Metro picks for the web bundle; nothing imports a variant by name (knip treats `src/**/*.web.{ts,tsx}` as entry points). No native library reaches the web bundle, and hls.js reaches only the web one; the Google and Facebook SDKs are scripts loaded at run time.

| Variant (`mobile/src/…`) | Replaces on the web |
| --- | --- |
| `shared/services/deviceIdentity.web.ts` | `expo-device` (empty on the web): model and name from the user agent (`Chrome on Linux`, `Chrome sur Linux` in the device list) |
| `shared/hooks/useImageColors.web.ts` | `react-native-image-colors`: no extraction, the theme's fallback colour |
| `shared/utils/alert.web.ts` | `Alert.alert` (a no-op in react-native-web): the alert is queued in `shared/stores/alertStore.ts` and `AlertHost` shows it as a centred dialog with every button |
| `shared/utils/jpegFormData.web.ts` | The React Native `{ uri }` upload object: the picked image is read into a `Blob` (avatar, playlist cover) |
| `features/auth/services/googleSignIn.web.ts` | Native Google Sign-In: Google Identity Services, Google's rendered button in popup mode |
| `features/auth/services/facebookSignIn.web.ts` | Facebook Android SDK: Facebook JavaScript SDK, `FB.login` |
| `features/auth/hooks/useProviderButtons.web.ts` | Loads the two SDK scripts on the sign-in, sign-up and linked-accounts screens only, and mounts Google's button |
| `features/player/services/audioPlayer.web.ts` | `expo-audio`: one `<audio>` element for the page, fed natively or by hls.js |
| `features/player/services/audioMode.web.ts` | The audio session setup: a tab has none (no-op) |
| `features/player/services/jsKeepAlive.web.ts` | The Android headless task that keeps JavaScript running in the background: a tab keeps its timers (no-op) |
| `features/player/mediaSession/hooks/useMediaSession.web.ts` | `expo-media-control`: the browser's Media Session API |
| `features/events/utils/geocoder.web.ts` | `expo-location` `geocodeAsync`, missing on the web: the backend route `GET /api/events/geocode` |
| `features/events/utils/pickDateTime.web.ts` | The Android date and time pickers: a modal `<dialog>` with a `datetime-local` field |
| `features/events/services/beaconScanner.web.ts` | The BLE scan: always reports « unsupported » |

`shared/constants/platform.ts` hides what the browser cannot do: the beacon broadcast (`BEACON_BROADCAST_AVAILABLE`). The backend address field (`BackendUrlField`) works in the browser too, on Welcome and in Settings: the address is kept in the browser's storage, and the chosen backend must list the page's origin in its `ALLOWED_ORIGINS`.

## Responsive layout

`useBreakpoint()` (`shared/hooks/useBreakpoint.ts`, from `useWindowDimensions`, so it follows a window resize live) gives three levels, set in `shared/constants/layout.ts`:

| Level | Window width | Layout |
| --- | --- | --- |
| Phone | < 768 px | The Android layout, unchanged: bottom tab bar, mini-player above it, bottom sheets |
| Tablet | 768–1023 px | Left icon rail (96 px, labels under the icons) |
| Desktop | ≥ 1024 px | Left side bar with icons and labels (232 px) |

Every adaptation keys on `isWide` (tablet or desktop), so a phone, and Android, keep the phone layout. Above the phone level:

- **Navigation**: the tabs move to the left (`tabBarPosition: 'left'`, `AppTabBar`); the mini-player leaves the tab bar and is docked in a fixed bar at the bottom of the window (`AppNavigator`).
- **Width**: each screen is centred at a maximum width chosen per route in `navigation/screenLayout.tsx` (`ContentContainer`: form 600 px, content 960 px, wide 1280 px).
- **Grids**: playlist tiles get their column count from the content width (`shared/utils/gridLayout.ts`); friends and events go to 2 columns on tablet and 3 on desktop (`RowGrid`).
- **Dialogs**: the action sheet, the queue and the device picker become centred dialogs (`CenteredDialog`, `FullScreenSheet`), capped at 560 px.
- **Player**: on desktop the full player is a 440 px panel docked on the right over a backdrop.
- **Mouse and keyboard**: a `Pressable` lightens under the pointer and shows the hand cursor; Escape closes every modal; Enter submits the sign-in, sign-up, playlist, event, profile and password forms (`Input submitOnEnter`, browser only).
- **URL**: on the web every screen has its own path (`navigation/screenPaths.ts`: `/playlists`, `/playlist/<id>/add-tracks`, `/event/<id>`, `/profile/devices`, `/login`…), and only identifiers go in it. The root `/` is the home in both sessions (the landing signed out, `/welcome` being an alias), and `/privacy` the privacy policy in both (not `/profile/privacy`, the profile visibility settings): such a path has one entry per session. Reloading reopens the screen in its canonical tab above its parent screens, after sign-in for an app screen; a signed-out path opened signed in, or an unknown path, opens the home. `/verify-email` and `/reset-password` keep the email out of the address and reload on the screen before them. Android still opens only `zumik://playlist/<id>` and `zumik://user/<id>`.

## Audio

The browser is a full player and a device like a phone: it registers at its socket connection, appears in **Mes appareils** and in the device picker, reports what it plays with `listening:update`, and obeys `control:command`.

- **HLS**: the backend returns the SoundCloud HLS stream when there is one, else the progressive one (`backend/src/features/soundcloud/services/soundcloud-stream.service.ts`). `streamSource.ts` lets the `<audio>` element play it itself when the browser reads HLS (`canPlayType('application/vnd.apple.mpegurl')`, Safari); elsewhere `hls.js` feeds the element, transport only. A fatal hls.js or element error reports `failed`, and the shared `useStreamWatchdog` renews the URL, as on Android. The queue, auto-advance, next-track prefetch and the 30-minute URL renewal are the shared hooks.
- **Progressive-only tracks**: outside Safari, every URL goes to hls.js, which reads HLS playlists only; a track SoundCloud offers only as progressive is therefore expected to fail there (not yet checked in a browser).
- **Media Session**: `useMediaSession.web.ts` sends the title, artist, artwork, state and position to `navigator.mediaSession`, so the keyboard's media keys and the browser's media notification work; play, pause, next, previous and seek follow the native hook's rules (no seek on a remote device, no next at the end of the queue).
- **Autoplay**: a browser refuses to play before the user interacts with the page. When `play()` is rejected (`NotAllowedError`), the player store goes back to paused, so the controller never sees « playing », and the app shows « Cliquer pour activer le son » (`hooks/useAutoplayPrompt.ts`). « Activer le son » calls `play()` inside the click, as Safari requires. It happens typically when a friend's remote command reaches a tab nobody has clicked yet.

## Delegation from and to the browser

Nothing is specific to the web: the browser is one more device ([control-delegation.md](control-delegation.md), [queue-and-connect.md](queue-and-connect.md)).

- **From the browser**: the device picker lists the user's phone and the friends' devices they hold a license on; choosing one moves playback there (`POST /api/queue/transfer`) and the browser becomes a remote control.
- **To the browser**: the owner grants a friend a license on the browser device in **Profil › Mes appareils** (it is named after the browser and the system, and can be renamed); the friend's phone then sees it and can play, pause or move playback to it. A command before any click in the tab shows the autoplay prompt.

## Google and Facebook sign-in

Google Identity Services and the Facebook JavaScript SDK, with the same client ID and app ID as the native app, so the backend receives the same tokens on the same endpoints and does not change. The two scripts load only on the screens that offer them. Details and the one-time console setup per origin (Google *Authorized JavaScript origins*, Facebook *App domains* and *Allowed Domains for the JavaScript SDK*): [accounts-auth.md](accounts-auth.md#google-and-facebook-in-the-browser).

## Events (bonus V.2) on the web

- **Position**: the browser's geolocation (through `expo-location`), for « Événements à proximité » and « Utiliser ma position actuelle ». A refusal in the browser is final (it does not ask again): the section points to the site settings, and the rest of the home works. A position search with no answer stops after 15 s (« Réessayer »).
- **Address**: `geocodeAsync` does not exist on the web, so a typed address is geocoded by the backend, `GET /api/events/geocode?q=` (OpenStreetMap Nominatim): answers cached 7 days in Redis, one Nominatim request per second for the whole backend, 60 per hour per user ([events.md](events.md)). Only the typed address leaves the browser; the distance is computed on the client.
- **No reverse geocoding**: it would send the position to the server, so « Utiliser ma position actuelle » fills the coordinates as the address.
- **No iBeacon**: a browser can neither advertise nor scan Bluetooth LE. The organiser's page shows « Disponible depuis l'app Android » in place of « Diffuser la balise », and detection on the web is GPS only.

## Not available on the web

| Missing | Why | Instead |
| --- | --- | --- |
| iBeacon broadcast and scan | No Bluetooth LE advertising or scanning in a browser | GPS detection; the broadcast stays on Android |
| Colours extracted from artwork | `react-native-image-colors` is native only, and reading a cross-origin image's pixels needs CORS from the image host | The theme's fallback colour |
| Reverse geocoding | The position would leave the device | The coordinates as the address |
| Backend address field | The web app is built for one backend | Set `EXPO_PUBLIC_API_URL` at build time |
| Progressive-only tracks outside Safari | hls.js reads HLS only (see [Audio](#audio)) | Safari plays them natively |
| Background playback guarantees | A tab has no headless task; the browser may throttle a background tab | Playback in a visible or audible tab |

Session tokens are kept in `localStorage` on the web (AsyncStorage's web backend); the exposure is in [threat-model.md](../security/threat-model.md#m14-web-session-tokens-and-third-party-scripts).

## Running and building

- `make dev-web`: backend in Docker, then Expo web on `http://localhost:8081`. `make dev-web-local`: the same without Docker. Both point the app at `http://localhost:3000`; `http://localhost:8081` is already in `ALLOWED_ORIGINS` of `backend/.env.example`, and it is the only web port the backend's CORS accepts in dev. Then open `http://localhost:8081` in Chrome or Firefox.
- Responsive: resize the browser window across 768 px and 1024 px (or the browser's device toolbar); the layout changes without a reload.
- Build: `cd mobile && npx expo export -p web --clear` writes the static site to `mobile/dist/`. `--clear` matters when several checkouts share the Metro cache. The backend address comes from `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WS_URL` at build time.
- Hosting (#523, root since #558): GitHub Pages at `https://elnop.github.io/music-room/`, built by `.github/workflows/pages.yml` on every push to `main` (with `WEB_BASE_URL=/music-room`, read by `app.config.js`) and deployed with `site/` at the same root; `site/404.html` sends a direct link back to the app, and an old `/music-room/app/...` link to the same path without `/app`. The signed-out home (the landing) is `/`, the privacy policy `/privacy` in both sessions. `site/privacy.html` keeps the full English policy for the Google OAuth consent screen and the Play Store, and sends a browser running JavaScript to `/privacy`; the export's `index.html` comes from the template `mobile/public/index.html`, whose `<noscript>` holds a description of the app and a link to `privacy.html` for robots that do not run JavaScript. The app calls the hosted backend `https://zumik.cluzhub.com`, whose `ALLOWED_ORIGINS` includes `https://elnop.github.io`.

## Demo scenario

For the defence. A desktop browser (Chrome) and the Android phone (debug or release build), both on the same backend: locally with `make dev-web` and the phone on the same machine's backend, or the GitHub Pages app and the release APK. Accounts from the local seed ([demo-accounts.md](../development/demo-accounts.md)): Bob (`bob@zumik.dev`) in the browser, Patrick (`patrick@zumik.dev`) on the phone, friends, with « Jellyfishing Jams » owned by Bob and Patrick as collaborator.

1. **Same playlist in real time**: in the browser, sign in as Bob and open « Jellyfishing Jams »; on the phone, Patrick opens it too. Patrick adds a track: it appears in the browser without a reload. Bob drags a track to another place with the mouse: the phone shows the new order.
2. **Resize**: with the window wide (≥ 1024 px), show the side bar, the centred content and the playlist grid on **Accueil**; narrow it to about 900 px (icon rail), then under 768 px: the bottom tab bar and the phone layout come back, live. Open the player: a right panel on desktop, full screen on the narrow window.
3. **Licenses**: on the phone, Patrick goes to **Profil › Mes appareils** and turns on Bob's switch under the phone. In the browser, Bob does the same for Patrick under « Chrome sur … » (the browser device).
4. **Browser → phone**: in the browser, Bob plays a track, opens the device picker from the player and chooses Patrick's phone under « Appareils de mes amis »: the phone starts the track at the same position, the browser pauses and becomes the remote control (pause and play from the browser drive the phone).
5. **Phone → browser**: on the phone, Patrick opens the device picker and chooses Bob's browser. If nobody has clicked in the tab since it loaded, the browser shows « Cliquer pour activer le son » and the phone does not show it playing; click « Activer le son »: it plays, and the phone shows it playing. Pause from the phone; the browser pauses. Show the keyboard's media keys or the browser's media notification.
6. **Google on the web**: sign out of the browser (**Profil**, « Se déconnecter »), then sign in with Google's button on the sign-in screen; the account is the same one as with Google on the phone. This needs the origin declared in the Google console ([accounts-auth.md](accounts-auth.md#console-setup-by-hand-once-per-origin)).

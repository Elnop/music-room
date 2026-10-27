# Accounts and authentication

Subject IV.1: a user signs up with an email and a password or with a social network, verifies their email, can reset a forgotten password, links Google or Facebook to their account, and has a profile with public, friends-only and private information.

Code: `backend/src/features/auth/`, `backend/src/features/profile/`; mobile `src/features/auth/`, `src/features/profile/`. Security analysis of every flow below: [threat-model.md](../security/threat-model.md) (M1 to M6).

## Sign-up and sign-in

- **Email and password**: `POST /api/auth/register` creates the account and mails a 6-digit code; `POST /api/auth/verify-email` checks it and returns the first session. Login (`POST /api/auth/login`) is refused until the email is verified. `POST /api/auth/resend-verification` sends a new code, only to the account's own email (#188).
- **Google and Facebook**: the app runs the native sign-in (Google Sign-In, Facebook SDK; in the browser, their JavaScript SDKs, see [below](#google-and-facebook-in-the-browser)) and sends the provider token to `POST /api/auth/google` or `/facebook`. The backend verifies the token itself and creates or finds the account through Supabase's admin API (`oauth.service.ts`); it does not use Supabase's OAuth flow.
- **Sessions**: the backend issues Supabase Auth tokens. The app keeps them in `authStore`, persisted in AsyncStorage, and refreshes them through `POST /api/auth/refresh`. A refresh refused by Supabase (401) ends the session; Supabase being unreachable (503) keeps it, so an outage does not sign anyone out (#126).
- **Logout** revokes the session server-side: the access token goes to a Redis revocation list until it expires and the refresh token is invalidated (`POST /api/auth/logout`). The app always clears its session locally and closes its socket, even if the call fails (#70).
- **The app holds no Supabase client** (#376): every auth call goes through the backend, which logs it with the device headers (subject IV.6).
- Sign-ins run on a throwaway Supabase client created for the call, so the shared admin client keeps its service role (#136).

## Forgotten password

`POST /api/auth/forgot-password` mails a 6-digit code (always the same answer, whether the email exists or not, #187); `POST /api/auth/reset-password` sets the new password. A reset ends every open session of the account (#203). A Google- or Facebook-only account may reset too: it then gains email and password sign-in (decision of 2026-10-10, #189). Accounts are looked up by email case-insensitively, past Supabase's first page of users (#194).

## Linked accounts

A signed-in user links Google or Facebook from the "Linked accounts" screen (`features/profile/linkedAccounts/`), even when the social account's email differs from theirs:

- `POST /api/auth/providers/:provider/link` with the provider token stores `google_id` or `facebook_id` on the current user; an id already linked to another account is refused.
- `GET /api/auth/providers` lists the sign-in methods; `DELETE /api/auth/providers/:provider` unlinks one. Unlinking the last method is refused.
- `has_password` records whether email and password sign-in exists; it was backfilled to false for Google/Facebook sign-ups made before it existed (migration 019, #196).

## Google and Facebook in the browser

The web app (epic #474) signs in, signs up and links accounts with the same endpoints and the same tokens as the native app (#520); the backend sees no difference. The two SDKs are third-party scripts, loaded only by the screens that offer them (sign-in, sign-up, linked accounts) through `useProviderButtons.web.ts` and `features/auth/utils/loadScript.ts`.

- **Google**: Google Identity Services (`googleSignIn.web.ts`) with the client `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, the one the native app already uses, so the ID token has the audience the backend checks (`GOOGLE_CLIENT_ID`). The screen shows Google's own rendered button in place of the app's, in popup mode: it is the GIS entry point that returns an ID token every time. One Tap (`google.accounts.id.prompt`, FedCM in Chrome) is not used: once dismissed, the browser holds it back for hours, and it shows nothing in a browser signed out of Google. The button's callback stores the credential and starts the usual sign-in or link, whose `signInWithGoogle()` hands that credential over once. Closing Google's popup calls nothing back, so no error shows. If the script cannot load (content blocker, offline) or the client ID is missing, the app's own button comes back, and pressing it shows the reason.
- **Facebook**: the JavaScript SDK (`facebookSignIn.web.ts`): `FB.init` with `EXPO_PUBLIC_FACEBOOK_APP_ID` and the Graph API version the backend calls, then `FB.login` for `public_profile,email`, which returns the access token. The SDK is preloaded when the screen mounts: `FB.login` opens a popup, which the browser blocks unless it opens right after the click. A closed popup or declined permissions reject with `SIGN_IN_CANCELLED`, as on Android, so no error shows. Facebook accepts a JavaScript SDK login only over HTTPS, `localhost` excepted.

### Console setup (by hand, once per origin)

No new environment variable, in the backend or the app. Each origin the web app is served from (`http://localhost:8081` in development, `https://elnop.github.io` on GitHub Pages) is declared in the Google console; Meta takes the GitHub Pages domain only:

1. **Google Cloud console**, APIs & Services → Credentials → the OAuth 2.0 client of type *Web application* whose ID is `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` → *Authorized JavaScript origins*: add `http://localhost`, `http://localhost:8081` and `https://elnop.github.io` (origins only: no path, no trailing slash; Google asks for both `localhost` entries when testing on a port). No redirect URI: the popup mode needs none. The change can take a few minutes to apply.
2. **Meta for Developers**, app `EXPO_PUBLIC_FACEBOOK_APP_ID`:
   - Settings → Basic → *App domains*: `elnop.github.io`; *Add platform* → *Website*, *Site URL* `https://elnop.github.io/`.
   - Facebook Login → Settings: *Login with the JavaScript SDK* on; *Allowed Domains for the JavaScript SDK*: `https://elnop.github.io/`.
   - `localhost` is not declared: the console refuses a domain without a top-level domain ("must contain a top-level domain"). While the app is in development mode, Meta allows `localhost` without it; if a local sign-in still fails on the domain, test Facebook on the GitHub Pages build instead.
   - While the app is in development mode, only its administrators, developers and testers can log in.

## Profile and privacy

- `GET/PATCH /api/profile`: display name, bio, avatar (`PUT /api/profile/avatar`, a 512×512 JPEG stored in Supabase Storage, #351).
- **Privacy per field** (`profile_privacy`): email, bio, avatar and music preferences are each `public`, `friends_only` or `private`. `GET /api/profile/:userId` returns another user's profile filtered by these settings and by friendship (`getFilteredProfile`).
- **Music preferences**: up to 5 genres (`/api/profile/music-preferences`).
- **Friends** are mutual follows (`/api/friends`). Profile search escapes its query, so it always matches literally (#236).

## Similar tastes

**Accueil** suggests profiles with similar music tastes, so a user meets people to build playlists with beyond their friends (#591). `GET /api/profile/recommendations?limit=` calls the SQL function `recommend_similar_profiles` (migration 033):

- **Candidates**: the other users who share at least one genre with the caller, are not followed by the caller yet, and whose music preferences are **public**. A friends-only or private choice is never used, since a suggestion would reveal it; a profile without a privacy row counts as public, as everywhere else.
- **Order**: Jaccard similarity of the two genre sets (shared genres over all the genres of both), then the number of shared genres.
- **Response**: `hasPreferences` (false when the caller chose no genre, with an empty list) and `profiles` (`id`, `username`, `displayName`, `avatarUrl` under the avatar's privacy, `commonGenres`, `score`).

In the app, the section « Profils aux goûts proches » (`features/friends/similarProfiles/`) is a carousel of cards (photo, name, shared genres); a card opens the profile in the Friends tab, where the user can follow it. Following someone, from anywhere, refreshes the suggestions without them. Without genres, the section leads to **Préférences musicales**. Like the events section, it comes from another feature, so `navigation/screens/HomeScreen.tsx` passes it to the playlists' home.

## Anti-abuse

Login, sign-up, OAuth and every auth route are rate-limited in Redis, with account lockout and an IP blacklist; verification and reset codes have attempt limits; invalid tokens are counted per IP (#160). Thresholds and accepted risks: [threat-model.md](../security/threat-model.md#m1-password-bruteforce). Without Redis these limiters fail closed (503).

## Tests

Integration tests on the local Supabase stack cover the whole chain (register → verify → login → forgot → reset → login), the takeover and enumeration fixes, linking, revocation and lockout (`backend/src/features/auth/**/*.int.test.ts`); `authStore` is tested on mobile. The list with each test name is in the threat model.

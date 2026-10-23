# Accounts and authentication

Subject IV.1: a user signs up with an email and a password or with a social network, verifies their email, can reset a forgotten password, links Google or Facebook to their account, and has a profile with public, friends-only and private information.

Code: `backend/src/features/auth/`, `backend/src/features/profile/`; mobile `src/features/auth/`, `src/features/profile/`. Security analysis of every flow below: [threat-model.md](../security/threat-model.md) (M1 to M6).

## Sign-up and sign-in

- **Email and password**: `POST /api/auth/register` creates the account and mails a 6-digit code; `POST /api/auth/verify-email` checks it and returns the first session. Login (`POST /api/auth/login`) is refused until the email is verified. `POST /api/auth/resend-verification` sends a new code, only to the account's own email (#188).
- **Google and Facebook**: the app runs the native sign-in (Google Sign-In, Facebook SDK) and sends the provider token to `POST /api/auth/google` or `/facebook`. The backend verifies the token itself and creates or finds the account through Supabase's admin API (`oauth.service.ts`); it does not use Supabase's OAuth flow.
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

## Profile and privacy

- `GET/PATCH /api/profile`: display name, bio, avatar (`PUT /api/profile/avatar`, a 512×512 JPEG stored in Supabase Storage, #351).
- **Privacy per field** (`profile_privacy`): email, bio, avatar and music preferences are each `public`, `friends_only` or `private`. `GET /api/profile/:userId` returns another user's profile filtered by these settings and by friendship (`getFilteredProfile`).
- **Music preferences**: up to 5 genres (`/api/profile/music-preferences`).
- **Friends** are mutual follows (`/api/friends`). Profile search escapes its query, so it always matches literally (#236).

## Anti-abuse

Login, sign-up, OAuth and every auth route are rate-limited in Redis, with account lockout and an IP blacklist; verification and reset codes have attempt limits; invalid tokens are counted per IP (#160). Thresholds and accepted risks: [threat-model.md](../security/threat-model.md#m1-password-bruteforce). Without Redis these limiters fail closed (503).

## Tests

Integration tests on the local Supabase stack cover the whole chain (register → verify → login → forgot → reset → login), the takeover and enumeration fixes, linking, revocation and lockout (`backend/src/features/auth/**/*.int.test.ts`); `authStore` is tested on mobile. The list with each test name is in the threat model.

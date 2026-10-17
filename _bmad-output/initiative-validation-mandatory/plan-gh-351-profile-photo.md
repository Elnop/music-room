---
title: 'Changer sa photo de profil (#351)'
type: 'feature'
ticket: 'https://github.com/Elnop/music-room/issues/351'
created: '2026-10-17'
status: 'built'
baseline_revision: '1cb7991f0cbca7a551860b55fba2ffdeb7372fde'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #351. No screen lets a user change their profile photo. The backend only accepts an `avatarUrl` string (`PATCH /profile`), there is no upload, and the app has no image picker.

**Approach:** From « Éditer le profil », the user picks a photo (gallery or camera). The app crops it square and resizes it to 512×512 JPEG (`expo-image-picker`, `expo-image-manipulator`), then sends it as multipart to a new `PUT /api/profile/avatar`.

The backend, per the user's decision of 2026-10-17:
- **checks** the size (≤ 2 MB) and the real type from the file's magic bytes (JPEG, PNG, WebP);
- **stores** it in a public Supabase Storage bucket `avatars` under a random name, created by a migration;
- **cleans up**: sets `avatar_url` and deletes the previous file it owned.

`DELETE /api/profile/avatar` removes the photo and the user is back to initials. The new avatar shows everywhere at once on the user's own device. The existing avatar privacy rules keep deciding who gets the URL.

## Boundaries & Constraints

**Always:**
- **Auth:** both routes are protected by `authMiddleware` and rate-limited (Redis limiter, e.g. 10 uploads per hour per user).
- **Validation:** the backend never trusts the client's MIME type and checks magic bytes. Zod validates the other inputs. No `any`.
- **Docs and tests:** OpenAPI entries and tests for both routes.
- **Migration:** created with `make migrate-create`. The PR says it is applied by hand on the hosted project.
- **Dependencies:**
  - backend: `multer` (memory storage, size limit), with its lockfile;
  - mobile: `expo-image-picker` and `expo-image-manipulator` via `npx expo install` (then restore tab indentation if it rewrites `package.json`), with the image-picker config plugin and French permission texts in `app.config.js`.

  These are native modules, so a rebuild is needed.
- **Client calls:** they go through `services/api.ts`, extended for a `FormData` body (no JSON `Content-Type`; same client headers, auth and refresh).
- **Text:** French UI text, formal register.

**Never:**
- Making the avatar privacy rules weaker.
- Storing images in Postgres.
- Uploading from the app straight to Supabase.
- Keeping orphaned files we own when the photo is replaced or removed.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Upload | 512² JPEG | 200 `{ avatarUrl }` in the bucket; old file deleted; avatar updated in the app | No error expected |
| Too big | 3 MB file | 413 or 400 with a code; nothing stored | French toast |
| Not an image | text file renamed `.jpg` | 400 `INVALID_IMAGE` | French toast |
| Remove | `DELETE` | 204/200, `avatar_url` null, file deleted; initials shown | No error expected |
| External avatar | `avatar_url` from Google, replaced | Not deleted (not ours); new one stored | No error expected |
| Picker cancelled | User backs out | Nothing sent | No error expected |
| Permission denied | Camera or gallery refused | French message, nothing sent | No error expected |
| Rate limit | 11th upload in the hour | 429 | French toast |

</frozen-after-approval>

## Code Map

- `backend/migrations/` (last: `026_device_custom_name.sql`). New `027_avatars_bucket.sql`: `insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('avatars','avatars', true, 2097152, '{image/jpeg,image/png,image/webp}') on conflict (id) do nothing`. The local stack has storage enabled (`backend/supabase/config.toml` `[storage]`).
- `backend/src/features/profile/`:
  - routes: `profile.routes.ts`, `router.use(authMiddleware)` at l.11, existing PATCH at l.22. Add `PUT /avatar` (multer `single('avatar')`) and `DELETE /avatar` before `/:userId` (l.98).
  - controller: new handlers.
  - service: new `services/avatar.service.ts`, under ~150 lines. It checks magic bytes, uploads with `supabaseAdmin.storage.from('avatars')` at path `<userId>/<uuid>.<ext>`, gets the public URL, updates `user_profiles.avatar_url`, and deletes the previous object only when the old URL points into our bucket.
  - OpenAPI: `profile.openapi.ts`.
  - tests: unit tests for magic bytes and ownership of the old URL; integration tests against the local stack.
- `backend/src/features/auth/middleware/rate-limit.middleware.ts` -- limiters are `rateLimit({...})` exports (l.78 `loginRateLimiter`…). Add `avatarUploadRateLimiter` keyed by user.
- `backend/src/server.ts` l.51 `express.json()` (100 KB) does not parse multipart, so multer handles the body. Map multer's `LIMIT_FILE_SIZE` to an `AppError` (413, `FILE_TOO_LARGE`).
- `mobile/src/services/api.ts` l.~108 `apiRequest` always sets `Content-Type: application/json`. Skip it when `options.body instanceof FormData`.
- `mobile/src/services/` -- profile API module (where `PATCH /api/profile` is called): add `uploadAvatar(uri)` (FormData `{ uri, name: 'avatar.jpg', type: 'image/jpeg' }`) and `removeAvatar()`.
- `mobile/src/store/authStore.ts` (`user`, `updateProfile` l.44) -- update `user.avatarUrl` after upload or remove so every `Avatar` re-renders.
- `mobile/src/screens/profile/EditProfileScreen.tsx` -- add a photo block at the top: `Avatar` (lg) plus « Changer la photo » opening an action choice (Galerie / Appareil photo / Retirer la photo when set / Annuler; `Alert.alert` is fine on Android). Picker: `allowsEditing`, `aspect [1,1]`. Then `manipulateAsync` resize 512 JPEG 0.8, upload with a spinner over the avatar. Errors go through `apiErrorMessage`; add `INVALID_IMAGE`, `FILE_TOO_LARGE` and 429 to `CODE_MESSAGES` if missing. Mock both expo modules in tests.
- `mobile/app.config.js` `plugins` -- `['expo-image-picker', { photosPermission: '…', cameraPermission: '…' }]` in French.

## Tasks & Acceptance

**Execution:**
- [x] Migration; backend deps; avatar service, controller, routes, limiter, OpenAPI; unit and integration tests.
- [x] Mobile deps and config plugin; `api.ts` FormData; profile API; store; EditProfile UI; tests.

**Acceptance Criteria:**
- Given a new photo, when I go back to Mon Profil, the friends list or a playlist I own, then my new avatar shows there without a restart.
- Given my avatar is « friends only », when a non-friend views my profile, then they still see initials.

## Verification

**Commands:**
- `cd backend && npm test && npm run type-check && npm run lint && make test-int` (or the integration tests touched) -- expected: pass.
- `cd mobile && npm test && npm run type-check && npm run lint` -- expected: pass.

**Manual checks (if no CLI):**
- Swagger: both routes documented, upload callable. On device after a native rebuild (`main` acceptance pass): gallery, camera, remove, permission refused.

## Implementation Notes

- The local stacks did not run Storage: `scripts/test-db.sh` and `scripts/dev-db.sh` excluded `storage-api`. Both now start it (docs: `doc/TESTING.md`, `backend/README.md`). The dev stack picks it up on the next `make supabase-up`; the CI image cache key already hashes `test-db.sh`.
- Backend: `utils/image-type.ts` (magic bytes), `utils/avatar-upload.ts` (multer memory, 2 MB, 413 `FILE_TOO_LARGE`, 400 `INVALID_UPLOAD`), `services/avatar.service.ts` (`ownedAvatarPath` only deletes `<userId>/<uuid>.<ext>` in the bucket, host ignored since the local stack has several addresses). Both routes answer 200 `{ avatarUrl }` (DELETE: `null`) because `mobile/src/services/api.ts` cannot parse a 204. `avatarRateLimiter` shared by PUT and DELETE, `RATE_LIMIT_AVATAR_WINDOW_MS`/`RATE_LIMIT_AVATAR_MAX` (1 h / 10).
- Mobile: `ImageManipulator.manipulate(...).renderAsync()` instead of the deprecated `manipulateAsync`, with a centred square crop before the 512 px resize. Logic in `hooks/useAvatarPicker.ts` and `utils/avatarImage.ts`; store action `setAvatarUrl`.

## Plan Change Log

## Review Triage Log

Out of plan, kept: `backend/scripts/dev-db.sh` and `test-db.sh` excluded `storage-api`, so Storage did not run locally; the implementer re-enabled it and documented it (`backend/README.md`, `doc/TESTING.md`).

Quick review, pass 1: 5 findings. 4 patched by the implementer, 1 rejected. Then full verification green (backend 420 unit + 350 integration tests, type-check, lint; mobile 850 tests, type-check, lint).

- medium, patched: `ownedAvatarPath` decoded the path outside its `try`, so a stored `avatar_url` with a bad percent sequence (accepted by PATCH's `z.url()`) threw and every later PUT/DELETE avatar answered 500. Decode moved inside the guard; tested.
- medium, patched: `PATCH /api/profile` could replace `avatarUrl` and leave our previous file in the bucket. `deleteReplacedAvatar` now cleans it (fire-and-forget, logged); tested.
- low, patched: a dev or test stack started before this change has no `storage-api`. README and TESTING say to restart it once, and that the hosted project needs Storage enabled before 027.
- low, patched: `setAvatarUrl` sat under `updateProfile`'s JSDoc. Moved, own comment.
- low, rejected: two concurrent PUTs from the same user can leave the first upload orphaned (both read the same previous URL). The app guards double taps; closing it would need a lock or conditional update.

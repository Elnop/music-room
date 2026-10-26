# Free and premium plans

Bonus V.3 (epic #478): each user is on a free or a premium plan and can switch from one to the other. The premium plan unlocks features the free plan lacks; the first one is a custom playlist cover (#483).

Code: `backend/src/shared/subscription/plan.ts` (plan check, used by every feature that gates on Premium), `backend/src/features/subscription/` (the endpoints), migration `030_subscription_plan.sql`; mobile `src/shared/hooks/usePlan.ts`, `src/shared/services/subscriptionApi.ts` and the Settings screen (`features/profile/settings/`).

## The two plans

The plan is stored in `user_profiles.plan` (`free` or `premium`, `CHECK` constraint), with `plan_changed_at` stamped on each switch (null while the user never switched). A new account is on `free`.

| Plan | Unlocks |
| --- | --- |
| `free` | Everything the mandatory part of the subject asks for |
| `premium` | `playlist_cover`: a custom cover image on a playlist |

`PREMIUM_FEATURES` in `plan.ts` lists what Premium unlocks; `GET /api/subscription` returns it so the app can show what a switch would bring.

## The simulated switch

The subject only asks that a user can move from one plan to the other, so there is no payment: `PUT /api/subscription` takes effect at once. A real payment provider could replace that endpoint (its webhook would write `plan`) without changing the access checks, which only read `user_profiles.plan`.

| Endpoint | Use |
| --- | --- |
| `GET /api/subscription` | `{ plan, premiumFeatures }` for the caller |
| `PUT /api/subscription` | `{ plan: 'free' \| 'premium' }`; returns the new state. Rate-limited per user (`RATE_LIMIT_SUBSCRIPTION_*`, 20 switches per hour) |

Both need a token (401 without): `app/routes.ts` hands `authMiddleware` to `createSubscriptionRouter`, since a feature never imports another one. An unknown plan is a 400 `VALIDATION_ERROR`.

## Gating a feature

A feature that is Premium-only calls `assertPremium(userId)` from `@/shared/subscription/plan.js` before acting; it throws 403 `PREMIUM_REQUIRED` on the free plan. The check lives in `shared/` because several features use it and a feature never imports another one.

## Custom playlist cover

`PUT /api/playlists/:id/cover` (multipart field `cover`, JPEG, PNG or WebP, at most 2 MB, #483) checks that the caller owns the playlist (403 `PLAYLIST_ACCESS_DENIED`), then `assertPremium` (403 `PREMIUM_REQUIRED`). The file goes to the public `playlist-covers` bucket (migration 031) as `<playlistId>/<uuid>.<ext>`, its URL to `playlists.cover_url`, and the room receives `playlist:details` with the new `coverUrl`. `DELETE /api/playlists/:id/cover` is allowed on any plan. Replacing or removing a cover deletes the previous file, and deleting the playlist deletes its cover file (best effort). The upload pipeline (multer limits, type read from the magic bytes, storage under a random name) is shared with the profile photo in `backend/src/shared/storage/`.

In the app (#485), the owner finds **Changer la cover** and, when a cover exists, **Retirer la cover** in the playlist's ⋯ sheet (`features/playlists/detail/hooks/useCoverActions.ts`). On the free plan the action shows a lock and a dialog that leads to Settings, and no upload is sent; a 403 `PREMIUM_REQUIRED` (downgraded from another device) shows the same dialog and refetches the plan. The image goes through the same picker and 512 px square JPEG as the profile photo (`shared/utils/imagePicker.ts`, `shared/utils/squareImage.ts`).

## Going back to free

A downgrade deletes nothing: what was created on Premium (a playlist cover) stays as it is and is still shown. The user only loses the right to create or change a Premium-only thing until they switch back.

## In the app

**Profile › Settings › Abonnement** shows the current plan and a Premium switch, with the note that no payment is asked (#484). `usePlan()` (`shared/hooks/usePlan.ts`) reads the plan; it lives in `shared/` because Settings and the playlist cover both read it. `useChangePlan()` switches it optimistically: the cached plan changes at once, so every screen reading `usePlan()` unlocks or locks the Premium feature without a restart; a failed request puts the previous plan back and Settings shows an error.

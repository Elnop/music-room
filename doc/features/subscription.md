# Free and premium plans

Bonus V.3 (epic #478): each user is on a free or a premium plan and can switch from one to the other. The premium plan unlocks features the free plan lacks; the first one is a custom playlist cover (#483).

Code: `backend/src/shared/subscription/plan.ts` (plan check, used by every feature that gates on Premium), `backend/src/features/subscription/` (the endpoints), migration `030_subscription_plan.sql`.

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

## Going back to free

A downgrade deletes nothing: what was created on Premium (a playlist cover) stays as it is and is still shown. The user only loses the right to create or change a Premium-only thing until they switch back.

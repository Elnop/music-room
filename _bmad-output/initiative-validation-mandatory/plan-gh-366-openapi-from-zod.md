---
title: 'Doc OpenAPI générée depuis les schémas Zod (#366)'
type: 'refactor'
ticket: 'https://github.com/Elnop/music-room/issues/366'
created: '2026-10-22'
status: 'built'
baseline_revision: 'ef50f726902bcd5b6edb32a9ff879c695ac0e8c1'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md', '{project-root}/.agents/rules/logging.md', '{project-root}/docs/superpowers/specs/2026-10-21-clean-codebase-refactor-design.md', '{project-root}/.agents/rules/architecture.md', '{project-root}/.agents/rules/guardrails.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #366, epic #362. The API documentation is about 5,200 lines of hand-written OpenAPI objects (`features/*/*.openapi.ts`), plus `shared/config/swagger.schemas.ts`. They repeat schemas the Zod validators already define, and can drift from what the API really validates and returns.

**Approach:** Generate the OpenAPI document from Zod schemas with `@asteasolutions/zod-to-openapi` (Zod 4 compatible). Request schemas are the existing validators. Response schemas become Zod schemas next to them, in `<name>.validators.ts`. Each `<name>.openapi.ts` only registers its routes (method, path, tags, summary, request, responses). The subject explicitly allows a self-generated reference (methods, inputs, outputs).

## Boundaries & Constraints

**Always:**
- No documented operation is lost. For each operation, the documented path, method, parameters, request body fields, response codes and response fields stay the same as on `develop`. Compare `/api-docs.json` before and after with a small script and list any difference in the PR.
- Keep each operation's `summary`, `description`, `tags`, `operationId` and security. Keep the shared responses (`UnauthorizedError`, `ValidationError`, `ForbiddenError`, `NotFoundError`, `RateLimitError`, `RateLimitUnavailable`) and the success/error envelope.
- `openapi-coverage.test.ts` keeps passing unchanged: every mounted route is documented, and every documented route is mounted.
- A request schema is a single source: the validator a route uses is the one its OpenAPI entry registers.
- Every file stays under 150 lines (a big feature's registrations can be split by subject, e.g. `playlist.openapi.ts` plus `playlist-sharing.openapi.ts`). Run `npm run check` green, and do not add exception entries.

**Never:**
- Change runtime validation or response bodies to fit the doc. If the doc and the API disagree, document what the API really does, and list each case in the PR.
- Keep examples that only repeat the field type. Keep the examples that carry meaning, such as an error code value or an ID format, through `.openapi({ example })`.

</frozen-after-approval>

## Code Map

- `src/shared/config/swagger.config.ts` (154 lines) -- builds an `OpenAPIV3.Document` (`openapi: '3.0.0'`, info, servers, the `bearerAuth` security scheme) by merging every feature's `*Paths` and `*Schemas` with `commonSchemas` and `commonResponses`. Replace it with an `OpenAPIRegistry` that each feature's `register*Openapi(registry)` fills, then `OpenApiGeneratorV3`. Keep the same info and servers. `server.ts:55-59` serves `swaggerSpec`; keep that export name.
- `src/shared/config/swagger.schemas.ts` (161 lines) -- `SuccessResponse`, `ErrorResponse` and the shared responses. Rewrite them as Zod schemas plus a helper that wraps a data schema in the success envelope. The error shape must match `shared/middleware/error-handler.ts`, including any `why`/`fix` fields if #365 has merged first; check.
- Per feature (`auth` 1,548 lines, `playlists` 1,092, `music-control` 735, `profile` 612, `queue` 560, `soundcloud` 375, `friends` 272): read the paths and component schemas, register each route against its validator from `<name>.validators.ts`, and write the missing response schemas there with `extendZodWithOpenApi` metadata. `friends` has no validators file: create `friends.validators.ts` for its params and responses. Do not change the friends routes beyond using the schema for params, and only if they already validate params.
- `src/shared/config/openapi-coverage.test.ts` -- walks `routes` against `swaggerSpec.paths`. It must pass as is.
- Response types: where a hand-written response interface in `<name>.types.ts` duplicates a new Zod response schema, keep the interface. Replacing types is #367–#373; note the duplicates in Implementation Notes.
- `AGENTS.md` "Where things are": the line about `features/<name>/<name>.openapi.ts` stays true. Add that schemas come from Zod in `<name>.validators.ts`.
- `doc/` or `backend/README.md` mentions of hand-written OpenAPI, if any: update them.

## Tasks & Acceptance

**Execution:**
- [ ] `backend/package.json` -- `npm install @asteasolutions/zod-to-openapi` -- generator.
- [ ] Before any change, save `/api-docs.json` from `develop` to the scratch area (start the app or import `swaggerSpec` from a script) -- baseline for the comparison.
- [ ] `src/shared/config/swagger.config.ts`, `swagger.schemas.ts` -- registry, generator, shared envelope and responses -- single document.
- [ ] Each feature's `*.validators.ts` and `*.openapi.ts` -- response schemas and route registrations -- doc from Zod.
- [ ] Comparison script (scratch, not committed) -- diff operations, params, request fields and response codes and fields between baseline and new -- no loss.
- [ ] `AGENTS.md`, docs -- one line on where the schemas live.

**Acceptance Criteria:**
- Given the generated `/api-docs.json`, when compared with the `develop` baseline, then every operation is present with the same path, method, parameters, request fields, response codes and response fields; any deliberate difference is listed in the PR with its reason.
- Given Swagger UI, when opening any endpoint, then its summary, inputs and outputs show.
- Given `npm run check` in `backend/`, then it is green with no new exception, and every `*.openapi.ts` is under 150 lines.
- Given the total line count of `*.openapi.ts` plus `swagger.*.ts`, then it is clearly below 5,500 (target: under half).

## Implementation Notes

- Generator: `@asteasolutions/zod-to-openapi` 9.1 (`OpenAPIRegistry` + `OpenApiGeneratorV3`), installed with npm 10. `openapi-types` is no longer used and was removed (knip).
- Metadata uses Zod's own `.meta()` (descriptions, examples, `param.description`), not `extendZodWithOpenApi`: extending Zod only works on schemas created after the call, and under Vitest the validators load first (routes before swagger.config), so `registry.register()` broke. Components are named with `nameSchemas({ Name: schema })` (`swagger.schemas.ts`), which sets the refId in the library's own `zodToOpenAPIRegistry` as `.openapi(refId)` would; 52 components (baseline names; profile uses `OwnProfile`, `FilteredProfile` since `UserProfile` is auth's), so operations `$ref` them (document 323 KB, baseline 273 KB). `ErrorResponse` comes from `z.toJSONSchema(..., { target: 'openapi-3.0', io: 'input' })`. Per-route parameter descriptions come from `describeParams(schema, { field: '...' })`, a copy of the validator's shape with param metadata.
- Shared files: `swagger.schemas.ts` (success envelope `ok`, `okMessage`, `jsonBody`, `param`, `bearerAuth`) and the new `swagger.errors.ts` (`ErrorResponse`, `fail`, `shared`, the six shared responses), split to stay under 150 lines. `swagger.config.ts` still imports only the 7 `<name>.openapi.ts` files, so the dependency-cruiser known violations are unchanged; each feature's main file calls its sub-files (`auth-session|oauth|email|password`, `playlist-tracks|sharing`, `profile-settings`, `music-control-devices`, `queue-routes|playback`).
- Response schemas: `<name>.validators.ts`, or `<name>-responses.validators.ts` when the validators file would pass 150 lines (playlists, profile, music-control); `/health` in `swagger.schemas.ts`. No response schema is written inline in an `*.openapi.ts`. `friends.validators.ts` was created (params + responses); the friends controller is unchanged (it reads `:userId` with `routeParam`).
- Path params read with `routeParam` (playlists `id`/`userId`, profile and friends `userId`, music-control permission `userId`) have doc-only schemas, documented as UUIDs as before.
- `.jscpd.json`: the 7 `*.openapi.ts` ignore entries are removed (the list shrank; jscpd finds no clone).
- Duplicated response types (kept for #367–#373): `auth.types.ts` `UserProfile`, `AuthResponse`, `LinkedProvidersResponse`; `playlist.types.ts` `PlaylistResponse`, `PlaylistOwner`, `PlaylistWithTracksResponse`, `TrackInPlaylistResponse`, `AddTrackResult`, `RemoveTrackResult`, `MoveTrackResult`; `profile.types.ts` `ProfileUpdateResponse`, `PublicProfile`, `FilteredProfile`, `ProfilePrivacy`, `MusicPreferences`, `AvatarResponse`; `music-control.types.ts` `Device`, `DeviceLicense`, `RenameDeviceResponse`, `DeviceWithLicenses`, `ControllableDevice`, `MyDevicesResponse`, `GrantDeviceLicenseResponse`, `ControllableDevicesResponse`, `DevicePickerOwner`, `DevicePickerResponse`; `queue.types.ts` `QueueTrack`, `QueueItem`, `QueueState`, `TransferResult`; `friends.types.ts` `FollowStatus`, `FollowActionResponse`; `soundcloud.types.ts` `SoundCloudTrack`, `SoundCloudSearchResult`; `soundcloud-stream.service.ts` `StreamUrlResult`.

### Deliberate differences from the develop document (doc fixed to match the API)

Found by the comparison script (78 operations before and after, none lost or added). Each comes from reading the controller and service:

- Every success `meta`: `requestId` removed (never sent).
- `GET /health`: real body `{ status, timestamp, uptime, environment, services.redis }` (was `redis` at the top level).
- Auth: `user.connectedProviders` removed (never set); `requiresVerification` and `message` added to the sign-in answer (`AuthResponse` type); `GET /me` answers `{ user }`, not the profile itself; `POST /google` and `/facebook` always answer 200 (201 removed).
- Playlists: create, get and update answer `{ playlist }`; create/update give the playlist without tracks (`PlaylistResponse`: `ownerId`, `collaboratorIds`, `viewerIds`, `trackCount`, `firstTrackCover`); get adds `tracks` and `tracksVersion`, without the `collaborators`/`viewers` arrays the doc claimed (description updated); `GET /{id}/viewers` answers `{ viewers }`; adding a collaborator or a viewer answers 201, not 200; `DELETE /{id}/tracks/{trackId}` gains its 400 (trackId validated as a UUID).
- Profile: request bodies now follow the validators: `PATCH /api/profile` has no `username` (displayName max 15, bio max 300, not 50/500), music preferences take `genres`, not `favoriteGenres`; responses: own profile adds `favoriteArtist` and drops `connectedProviders`; `GET /{userId}` is the privacy-filtered profile (`musicPreferences`, `isOwnProfile`, `isFriend`, no `updatedAt`); music preferences are `{ userId, genres, updatedAt }`.
- SoundCloud: track and search results are SoundCloud's own objects passed through (`id`, `title`, `description`, `duration`, `genre`, `artwork_url`, `permalink_url`, `user`, `playable`, `streamable`, `policy`, `media`), search is `{ collection, total_results, next_href }`; the camelCase `tracks`/`count` shape was never returned.
- Friends: `GET /api/friends` is an array of mutual friends `{ id, username, displayName, avatarUrl }` (description updated); stats are `{ followersCount, followingCount }`; follow status adds `isFriend` and the counts (no `isMutual`); follow and unfollow answer `{ success, status }`; follow 409 removed (already following answers 200), status and unfollow 404 removed (never thrown); descriptions say they are idempotent.
- Music control: `GET /permissions` is `{ allowedUserIds }` (description and summary updated: the friends you granted control); grant and revoke answer `{ success, allowedUserId }`; can-control answers `{ canControl, targetUserId }`; revoke and can-control gain their 400 `INVALID_USER_ID`.
- Queue: `POST /api/queue/items` (and its mirror) describes, in its body description instead of a body component, that a sent `previewUrl` is ignored; the comparison reports it as an operation description change.
- Request examples that only repeated field types are gone; kept: error codes and messages, move-track `afterRank`/`expectedVersion`, verify-email code, rename device, privacy and genres bodies, playback `deviceId`.

## Plan Change Log

## Review Triage Log

## Verification

- `npm run check` (backend): all 10 checks OK, no exception list grew (jscpd's shrank).
- `npx vitest run src/shared/config/openapi-coverage.test.ts`: 4 passed, unchanged test.
- Comparison script (scratchpad, `compare.mjs baseline.json new.json`): 78 -> 78 operations, same paths, methods, operationIds, summaries, tags, security, parameters, request bodies (apart from the profile ones above); the other differences are the ones listed above.
- The comparison also checks parameter descriptions: none missing or changed.
- `swagger-cli validate` on the generated document: valid.
- `wc -l`: every `*.openapi.ts` and `swagger*.ts` file is at most 149 lines; total 2,222 lines (was 5,514).
- Not done: the manual Swagger UI check in a browser (the server was not started).

## Verification plan

**Commands:**
- `cd backend && npm run check` -- expected: all OK.
- `cd backend && npx vitest run src/shared/config/openapi-coverage.test.ts` -- expected: pass.
- The comparison script -- expected: no difference, or only the listed ones.
- `wc -l src/features/*/*.openapi.ts src/shared/config/swagger*.ts` -- expected: every file ≤ 150 lines and a much smaller total.

**Manual checks:**
- Open http://localhost:3000/api-docs: every tag lists its endpoints with request and response schemas, and the Authorize button works.

### Pass 1 (quick) — high 0 / medium 2 / low 4 / false 0 / maybe-false 0

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| 13 parameter descriptions dropped; the compare script did not diff them | medium | patch | The reviewer's `pd.mjs` lists them; this breaks "no operation loses its parameters". Restore them through meta and extend the comparison. |
| Named components collapsed from 55 to 1: shapes inlined, document 273→461 KB, Swagger UI's Schemas section lost | medium | patch | `registry.register` names components without `extendZodWithOpenApi`. |
| Error examples omit the required `meta` | low | patch | `errorResponseSchema` requires `meta`; direct fix. |
| Some response schemas defined in `*.openapi.ts` instead of the validators | low | patch | Breaks the plan's placement rule; move them. |
| The AGENTS.md sentence is inaccurate (`*-responses.validators.ts`) | low | patch | Wording fix. |
| `format: password` lost on 3 password fields | low | patch | Swagger UI shows passwords in clear text; restore it through meta. |
| Wrong summary on `GET /music-control/permissions` (raised in the implementer's report) | low | patch | Correct the doc to match the route; no behaviour change. |

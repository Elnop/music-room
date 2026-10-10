---
title: 'Backend unit tests for SoundCloud and mail'
type: 'chore'
ticket: '7'
created: '2026-10-10'
status: 'built'
baseline_revision: '35641158ca69994d63108ce36cd47c9d375a1e18'
route: 'full'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/doc/TESTING.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The SoundCloud search, track and stream services, their in-memory cache, and the mail service have no unit tests. The only SoundCloud test (`soundcloud.int.test.ts`) replaces the whole service, so nothing checks the cache or the 30-minute stream URL expiry (GitHub #100, epic #93, CAP-3).

**Approach:** Add Vitest unit tests next to each module. The SoundCloud services get a hand-built fake `SoundCloudClient` through their constructors, and fake timers check cache expiry. The mail service runs with `nodemailer` mocked, and the tests check what `sendMail` receives.

## Boundaries & Constraints

**Always:** Unit tests only (`*.test.ts`, picked up by `npm test`), with no network: SoundCloud and SMTP are never called. Use `vi.useFakeTimers()` / `vi.setSystemTime` for TTLs and restore real timers in `afterEach`. Reset mocks in `beforeEach`. Import with `@/...` and `.js` extensions. No `any`. Typed fakes satisfy `SoundCloudClient` (plus `util.streamLink` for the stream service).

**Never:** Change production code. If a bug blocks a test, record it under Open Questions or as a ticket (feedback rule) and do not fix it. No new dependencies. No integration test. Do not touch `soundcloud.int.test.ts`. Do not test `soundcloud.service.ts` construction: it loads `soundcloud.ts` with `createRequire`, which `vi.mock` does not intercept.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Search, playable filter | collection with streamable, transcodings-only and unplayable tracks | only the first two returned; `total_results`, `next_href` passed through | No error expected |
| Search cache hit | same `q/limit/offset` twice | client called once; a different `offset` calls it again | No error expected |
| Search failure | `tracks.search` rejects | `AppError` 500 `SOUNDCLOUD_ERROR` | thrown |
| Track cache / not found | `tracks.get` resolves, then is called again within 1 h; or rejects | cached on 2nd call; reject gives `AppError` 404 `TRACK_NOT_FOUND` | thrown |
| Stream HLS | `streamLink(url,'hls')` returns a URL | that URL; `progressive` not requested | No error expected |
| Stream fallback | HLS returns '' or throws, progressive returns a URL | progressive URL | No error expected |
| Stream none | both empty or throw | `AppError` 404 `STREAM_NOT_FOUND`; nothing cached (next call hits the client) | thrown |
| Client without `util` | fake client lacking `util` | `AppError` 500 `API_ERROR` | thrown |
| Stream cache 30 min | URL fetched at t0 | cached at t0+30 min exactly; refetched at t0+30 min+1 ms | No error expected |
| Verification mail | `sendVerificationEmail(to, '123456', 15)` | `sendMail` once: `to`, `from` `Zumik <GMAIL_USER>`, verify subject, code and "15 minutes" in `html` and `text` | No error expected |
| Reset mail | `sendPasswordResetEmail(...)` | same checks, reset subject | No error expected |
| Transport failure | `sendMail` rejects | promise rejects with that error | propagated |

</frozen-after-approval>

## Code Map

- `backend/src/features/soundcloud/utils/soundcloud-cache.ts:9` -- `CACHE_TTL.STREAM: 1800`, the guard the acceptance check targets; `get` (line 30) expires when `Date.now() > expiry`, so an entry is still served at exactly +TTL.
- `backend/src/features/soundcloud/services/soundcloud-search.service.ts` -- `SoundCloudSearchService(client)`: `searchTracks` (key `search:q:limit:offset`, TTL 1 h), `getTrack` (key `track:id`), `convertToTrackDTO`.
- `backend/src/features/soundcloud/services/soundcloud-stream.service.ts` -- `SoundCloudStreamService(client)`: `getStreamUrl`, HLS then progressive via `client.util.streamLink`, `CACHE_TTL.STREAM` at lines 54 and 63.
- `backend/src/features/soundcloud/soundcloud.types.ts:9` -- `SoundCloudClient`, `SoundCloudTrack` shapes for the fakes.
- `backend/src/features/mail/mail.service.ts` -- `sendVerificationEmail`, `sendPasswordResetEmail`. The transporter is a module-level singleton created on the first call (line 15), so `createTransport` runs once per module instance.
- `backend/src/features/mail/mail.config.ts` -- `gmailConfig` (`service: 'gmail'`, `auth` from env), `senderConfig`.
- `backend/src/test/setup-env.ts` -- placeholder env (`GMAIL_USER=test@example.com`); `vitest.config.ts` has `restoreMocks: true`.
- Fake timer pattern: `backend/src/features/auth/services/token-revocation.service.test.ts`, `backend/src/realtime/latest-throttle.test.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/features/soundcloud/utils/soundcloud-cache.test.ts` -- test get/set/expiry/clear/size, and that `CACHE_TTL.STREAM * 1000` is at most 30 min -- pins the constant itself.
- [x] `backend/src/features/soundcloud/services/soundcloud-search.service.test.ts` -- cover the search and track rows of the matrix plus `convertToTrackDTO` (`trackUri` = `permalink_url`, `albumArt` falls back to `user.avatar_url` then '', `previewUrl` '') -- search/track behavior with a mocked client.
- [x] `backend/src/features/soundcloud/services/soundcloud-stream.service.test.ts` -- cover the stream rows, including the 30-minute boundary with fake timers (cached at +1800 s, refetched at +1800 s+1 ms), for both the HLS and progressive paths -- the acceptance check.
- [x] `backend/src/features/mail/mail.service.test.ts` -- `vi.mock('nodemailer')` with `default.createTransport` returning `{ sendMail }`; cover the mail rows and assert `createTransport` received `gmailConfig` -- mail sending with a mocked transport.

**Acceptance Criteria:**
- Given the four new files, when `npm test` runs in `backend/`, then they pass with no network access.
- Given `CACHE_TTL.STREAM` temporarily set above 1800 (e.g. 1801 or 3600) in `soundcloud-cache.ts`, when `npm test` runs, then at least one stream-expiry test fails. The implementer proves this by making the change, recording the failing test names in Implementation Notes, and reverting it.
- Given the stream cache `set` call removed temporarily, when `npm test` runs, then a stream cache-hit test fails (proved the same way, then reverted).

## Implementation Notes

- Four files added, 30 tests; `npm test` 24 files / 241 tests green, `type-check` clean, `lint` no errors or warnings, Prettier clean. No production code changed.
- Stream tests drive the 30-minute boundary with `vi.setSystemTime` for both HLS and progressive paths (`describe.each`). Cache tests pin `CACHE_TTL.STREAM * 1000 <= 30 min`.
- Mail tests use `vi.hoisted` mocks plus `vi.resetModules()` and a dynamic `import()` in `beforeEach`, so each test gets a fresh transporter singleton; `createTransport` is asserted once with `gmailConfig`.
- Mutation proof (each reverted with `git checkout`, then suite green again):
  - `CACHE_TTL.STREAM: 1801` -> 3 failures: `CACHE_TTL > keeps stream URLs at most 30 minutes`, `stream URL cache ('HLS') > refetches the URL 1 ms after 30 minutes`, `stream URL cache ('progressive') > refetches the URL 1 ms after 30 minutes`.
  - HLS `this.cache.set(...)` removed -> `stream URL cache ('HLS') > serves a cached URL on the next call` and `> still serves the cached URL at exactly 30 minutes` fail.
  - Progressive `this.cache.set(...)` removed -> the same two tests fail for `('progressive')`.

## Plan Change Log

## Review Triage Log

Quick review, 3 findings: 1 low patched, 1 bookkeeping fixed, 1 rejected.

- low, patched: the "Stream none" matrix row (both empty or both throw) was only tested as HLS empty + progressive throwing; added both-empty and both-throw cases. Soundcloud tests re-run: 27/27.
- fixed: `baseline_revision` pointed at 936272e, before the worktree was fast-forwarded; set to 3564115 so the diff holds only this ticket.
- low, rejected: the 1 h track/search TTL is not exercised with the clock; the plan asks only for the cache hit, and the 30 min stream TTL (the ticket's guard) is tested at its boundary.

## Design Notes

Mail singleton: because `restoreMocks: true` and the transporter is cached across tests, either assert `createTransport` in one test that runs first in a fresh module (`vi.resetModules()` + dynamic `import()` in `beforeEach`), or keep one `sendMail` mock defined in `vi.hoisted` and `mockReset` it per test. The first option is more robust.

## Verification

**Commands:**
- `cd backend && npm test` -- expected: all suites pass, including the four new files.
- `cd backend && npm run type-check` -- expected: clean.
- `cd backend && npm run lint` -- expected: no errors.

---
title: 'Profile search matches the query literally (no PostgREST filter injection)'
type: 'bugfix'
ticket: ''
created: '2026-10-10'
status: 'built'
baseline_revision: 'f899fe8e5770f2715467a551001ee86f82d8ee07'
route: 'oneshot'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `ProfileService.searchUsers` put the raw query `q` into a PostgREST `.or()` filter string, so a comma, parenthesis or dot in `q` changed the filter (extra conditions on `user_profiles` columns, or a 500), and `%`/`_` acted as wildcards (GitHub #236).

**Approach:** Build the `ilike` value with a helper that escapes LIKE wildcards and wraps the value in PostgREST double quotes, so the query is always one literal value.

</frozen-after-approval>

## Implementation Notes

Oneshot (about 30 lines of code plus tests):
- `backend/src/shared/utils/postgrest-filter.ts`: `ilikeContains(text)` escapes `\\ % _`, then `\\ "` for PostgREST, and returns `"%…%"`; unit-tested in `postgrest-filter.test.ts`.
- `profile.service.ts` `searchUsers` uses it for both columns. The other `.or()` (`playlist.service.ts:33`) only interpolates the token's user id.
- `profile-search.int.test.ts` (local stack): substring match, `zzz…,id.eq.<uuid>` does not return that user, parentheses and quotes answer `[]`, `50%_off` matches only itself. With the old filter 2 of 4 fail; with the fix 4/4 pass. Backend unit suite 314/314, type-check and lint clean.
- Out of scope, ticketed: search results include `bio` whatever its privacy setting.

## Review Triage Log

Quick review, 2 findings: 1 low patched, 1 note fixed.

- low, patched: PostgREST reads `*` as `%` in like patterns and cannot escape it, so `a*z` matched anything between; `*` now becomes `_` (one character). Unit test added; integration test checks `*` no longer spans several characters. Escaping of quotes, backslashes, `%` and `_` confirmed against PostgREST 16's or-filter grammar.
- note: there are two other `.or()` filters in `playlist.service.ts` (lines 33 and 134); both interpolate only the token's user id.

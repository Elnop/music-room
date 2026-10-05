---
id: SPEC-mandatory-gaps
companions:
  - priorities.md
  - ../../audit-subject-v5-3/audit-subject-v5-3.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Mandatory part gaps — Music Room subject v5.3

## Why

A mandate to meet: the defense grades Music Room against `doc/en.subject.pdf` v5.3, and the code audit of 2026-10-05 shows the mandatory part is not yet passing. IV.6, IV.7 and IV.8 fail outright, five other sections are partial, and bonuses are only graded once the mandatory part is perfect. Each gap below closes one audited failure, with evidence the team can show at the defense.

## Capabilities

- **CAP-1**
  - **intent:** The realtime channel trusts only authenticated identities, so users act only as themselves and receive only the playlist and listening events they are allowed to see.
  - **success:** A socket client with no token, an invalid token, or a forged user id is rejected; a user not invited to a private playlist receives none of its updates; a user cannot send control commands as someone else.
- **CAP-2**
  - **intent:** The team can measure and justify how many users can use the API and both services at the same time on a documented server.
  - **success:** A repeatable load test runs from the repo, and a document states the server specs (CPU, RAM, cloud or local), the tool, the method, the results and the maximum concurrent users, consistent with that platform.
- **CAP-3**
  - **intent:** Each layer (backend services, API routes, mobile stores and components) has automated tests that catch regressions.
  - **success:** `make test` runs backend and mobile tests covering the critical paths of each layer (no coverage threshold), and exits non-zero when one fails.
- **CAP-4**
  - **intent:** A user grants or revokes music control to a friend for each of their own devices separately.
  - **success:** A friend allowed on device A can control A, and the same friend's command to device B is refused until B is granted.
- **CAP-5**
  - **intent:** Several users moving, adding or removing tracks in the same playlist at once never corrupt it.
  - **success:** Under concurrent reorder, add and remove on one playlist, every track ends present exactly once, no move is silently lost without the client being told, all clients converge on the server order, and `added_by` keeps the original adder.
- **CAP-6**
  - **intent:** A signed-in user links a Google or Facebook account to their existing account from the app, and can unlink it.
  - **success:** An email/password user links a Google account whose email differs, then signs in with either method to the same account; unlinking the last sign-in method is refused.
- **CAP-7**
  - **intent:** The API reference documents every endpoint with its method, inputs and outputs.
  - **success:** Every route mounted by the backend appears in Swagger with request and response schemas; none of the 8 endpoints listed in the audit is missing.
- **CAP-8**
  - **intent:** A tester points the app to another backend address from inside the app.
  - **success:** Changing the address in the app, without rebuilding, sends the next API and socket traffic to the new backend.
- **CAP-9**
  - **intent:** Logging out ends the session on the server.
  - **success:** A request or socket connection using a token issued before logout is rejected.
- **CAP-10**
  - **intent:** The team identifies threats beyond those already handled and explains the practicable protections.
  - **success:** A document lists each hazard (including bruteforce, session theft, data isolation and realtime abuse) with its protection or accepted risk, and `doc/SECURITY.md` matches the real Dockerfiles.
- **CAP-11**
  - **intent:** The team can justify its technical choices at the defense.
  - **success:** A document explains why the backend stack, database, REST, JSON and realtime transport were chosen over named alternatives.
- **CAP-12**
  - **intent:** Every pull request into `develop` is checked automatically.
  - **success:** Opening a PR into `develop` runs lint, type-check and tests, and a failure marks the PR red.
- **CAP-13**
  - **intent:** The repository tells one current story of the remaining work and follows its own rules.
  - **success:** `TODO.md` is replaced by GitHub issues, unmerged branches are merged or deleted, and `mobile/src/types/index.ts` no longer exists.

## Constraints

- `doc/en.subject.pdf` v5.3 overrides every other document; bonus parts are only graded when the mandatory part is perfect.
- Brownfield: keep the current stack (Express/TypeScript, Supabase, Redis, Socket.io, Expo React Native); no rewrite.
- The backend stays the source of truth; the mobile app stays a remote control of the API.
- Every mobile action, new socket events and endpoints included, logs platform, device and app version on the backend.
- No credentials in git; secrets live only in `.env` files.
- `main` deploys: work branches from `develop`, one branch per GitHub issue, PR into `develop`.
- Load tests use a tool from the subject's list (AB, Gatling, Siege, Tsung, JMeter) or a justified equivalent.

## Non-goals

- Music Track Vote (IV.2.1).
- Bonus parts V.1–V.4, web support included.
- Issue #29 (replace emojis with Phosphor Icons): cosmetic, outside the subject.

## Success signal

- Re-running the subject audit marks every mandatory requirement from III.1 to IV.8 as done, and each one can be demonstrated live or with a committed document at the defense.

## Assumptions

- CAP-4 applies to the devices of the user who grants control, identified by the deviceId the app already persists.
- CAP-5 covers adding, removing and reordering tracks; playlist metadata edits stay last-write-wins.

## Open Questions

- Which machine and specs are the reference server for the IV.7 measurements? Decided during CAP-2.
- Node 20 (Dockerfile) or 22? Decided in its own ticket; CAP-12 needs it to pin a version.

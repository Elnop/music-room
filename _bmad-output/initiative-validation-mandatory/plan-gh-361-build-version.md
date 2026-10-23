---
title: 'Mobile : afficher la version du build dans l''app (#361)'
type: 'feature'
ticket: 'https://github.com/Elnop/music-room/issues/361'
created: '2026-10-23'
status: 'built'
baseline_revision: '120f2f47a57db1dd2a9519d839bd753d0c93a109'
route: 'oneshot'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md', '{project-root}/.agents/rules/components.md', '{project-root}/.agents/rules/structure.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #361. The app shows its version nowhere, so an installed APK cannot be matched to a GitHub release (`v1.0.0-build.N`) or a commit: `expo.version` is always `1.0.0`, and the build number and commit are only known to `release-apk.yml`, after the bundle is built.

**Approach:** `release-apk.yml` computes the build number (with the re-run suffix the tag already uses) and the short commit SHA before `expo prebuild`, exports them as `EXPO_PUBLIC_BUILD_NUMBER` / `EXPO_PUBLIC_COMMIT_SHA` so Metro inlines them, and names the tag from the same value. The app shows, discreetly at the bottom of the Profile screen, `Zumik <version> (build <N> · <sha>)`, or `Zumik <version> (dev)` when the variables are absent (local debug build). `<version>` comes from `getAppVersion()`, the source of the `X-App-Version` header. No secret added.

</frozen-after-approval>

## Implementation Notes

Oneshot: about 60 lines across the workflow, `deviceService`, the Profile hook/orchestrator/presenter and their tests.

- `formatBuildLabel` (pure) + `getBuildLabel` in `shared/services/deviceService.ts`, beside `getAppVersion` (the `X-App-Version` source).
- babel-preset-expo inlines `process.env.EXPO_PUBLIC_*` at transform time, also under Jest: `getBuildLabel` cannot be tested by setting `process.env` at runtime, so only `formatBuildLabel` is unit-tested; the Profile test mocks `deviceService` (it pulls native modules Jest cannot parse).
- `release-apk.yml`: new "Stamp the build" step before prebuild computes the build number (run number + `.attempt` on re-run) once; the tag and the release title reuse it.
- `mobile/.env.example`: commented placeholders saying the workflow sets them.

## Review Triage Log

### Pass 1 (quick) — high 0, medium 0, low 0, false 1, maybe-false 0

- false — "`getBuildLabel`'s env wiring is untested; a typo in the variable names would silently show `(dev)`". Disproved by transforming `deviceService.ts` with babel-preset-expo (metro caller, android) and `EXPO_PUBLIC_BUILD_NUMBER=42.2 EXPO_PUBLIC_COMMIT_SHA=a1b2c3d`: the output reads `getBuildLabel(){return formatBuildLabel(getAppVersion(),"42.2","a1b2c3d");}`, the names match the workflow's.

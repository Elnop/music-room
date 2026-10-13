---
title: 'Build the APK and publish a GitHub Release on every push to main'
type: 'feature'
ticket: ''
created: '2026-10-12'
status: 'built'
baseline_revision: '9d2d8c68b01ca4be5b127403e530b6126c1b905c'
route: 'oneshot'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: [quick]
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The backend redeploys on every push to `main` (Coolify), but the Android APK is built by hand (`mobile/Dockerfile.android-build`), so there is no fixed place to download the build that talks to production (GitHub issue #264).

**Approach:** A GitHub Actions workflow, triggered by a push to `main` (and by hand), builds the release APK the way `mobile/Dockerfile.android-build` does (`expo prebuild` + `gradlew assembleRelease`), pointed at `https://zumik.cluzhub.com`, signed with the committed `mobile/keystores/debug.keystore`, with the other `EXPO_PUBLIC_*` values from GitHub Actions secrets. On `main` it publishes a GitHub Release with a unique tag, the APK attached and generated notes; on any other ref it uploads the APK as a workflow artifact only.

</frozen-after-approval>

## Implementation Notes

Oneshot: one new workflow file plus a short README section, under 100 lines.

- Repo default branch is `develop`, so `workflow_dispatch` is available once merged there; a manual run on `develop` tests the build without creating a release.
- Expo's prebuild template signs `release` with `signingConfigs.debug`, and `plugins/withDebugKeystore.js` puts `keystores/debug.keystore` there: the Google-registered SHA-1, no signing secret.
- HTTPS backend: `scripts/generate-network-config.sh` (cleartext allowlist) is not needed.
- `EXPO_PUBLIC_*` are passed as job environment variables; Expo inlines `process.env.EXPO_PUBLIC_*` at bundle time (`bundleRelease` during `assembleRelease`). No `.env` file is written.
- Actions pinned by SHA like `ci.yml`: setup-java v6.0.1, upload-artifact v7.0.1 (v7.0.2 is 5 days old).

## Verification

**Commands:**
- `actionlint .github/workflows/release-apk.yml` (or `npx --yes action-validator`) -- expected: no errors
- After merge into `develop`: `gh workflow run release-apk.yml --ref develop` -- expected: run succeeds and uploads an `app-release.apk` artifact

## Review Triage Log

- medium, patched: a re-run keeps `GITHUB_RUN_NUMBER`, so `gh release create` failed on an existing tag. Tag gets `.<run_attempt>` when the attempt is above 1.

Verified on GitHub with a temporary branch trigger (run 38304736641, reverted): build green in ~15 min, release step skipped off `main`, artifact `zumik-v1.0.0-build.1.apk` (40 MB) signed with SHA-1 `5D:26:8F:…:71:C0` = `keystores/debug.keystore`, bundle holds `https://zumik.cluzhub.com`, `wss://zumik.cluzhub.com` and the hosted Supabase URL.

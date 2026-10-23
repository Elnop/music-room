# Documentation

Everything a human needs to understand Zumik. Start with the [project README](../README.md) for what the app does and how to run it. The two projects have their own READMEs next to their code: [backend/README.md](../backend/README.md) and [mobile/README.md](../mobile/README.md). The API reference is Swagger UI at http://localhost:3000/api-docs.

## Subject

- [subject/en.subject.pdf](subject/en.subject.pdf) - The 42 subject "Music Room" v5.3; it overrides every other document.
- [subject/coverage.md](subject/coverage.md) - Each mandatory requirement and where the code meets it.

## Architecture

- [architecture/overview.md](architecture/overview.md) - The pieces (app, backend, Socket.io, Supabase, Redis, SoundCloud) and how a request flows.
- [architecture/code-layout.md](architecture/code-layout.md) - How the backend and mobile code are organized, and the rules that keep it that way.
- [architecture/redis.md](architecture/redis.md) - Every Redis key, threshold and command; production settings.
- [decisions.md](decisions.md) - Why each technology was chosen over its alternatives, and the smaller decisions taken along the way.

## Features

- [features/accounts-auth.md](features/accounts-auth.md) - Sign-up, sign-in, sessions, password reset, linked Google/Facebook accounts, profile privacy.
- [features/playlist-editor.md](features/playlist-editor.md) - Collaborative playlists: rights, editing, real time.
- [features/playlist-concurrency.md](features/playlist-concurrency.md) - How concurrent track moves, adds and removes stay consistent.
- [features/control-delegation.md](features/control-delegation.md) - Devices, per-device licenses, remote play/pause.
- [features/queue-and-connect.md](features/queue-and-connect.md) - The play queue, delegated queue access, moving playback between devices.
- [features/mobile-api.md](features/mobile-api.md) - The API contract, its generated documentation, and the app's API client.

## Security

- [security/threat-model.md](security/threat-model.md) - Every threat, its protection, its test, or the accepted risk.
- [security/containers.md](security/containers.md) - What the Docker images and containers actually do.
- [security/security-testing.md](security/security-testing.md) - How to test the protections by hand.

## Development

- [development/testing.md](development/testing.md) - Test strategy, mocks, single-test commands.
- [development/quality-and-ci.md](development/quality-and-ci.md) - `npm run check`, the pre-commit hook and the CI.
- [development/tunnel-mode.md](development/tunnel-mode.md) - Running the app on a phone on another network.
- [development/demo-accounts.md](development/demo-accounts.md) - The demo accounts and playlists of the local stack.
- [../tests/performance/README.md](../tests/performance/README.md) - Load tests (`make perf-test`).

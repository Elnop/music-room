# Container security - Zumik

What the project's images and containers actually do: base images, stages, users, ports, and what runs as root. Application threats (bruteforce, session theft, data isolation, real time) are in [threat-model.md](threat-model.md).

Sources: `backend/Dockerfile`, `mobile/Dockerfile`, `mobile/Dockerfile.android-build`, `make/helpers/docker.mk`, `make/config.mk`, `scripts/build-apk-docker.sh`, and the `.dockerignore` files (root, `backend/`, `mobile/`).

## No compose file

The repository has no `docker-compose.yml`. Containers are started by `docker run` from `make/helpers/docker.mk` (functions `start_redis`, `start_backend`, `start_backend_tunnel`, `start_mobile`), with `DOCKER_BUILDKIT=0` (`make/config.mk`, Docker API 1.42 compatibility). The three containers share the `zumik-network` network.

## Base images

| Image | Base | Version |
|-------|------|---------|
| `backend/Dockerfile` | `node:22-bookworm-slim` | tag, no digest: the Node and Debian patch level follows the tag's latest build |
| `mobile/Dockerfile` | `node:22-bookworm-slim` | same |
| `mobile/Dockerfile.android-build` | `node:22-bookworm-slim` | same |
| Redis (no Dockerfile) | `redis:7-alpine` (`REDIS_IMAGE`) | same |

These are the official Docker Hub images, not Chainguard or distroless images: they contain a shell and a package manager, and their CVEs depend on the build date. No scan (Trivy, Docker Scout) runs in CI. To run one by hand: `trivy image music-room-backend:latest`.

## Backend (`backend/Dockerfile`)

Four stages:

| Stage | Base | Content | User |
|-------|------|---------|------|
| `base` | `node:22-bookworm-slim` (glibc: `@ast-grep/cli` has no musl binary) | `WORKDIR /app`, copy of `package*.json` | root |
| `development` | `base` | `npm ci --include=dev` with the image's npm 10, then `npm cache clean --force` in the same layer (no npm cache in the image), copy of the code, `EXPOSE 3000`, `CMD ["npm", "run", "dev"]` | **root** (no `USER`) |
| `builder` | `base` | same installs, copy of the code, `npm run build` | root (build stage) |
| `production` | `node:22-bookworm-slim` | copies `package*.json`, `node_modules` and `dist` from `builder`; creates the `nodejs` group and user (uid/gid 1001); `chown -R nodejs:nodejs /app`; `EXPOSE 3000`; `CMD ["node", "dist/server.js"]` | `nodejs` (1001) |

What is actually used: `make` only builds `--target development` (`build_backend_image`). The `production` stage is built by no `make` command and not by CI. If it is used:
- `node_modules` comes from `builder`, installed with `--include=dev` and without `npm prune`: dev dependencies are in the image;
- `/app` belongs to `nodejs`, so the code can be modified by the process that runs it.

`backend/.dockerignore` excludes every `.env*` file from the build context (including `.env.test`, written by `backend/scripts/test-db.sh` with the local Supabase stack's keys, and `.env.example`), `node_modules`, `dist`, the tests and `*.md`: no environment file is copied into the image (#207).

### `zumik-backend` container (`start_backend`)

- Image `music-room-backend:latest` (`development` stage), hence **root inside the container**.
- `-v backend/:/app`: the host code is mounted read-write; a file created by the container on this mount belongs to root on the host. `node_modules` is the named volume `music-room-backend-node-modules`, labelled `zumik.image=<image id>` and recreated when the image changes (`node_modules_volume`): it hides the host's `node_modules` and is reused across restarts instead of being copied again from the image.
- `-v tunnel-info:/tmp/shared`: volume shared with the mobile container (tunnel URL).
- `--env-file backend/.env`: secrets (Supabase service key, etc.) are passed as environment variables, visible through `docker inspect`. No `.env*` file is in the image (see above).
- `-e NODE_ENV=development`: in this mode the backend also accepts `exp://` origins and https subdomains of the ngrok domains (`isOriginAllowed` / `isNgrokOrigin`, `backend/src/shared/config/cors.config.ts`, #209). An ngrok subdomain comes with a free account: an accepted dev risk (L11 in [threat-model.md](threat-model.md)).
- `-p 3000:3000` on every host interface (required: the phone calls the host's IP on the local network, over HTTP).
- No restart policy: after a machine or Docker restart, the backend stays stopped until the next `make dev-docker`. Containers are removed with `docker rm -v`, which also drops their anonymous volumes.
- Tunnel mode (`start_backend_tunnel`, `make dev-tunnel`): additionally `-p 4040:4040` (ngrok web interface, on every interface), command `sh scripts/start-with-tunnel.sh`. With `SUPABASE_MODE=local`, the same `--env-file backend/.env.supabase.local` and `SUPABASE_URL`/`SMTP_HOST` on `host.docker.internal` as `start_backend`. Only the backend is exposed through the tunnel: the local Supabase stack is not relayed (the `/supabase/auth/v1` relay of #251 was removed with #376), and the mobile container receives no Supabase value.

## Mobile (`mobile/Dockerfile`)

A single stage, `node:22-bookworm-slim`, Expo development server (no production build). No global npm package: `start-expo.sh` runs the project's own `expo`, and `@expo/ngrok` is a dependency of `mobile/package.json`.

| Instruction | User |
|-------------|------|
| creation of `/tmp/shared`, `/app` and `/app/.expo`, `chown node:node` | root |
| `npm ci` (committed lockfile) then `npm cache clean --force`, copy of the code | `node` |
| run: `CMD ["sh", "scripts/start-expo.sh"]` (`npx expo start --offline --port 8081`) | **`node`** (uid 1000 of the official image) |

`EXPOSE 8081 19000 19001 19002` (Metro and Expo DevTools). `ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0` and `REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0`. `ENTRYPOINT []`. `mobile/.dockerignore` excludes every `.env*` file, `node_modules`, `android/`, `ios/`, `*.keystore`, the tests and `*.md`: no environment file is copied into the image.

### `zumik-mobile` container (`start_mobile`)

- `-p 8081:8081 -p 19000:19000 -p 19001:19001 -p 19002:19002` on every host interface: Metro serves the app's JavaScript bundle to anyone who reaches the host. This bundle contains the `EXPO_PUBLIC_*` variables (backend URL, public OAuth identifiers); they are public by nature (they are also in the APK). It no longer contains any Supabase value since #376 ([threat-model.md](threat-model.md#m8-direct-supabase-access-with-the-anon-key)).
- `-v mobile/:/app`, named volume `music-room-mobile-node-modules` on `/app/node_modules` (same mechanism as the backend), anonymous volume `/app/.expo`, `-v tunnel-info:/tmp/shared`. No restart policy.
- `--env-file mobile/.env` (not in the image), plus `REACT_NATIVE_PACKAGER_HOSTNAME=<host IP>`, `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WS_URL` (`http://` and `ws://` to the host IP, port 3000).
- `-it`.

## APK build (`mobile/Dockerfile.android-build`)

Build image, started by `scripts/build-apk-docker.sh` (`make build-apk-docker`), never by `make dev-*`.

- Base `node:22-bookworm-slim`. **No `USER`: everything runs as root**, installation and build alike.
- Installs through `apt-get --no-install-recommends`: `openjdk-17-jdk-headless`, `build-essential`, `python3`, `git`, `curl`, `wget`, `unzip`, `ca-certificates`. No global npm package.
- Downloads the Android tools (`commandlinetools-linux-9477386_latest.zip`, `platform-tools-latest-linux.zip`) from `dl.google.com` with `wget`, without checksum verification, and accepts the licenses (`yes | sdkmanager --licenses`).
- Build context: the repository root. The root `.dockerignore` excludes `**/.env*`, `**/node_modules` and `.git`. Copies `mobile/` into `/app` and `scripts/` into `/scripts`.
- `npm ci --ignore-scripts && npm run postinstall && npm cache clean --force`: a failing `patch-package` stops the build.
- `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_WS_URL`: `ARG` with a dummy value, replaced at `docker run` by the tunnel URL; `NODE_ENV=production`.
- No `EXPOSE`. `CMD ["bash", "/build.sh"]`: `expo prebuild`, `scripts/generate-network-config.sh` (cleartext HTTP allowed for `localhost`, `10.0.2.2`, `127.0.0.1` and the tunnel domain), `./gradlew assembleRelease` with `--max-workers=${GRADLE_WORKERS:-2}` (the 2 GB heap comes from the generated `gradle.properties`); `REACT_NATIVE_ARCHITECTURES` (passed by `make build-apk-docker REACT_NATIVE_ARCHITECTURES=arm64-v8a`) limits the ABIs.
- `-v zumik-gradle-cache:/root/.gradle`: Gradle's dependencies and wrapper are kept between builds.
- `docker run --rm -v <output>:/output`: the APK is copied into `/output` by root, so it belongs to root on the host.

## Redis (`start_redis`)

- `redis:7-alpine`, `redis-server --appendonly yes`, volume `redis-data:/data`, `--restart unless-stopped`.
- `-p 127.0.0.1:6379:6379`: published on the loopback only. The containerized backend reaches it through the Docker network (`REDIS_HOST=zumik-redis`), `make dev-local` and `redis-cli` through `localhost` (`make backend-local` reads `REDIS_HOST` from `backend/.env`, `redis` by default: set it to `localhost`); another machine on the network can no longer reach it. Still **without a password** (`REDIS_PASSWORD` empty in `backend/.env.example`, no `--requirepass`): a host process or a container on the Docker network can read and clear the rate-limiting counters, the locks, the IP blacklist and the revocation list. A Redis container created before this change and still running keeps the old publication, even after `make redis-restart` or a machine reboot (`--restart unless-stopped`): delete it (`docker rm -f zumik-redis`) so that `make` recreates it; a stopped container is recreated by `make`. Gap L8 of the [threat model](threat-model.md#open-gaps), fixed by #205 (remaining: no password). Production recommendations (password, unpublished port, memory): [redis.md](../architecture/redis.md#redis-in-production).

### What Redis protects

All of the backend's anti-abuse code is in one module, `backend/src/shared/security/`, and reaches Redis only through `counter.ts` (fixed-window counters and flags, atomic Lua scripts): HTTP limiters (`http-rate-limit.ts`, store `rate-limit-store.ts`), attempt counters for codes and resends (`attempt-limit.ts`, `password-reset-limit.ts`), account lockout and IP blacklist (`account-lockout.ts`, `ip-reputation.ts`, `account-lockout.middleware.ts`), token verification failures per IP (`token-verify-limit.ts`). Without Redis, the HTTP limiters and the attempt counters fail closed (503), the lockout and the blacklist let requests through (`fail-open.ts`); nothing is ever counted in memory. The one intended exception: the per-socket, per-event limit (`socket-event-limit.ts`) is in memory, specific to each connection. Keys, thresholds and behavior without Redis: [redis.md](../architecture/redis.md#the-anti-abuse-module); threats covered: [threat-model.md](threat-model.md). Passwordless access to the dev Redis therefore allows clearing these counters (see above).

## What runs as root

| Container or stage | Root at runtime |
|--------------------|-----------------|
| `zumik-backend` (`development`) | yes |
| backend `production` (unused) | no (`nodejs`, 1001) |
| `zumik-mobile` | no (`node`); the build's `npm install -g` and `chown` run as root |
| APK build | yes, build and run |
| `zumik-redis` | no: the official image runs `redis-server` as the `redis` user |

## Limits of this setup

It is a development setup: no image is published or deployed, and no container has `--read-only`, `--cap-drop` or a memory or CPU limit. The deviations found (root in `zumik-backend`, ports published on every interface, Redis without a password, downloads without checksum, unpinned versions) are observations, not validated choices; those affecting application security are tracked in [threat-model.md](threat-model.md#open-gaps).

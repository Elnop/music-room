# Sécurité des conteneurs - Zumik

Ce que font réellement les images et les conteneurs du projet : images de base, étapes, utilisateurs, ports, et ce qui tourne en root. Les menaces applicatives (bruteforce, vol de session, isolation des données, temps réel) sont dans [THREAT_MODEL.md](THREAT_MODEL.md).

Sources : `backend/Dockerfile`, `mobile/Dockerfile`, `mobile/Dockerfile.android-build`, `make/helpers/docker.mk`, `make/config.mk`, `scripts/build-apk-docker.sh`, et les `.dockerignore` (racine, `backend/`, `mobile/`).

## Pas de fichier compose

Le dépôt n'a pas de `docker-compose.yml`. Les conteneurs sont lancés par `docker run` depuis `make/helpers/docker.mk` (fonctions `start_redis`, `start_backend`, `start_backend_tunnel`, `start_mobile`), avec `DOCKER_BUILDKIT=0` (`make/config.mk`, compatibilité Docker API 1.42). Les trois conteneurs partagent le réseau `zumik-network`.

## Images de base

| Image | Base | Version |
|-------|------|---------|
| `backend/Dockerfile` | `node:22-alpine` | tag, pas de digest : le patch de Node et d'Alpine suit le dernier build du tag |
| `mobile/Dockerfile` | `node:22-bookworm-slim` | idem |
| `mobile/Dockerfile.android-build` | `node:22-bookworm` | idem |
| Redis (pas de Dockerfile) | `redis:7-alpine` (`REDIS_IMAGE`) | idem |

Ce sont les images officielles Docker Hub, pas des images Chainguard ni distroless : elles contiennent un shell et un gestionnaire de paquets, et leurs CVE dépendent de la date du build. Aucun scan (Trivy, Docker Scout) ne tourne en CI. Pour en lancer un à la main : `trivy image music-room-backend:latest`.

## Backend (`backend/Dockerfile`)

Quatre étapes :

| Étape | Base | Contenu | Utilisateur |
|-------|------|---------|-------------|
| `base` | `node:22-alpine` | `WORKDIR /app`, copie de `package*.json` | root |
| `development` | `base` | `npm install -g npm@11.7.0`, `npm install --include=dev`, copie du code, `EXPOSE 3000`, `CMD ["npm", "run", "dev"]` | **root** (aucun `USER`) |
| `builder` | `base` | mêmes installations, copie du code, `npm run build` | root (étape de build) |
| `production` | `node:22-alpine` | copie depuis `builder` de `package*.json`, `node_modules` et `dist` ; crée le groupe et l'utilisateur `nodejs` (uid/gid 1001) ; `chown -R nodejs:nodejs /app` ; `EXPOSE 3000` ; `CMD ["node", "dist/server.js"]` | `nodejs` (1001) |

Ce qui sert vraiment : `make` construit seulement `--target development` (`build_backend_image`). L'étape `production` n'est construite par aucune commande `make` ni par la CI. Si on l'utilise :
- `node_modules` vient de `builder`, installé avec `--include=dev` et sans `npm prune` : les dépendances de dev sont dans l'image ;
- `/app` appartient à `nodejs`, donc le code est modifiable par le processus qui l'exécute.

`backend/.dockerignore` exclut du contexte de build `.env`, `.env.local`, `.env.*.local`, `node_modules`, `dist`, les tests et `*.md`. Les autres fichiers d'environnement ne sont pas exclus : `COPY . .` copie `backend/.env.example` (valeurs fictives) et, s'il existe, `backend/.env.test` dans les étapes `development` et `builder`. `.env.test` est écrit par `backend/scripts/test-db.sh` et contient les clés anon et service de la stack Supabase **locale** de test : il se retrouve dans l'image (#207).

### Conteneur `zumik-backend` (`start_backend`)

- Image `music-room-backend:latest` (étape `development`), donc **root dans le conteneur**.
- `-v backend/:/app` : le code de l'hôte est monté en écriture ; un fichier créé par le conteneur sur ce montage appartient à root sur l'hôte. `node_modules` est un volume anonyme (`-v /app/node_modules`).
- `-v tunnel-info:/tmp/shared` : volume partagé avec le conteneur mobile (URL du tunnel).
- `--env-file backend/.env` : les secrets (clé service Supabase, etc.) sont passés en variables d'environnement, visibles par `docker inspect`. `backend/.env` n'est pas dans l'image, mais `backend/.env.test` y est (voir ci-dessus, #207).
- `-e NODE_ENV=development` : dans ce mode, le backend accepte toute origine `ngrok` ou `exp://` (`isOriginAllowed`, `backend/src/shared/config/cors.config.ts`).
- `-p 3000:3000` sur toutes les interfaces de l'hôte (nécessaire : le téléphone appelle l'IP de l'hôte sur le réseau local, en HTTP).
- `--restart unless-stopped`.
- Mode tunnel (`start_backend_tunnel`, `make dev-tunnel`) : en plus `-p 4040:4040` (interface web de ngrok, sur toutes les interfaces), `TUNNEL_MODE=true`, commande `sh scripts/start-with-tunnel.sh`.

## Mobile (`mobile/Dockerfile`)

Une seule étape, `node:22-bookworm-slim`, serveur de développement Expo (pas de build de production) :

| Instruction | Utilisateur |
|-------------|-------------|
| `npm install -g expo-cli @expo/ngrok` (versions non fixées) | root |
| création de `/tmp/shared` et `/app`, `chown node:node` | root |
| `npm install`, copie du code | `node` |
| création de `/app/.expo`, `chown` | root |
| `chmod +x scripts/*.sh` | `node` |
| exécution : `CMD ["sh", "scripts/start-expo.sh"]` (`npx expo start --offline --port 8081`) | **`node`** (uid 1000 de l'image officielle) |

`EXPOSE 8081 19000 19001 19002` (Metro et Expo DevTools). `ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0` et `REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0`. `ENTRYPOINT []`. `mobile/.dockerignore` exclut `.env`, `.env.local`, `.env.*.local`, `node_modules`, `android/`, `ios/`, `*.keystore`, les tests et `*.md` ; `mobile/.env.example` (valeurs fictives) est donc copié dans l'image, comme tout autre `.env.*` qui ne finit pas par `.local` (#207).

### Conteneur `zumik-mobile` (`start_mobile`)

- `-p 8081:8081 -p 19000:19000 -p 19001:19001 -p 19002:19002` sur toutes les interfaces de l'hôte : Metro sert le bundle JavaScript de l'app à quiconque atteint l'hôte. Ce bundle contient les variables `EXPO_PUBLIC_*`, dont l'URL et la clé anon Supabase ; elles sont publiques par nature (elles sont aussi dans l'APK), c'est la RLS qui doit protéger la base ([THREAT_MODEL.md](THREAT_MODEL.md#m8-accès-direct-à-supabase-avec-la-clé-anon)).
- `-v mobile/:/app`, volumes anonymes `/app/node_modules` et `/app/.expo`, `-v tunnel-info:/tmp/shared`.
- `--env-file mobile/.env` (pas dans l'image), plus `REACT_NATIVE_PACKAGER_HOSTNAME=<IP de l'hôte>`, `EXPO_PUBLIC_API_URL` et `EXPO_PUBLIC_WS_URL` (`http://` et `ws://` vers l'IP de l'hôte, port 3000).
- `--restart unless-stopped`, `-it`.

## Build de l'APK (`mobile/Dockerfile.android-build`)

Image de build, lancée par `scripts/build-apk-docker.sh` (`make build-apk-docker`), jamais par `make dev-*`.

- Base `node:22-bookworm`. **Aucun `USER` : tout tourne en root**, installation comme build.
- Installe par `apt-get` : `openjdk-17-jdk`, `build-essential`, `git`, `curl`, `wget`, `unzip`, `bash`, `coreutils`.
- `npm install -g npm@10.3.0`, puis `eas-cli` (version non fixée), `@expo/ngrok@^4.1.0`, `sharp-cli@^2.1.0` ; Yarn via `corepack` (`yarn@stable`).
- Télécharge les outils Android (`commandlinetools-linux-9477386_latest.zip`, `platform-tools-latest-linux.zip`) depuis `dl.google.com` par `wget`, sans vérification de somme de contrôle, et accepte les licences (`yes | sdkmanager --licenses`).
- Contexte de build : la racine du dépôt. Le `.dockerignore` racine exclut `**/.env`, `**/node_modules` et `.git`. Copie `mobile/` dans `/app` et `scripts/` dans `/scripts`.
- `npm install --ignore-scripts && npm run postinstall || true` : un échec de cette ligne n'arrête pas le build.
- `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_WS_URL` : `ARG` avec une valeur fictive, remplacés au `docker run` par l'URL du tunnel ; `NODE_ENV=production`.
- Pas de `EXPOSE`. `CMD ["bash", "/build.sh"]` : `expo prebuild`, `scripts/generate-network-config.sh` (HTTP en clair autorisé pour `localhost`, `10.0.2.2`, `127.0.0.1` et le domaine du tunnel), `./gradlew assembleRelease`.
- `docker run --rm -v <sortie>:/output` : l'APK est copié dans `/output` par root, donc il appartient à root sur l'hôte.

## Redis (`start_redis`)

- `redis:7-alpine`, `redis-server --appendonly yes`, volume `redis-data:/data`, `--restart unless-stopped`.
- `-p 6379:6379` sur toutes les interfaces de l'hôte, **sans mot de passe** (`REDIS_PASSWORD` vide dans `backend/.env.example`, pas de `--requirepass`). Toute machine qui atteint l'hôte peut lire et effacer les compteurs de rate limiting, les verrous de compte, la liste noire d'IP et la liste de révocation des tokens. Lacune L8 du [modèle de menaces](THREAT_MODEL.md#lacunes-ouvertes). Les recommandations de production sont dans [REDIS.md](REDIS.md#redis-in-production) ; ses exemples sont écrits pour Docker Compose, que le projet n'utilise plus (#210).

## Ce qui tourne en root

| Conteneur ou étape | Root à l'exécution |
|--------------------|--------------------|
| `zumik-backend` (`development`) | oui |
| backend `production` (non utilisé) | non (`nodejs`, 1001) |
| `zumik-mobile` | non (`node`) ; les `npm install -g` et `chown` du build sont en root |
| build de l'APK | oui, build et exécution |
| `zumik-redis` | non : l'image officielle lance `redis-server` sous l'utilisateur `redis` |

## Limites de cette configuration

C'est une configuration de développement : aucune image n'est publiée ni déployée, et aucun conteneur n'a `--read-only`, `--cap-drop` ni limite de mémoire ou de CPU. Les écarts relevés (root dans `zumik-backend`, ports publiés sur toutes les interfaces, Redis sans mot de passe, téléchargements sans somme de contrôle, versions non fixées) sont des constats, pas des choix validés ; ceux qui touchent la sécurité de l'application sont suivis dans [THREAT_MODEL.md](THREAT_MODEL.md#lacunes-ouvertes).

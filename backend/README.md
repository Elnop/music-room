# Zumik Backend

Backend pour l'application Zumik - Plateforme collaborative d'écoute musicale avec streaming intégré.

## 🏗️ Architecture

Ce projet utilise une **architecture feature-first** (colocation par feature) :

```
backend/
├── src/
│   ├── features/
│   │   ├── auth/           # Inscription, login, refresh, OAuth Google/Facebook, vérif email, reset password
│   │   ├── friends/        # Follow / unfollow, statut, stats
│   │   ├── mail/           # Emails transactionnels (Gmail SMTP ou Mailpit en dev, nodemailer)
│   │   ├── music-control/  # Délégation du contrôle de lecture à des amis
│   │   ├── playlists/      # Playlists, tracks, collaborateurs, viewers
│   │   ├── profile/        # Profil, confidentialité, préférences musicales
│   │   └── soundcloud/     # Recherche, détails de track, URLs de stream
│   ├── realtime/
│   │   └── index.ts        # Serveur Socket.io (playlists, écoute, contrôle)
│   ├── shared/
│   │   ├── config/         # env, Supabase, Redis, Swagger, rate limits, montage des routes (routes.ts)
│   │   ├── middleware/     # error handler, action logger (HTTP + socket)
│   │   ├── services/       # rate limiter, anti-bruteforce (Redis)
│   │   ├── types/          # Types globaux + supabase.generated.ts (généré : make generate-types)
│   │   └── utils/          # logger, database.helpers.ts
│   └── server.ts           # Point d'entrée Express + Socket.io
├── migrations/             # Migrations SQL (stack locale : make supabase-up ; hébergé : à la main dans le dashboard)
├── scripts/dev-db.sh       # Stack Supabase locale de dev (make supabase-up/down/reset)
└── supabase-dev/           # Config CLI de la stack de dev (music-room-dev, ports 544xx)
```

## 🚀 Quick Start

### 1. Setup initial

```bash
make setup
```

Cette commande va :

- Installer les dépendances npm
- Créer le fichier `.env` depuis `.env.example`

### 2. Supabase : stack locale (par défaut) ou projet hébergé

`SUPABASE_MODE` (variable make, `local` par défaut) choisit la base utilisée par `make dev-docker`, `make dev-local` et `make generate-types`. Toute autre valeur que `local` ou `hosted` arrête make avant de lancer quoi que ce soit.

**`SUPABASE_MODE=local` (par défaut)** : une stack Supabase locale, `music-room-dev`, qui garde ses données. Aucune clé hébergée n'est nécessaire : `.env` peut rester la copie de `.env.example`.

| Commande | Effet |
| --- | --- |
| `make supabase-up` | Démarre la stack (Postgres, PostgREST, Auth, Kong, Mailpit), applique les fichiers de `migrations/` pas encore appliqués, écrit `.env.supabase.local` |
| `make supabase-down` | Arrête la stack ; les données restent |
| `make supabase-reset` | Vide la base et réapplique toutes les migrations |
| `make logs-supabase` | Suit les logs de la stack (préfixes `[SB-DB]`, `[SB-AUTH]`, `[SB-REST]`, `[SB-KONG]`, `[SB-MAIL]`) ; `make logs` les inclut en mode local |

- Script : `scripts/dev-db.sh` ; config CLI : `supabase-dev/supabase/config.toml` (workdir séparé de `supabase/`, qui sert à la stack de test `music-room-test`).
- Ports 544xx : API `http://127.0.0.1:54421`, Postgres `127.0.0.1:54422`, Mailpit `http://127.0.0.1:54424` (interface web) et `54425` (SMTP). La stack de test (554xx) et `make test-int` n'y touchent pas.
- Migrations suivies dans `zumik_dev.applied_migrations` (hors `public`) : chaque fichier tourne dans une transaction avec sa ligne de suivi ; un fichier en échec est nommé et rien n'en reste. Pas de `db reset` dans `supabase-up`.
- `.env.supabase.local` (git-ignoré, clés locales de démo) contient `SUPABASE_URL=http://<IP LAN>:54421`, les clés anon et service, et `SMTP_HOST`/`SMTP_PORT` (Mailpit). `make dev-docker` le passe au conteneur backend en second `--env-file` (il l'emporte sur `.env` ; seuls `SUPABASE_URL` et `SMTP_HOST` sont remplacés, voir plus bas) et écrit l'URL et la clé anon dans `mobile/.env.development.local` (`EXPO_PUBLIC_SUPABASE_*`). `make dev-local`, `make backend-local` et `make perf-fixtures` exportent les mêmes valeurs avec `localhost`. Les cibles qui lancent le backend ou écrivent dans la base (`dev-docker`, `dev-local`, `backend-docker`, `backend-local`, `perf-fixtures`, `generate-types`) lancent d'abord `supabase-up` ; `expo-android` et `expo-clear` (Metro seul) reprennent les clés de `.env.supabase.local` sans démarrer la stack.
- Un conteneur backend ou mobile lancé dans l'autre mode (label `zumik.supabase`) est recréé par `make dev-docker`.
- `make generate-types` applique d'abord les migrations (`supabase-up`), génère les types depuis la stack locale (sans login ni project ID), les formate avec Prettier et signale tout écart avec le fichier commité.
- `make dev-tunnel` ne gère pas encore la stack locale (un téléphone sur un autre réseau ne la joint pas) : utilisez `SUPABASE_MODE=hosted make dev-tunnel`.
- Google et Facebook : `config.toml` déclare `[auth.external.google]` et `[auth.external.facebook]` avec `GOOGLE_CLIENT_ID`, `FACEBOOK_APP_ID` et `FACEBOOK_APP_SECRET` lus dans `.env`. Le flux actuel ne s'en sert pas : `oauth.service.ts` vérifie lui-même les tokens et crée les comptes via `auth.admin`. Il marche en local tant que ces variables sont renseignées (build de développement requis).
- Chaque développeur part d'une base vide ; les données du projet hébergé ne sont pas copiées.
- Emails : en mode local, le backend envoie ses emails (code de vérification, reset du mot de passe) au Mailpit de la stack au lieu de Gmail, sans identifiants. Ils s'affichent sur http://localhost:54424 ; rien ne part vers de vraies adresses. `GMAIL_USER` reste l'expéditeur affiché. En mode hosted, `SMTP_HOST` n'est pas défini et Gmail sert.
- Sécurité : la stack écoute sur toutes les interfaces (54421 pour l'API, 54422 pour Postgres, 54424 et 54425 pour Mailpit), car le téléphone la joint par l'IP LAN et la CLI Supabase (2.119) ne permet pas de choisir l'adresse d'écoute. Le login Postgres `postgres`/`postgres` et la clé service-role de démo sont publics : n'importe qui sur le même réseau peut lire et modifier la base, et lire les codes reçus dans Mailpit. Elle ne doit contenir que des données de dev locales.
- `make dev-docker` donne au conteneur backend `SUPABASE_URL=http://host.docker.internal:54421` et `SMTP_HOST=host.docker.internal` (passerelle de l'hôte), qui reste valide quand l'IP LAN change ; le fichier mobile garde l'IP LAN.

**`SUPABASE_MODE=hosted`** : le comportement d'avant, avec le projet dont l'URL et les clés sont dans `.env`. Aucune stack locale n'est lancée.

1. Créez un compte sur [supabase.com](https://supabase.com) et un projet "zumik"
2. Récupérez `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_KEY` dans Dashboard → Settings → API, et `SUPABASE_PROJECT_ID` dans l'URL du dashboard
3. Ajoutez-les dans `.env`, puis lancez par exemple `SUPABASE_MODE=hosted make dev-docker`

### 3. Migrations SQL

- Mode local : `make supabase-up` applique les nouveaux fichiers de `migrations/`.
- Projet hébergé : appliquez chaque nouveau fichier à la main (Dashboard → SQL Editor).

### 4. Lancer le serveur

```bash
make dev
```

Le serveur démarre sur `http://localhost:3000`

## 📚 API Documentation

Zumik provides interactive OpenAPI 3.0 documentation via Swagger UI.

### Accessing Documentation

- **Swagger UI:** http://localhost:3000/api-docs
- **OpenAPI Spec (JSON):** http://localhost:3000/api-docs.json

### Features

- **45 documented endpoints** across 6 features (Auth, Playlists, Profile, SoundCloud, Friends, Music Control)
- **Interactive testing** - Try endpoints directly from the browser
- **Request/Response examples** for all endpoints
- **Schema validation** with detailed parameter descriptions
- **Authentication support** - Built-in JWT Bearer token authorization

### Usage

1. Start backend: `make dev`
2. Open http://localhost:3000/api-docs
3. Register or login to get JWT token
4. Click "Authorize" button in Swagger UI
5. Paste token: `Bearer <your_token>`
6. Test endpoints with "Try it out"

### Documentation Architecture

Documentation is organized by feature with separate OpenAPI files:

- `features/auth/auth.openapi.ts` - 9 auth endpoints (register, login, OAuth, providers)
- `features/playlists/playlist.openapi.ts` - 14 playlist endpoints (CRUD, tracks, collaborators)
- `features/profile/profile.openapi.ts` - 9 profile endpoints (update, search, privacy, music preferences)
- `features/soundcloud/soundcloud.openapi.ts` - 4 SoundCloud endpoints (search, track details, stream)
- `features/friends/friends.openapi.ts` - 5 friends endpoints (follow, unfollow, stats)
- `features/music-control/music-control.openapi.ts` - 4 music control endpoints (grant/revoke permissions)

All specifications are merged in `shared/config/swagger.config.ts`.

### Export & Validation

```bash
# Export OpenAPI spec to JSON file
npm run swagger:export

# Validate OpenAPI spec
npm run swagger:validate

# Serve documentation with Redoc
npm run swagger:serve
```

### Import to Postman

1. Run `npm run swagger:export`
2. Import generated `openapi.json` in Postman
3. All endpoints, schemas, and examples will be available

**Satisfies project subject (IV.4):** ✅ API documentation with methods, inputs, outputs

## 📝 Commandes disponibles

```bash
make help          # Démarrage rapide et catégories (make emulator, make docker…)
make install       # Installer les dépendances
make dev           # Lancer en mode développement
make build         # Build pour production
make start         # Lancer en production
make type-check    # Vérifier les types TypeScript
make clean         # Nettoyer les artifacts
```

## 🔴 Redis Integration

Zumik utilise Redis pour le rate limiting et la protection brute force.

### Configuration

Redis se configure via les variables d'environnement dans `.env`:

```bash
# Connexion
REDIS_HOST=redis          # "redis" en Docker, "localhost" en local
REDIS_PORT=6379
REDIS_PASSWORD=           # Optionnel
REDIS_DB=0

# Rate Limiting (express-rate-limit)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_LOGIN_WINDOW_MS=900000     # 15 minutes
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_REGISTER_WINDOW_MS=3600000 # 1 heure
RATE_LIMIT_REGISTER_MAX=3
RATE_LIMIT_OAUTH_WINDOW_MS=900000
RATE_LIMIT_OAUTH_MAX=10
RATE_LIMIT_AUTH_WINDOW_MS=900000
RATE_LIMIT_AUTH_MAX=20
RATE_LIMIT_TOKEN_WINDOW_MS=900000     # échecs de vérification de token par IP
RATE_LIMIT_TOKEN_MAX=20
RATE_LIMIT_SOUNDCLOUD_WINDOW_MS=60000  # requêtes /api/soundcloud par utilisateur
RATE_LIMIT_SOUNDCLOUD_MAX=120

# Account Lockout (brute-force.service.ts)
ACCOUNT_LOCKOUT_ENABLED=true
ACCOUNT_LOCKOUT_THRESHOLD=5
ACCOUNT_LOCKOUT_DURATION_SOFT=900     # 15 min
ACCOUNT_LOCKOUT_DURATION_HARD=3600    # 1 heure
ACCOUNT_LOCKOUT_DURATION_SEVERE=86400 # 24 heures

# IP Reputation
IP_THROTTLE_THRESHOLD=10
IP_BLOCK_THRESHOLD=20
IP_BLACKLIST_THRESHOLD=50

# Whitelist IP (séparées par virgules)
RATE_LIMIT_WHITELIST_IPS=
```

**Note**: `RATE_LIMIT_FALLBACK_MEMORY` supprimée. Voir "Mode développement sans Redis" ci-dessous.

### Architecture Redis

#### Fichiers clés

- `src/shared/config/redis.ts` - Client Redis (ioredis) avec auto-reconnect
- `src/shared/config/rate-limit.config.ts` - Configuration centralisée
- `src/features/auth/middleware/rate-limit.middleware.ts` - Middlewares rate limiting
- `src/features/auth/middleware/account-lockout.middleware.ts` - Vérification lockout
- `src/features/auth/utils/token-verify-limiter.ts` - Limite des échecs de vérification de token par IP
- `src/features/auth/services/brute-force.service.ts` - Logique métier protection

#### Clés Redis utilisées

**Rate Limiting:**

```
rl:auth:login:{email}:{ip}       # Compteur login
rl:auth:register:{ip}            # Compteur register
rl:auth:oauth:{provider}:{ip}    # Compteur OAuth
rl:auth:global:{ip}              # Compteur global
rl:auth:token:{ip}               # Échecs de vérification de token (TTL = fenêtre)
```

**Brute Force Protection:**

```
failed_login:{email}:{ip}        # Compteur échecs (TTL 15min)
account_locked:{email}:{ip}      # Verrouillage (TTL dynamique)
ip_failed_logins:{ip}            # Compteur échecs IP (TTL 15min)
ip_blacklist:{ip}                # Blacklist IP (TTL 24h)
```

### Décision d'architecture : Pas de fallback in-memory

**Mode production** (Redis requis):
- Redis indisponible → Backend log erreurs mais continue
- Rate limiting désactivé (log ERROR)
- Account lockout désactivé (log WARNING)

**Mode développement** (Redis optionnel):
- `RATE_LIMIT_ENABLED=false` et `ACCOUNT_LOCKOUT_ENABLED=false`
- Toutes les protections bypassed
- Redis non requis

**Pourquoi pas de fallback ?**
Un fallback in-memory crée des vulnérabilités en multi-instance (load balancer) car chaque instance a son propre état. Redis-only garantit une protection cohérente.

**Mode développement sans Redis:**

```bash
# backend/.env
RATE_LIMIT_ENABLED=false
ACCOUNT_LOCKOUT_ENABLED=false
```

Ceci désactive **complètement** toutes les protections de sécurité pour permettre le développement local sans Redis

### Commandes utiles

```bash
# Démarrer Redis
make redis-start

# Vérifier la connexion
make redis-health

# Inspecter les données
make redis-shell

# Voir les statistiques
make redis-info
```

Voir [doc/REDIS.md](../doc/REDIS.md) pour la documentation complète.

### Testing en local

Pour tester le rate limiting localement:

```bash
# 1. Démarrer Redis
make redis-start

# 2. Démarrer backend
npm run dev

# 3. Tester avec curl (6+ requêtes)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -v 2>&1 | grep "HTTP/"
done
# La 6ème devrait retourner 429 (Rate Limit Exceeded)

# 4. Inspecter Redis
make redis-shell
> KEYS rl:*
> GET rl:auth:login:test@test.com:127.0.0.1
```

## 🔐 API Documentation

### Interactive Swagger UI

The backend exposes **45 REST endpoints** across 6 features with **interactive documentation** via Swagger UI.

**Access Swagger UI**:

```bash
# 1. Start backend
make dev-docker    # or make backend-local

# 2. Open browser
http://localhost:3000/api-docs
```

**Features**:

- Interactive endpoint testing with authentication
- Request/response schemas with examples
- Real-time validation
- JWT token management

**Endpoints by feature**:

- **Auth**: 7 endpoints (register, login, OAuth Google/Facebook, providers)
- **Playlists**: 13 endpoints (CRUD, tracks, collaborators, viewers)
- **Profile**: 4 endpoints (get, update, search users)
- **Friends**: 4 endpoints (follow, unfollow, list, check status)
- **Music Control**: 4 endpoints (grant, revoke, check permissions)
- **SoundCloud**: 3 endpoints (search, track details, stream URLs)

### Exemples rapides

**Register**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Test1234","username":"john_doe"}'
```

**Login**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Test1234"}'
```

**Get Current User**

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🛠️ Stack Technique

- **Runtime**: Node.js 20 (`Dockerfile`)
- **Framework**: Express 4 + TypeScript 5
- **Database / Auth**: Supabase (PostgreSQL + Supabase Auth, JWT)
- **Cache / rate limiting**: Redis (ioredis), sans fallback in-memory
- **Validation**: Zod
- **Temps réel**: Socket.io 4
- **Email**: nodemailer (Gmail SMTP ; Mailpit de la stack Supabase locale en dev)

## 📂 Structure d'une Feature

Chaque feature suit cette structure (pas de fichier `index.ts` : on importe directement le fichier source, via `@/features/...`, `@/shared/...` ou `@/realtime/...`, avec l'extension `.js`) :

```
features/<name>/
├── services/                  # Logique métier, découpée par responsabilité (~150 lignes max par service)
├── permissions/               # Contrôles d'autorisation (si besoin)
├── utils/                     # Helpers et formatters
├── middleware/                # Middleware spécifiques (si besoin)
├── <name>.types.ts            # Types TypeScript
├── <name>.validators.ts       # Schémas Zod
├── <name>.controller.ts       # Handlers Express
├── <name>.routes.ts           # Router Express
└── <name>.openapi.ts          # Documentation Swagger des endpoints
```

Ajouter une feature : types → validators → service → controller → routes → openapi, puis monter le router dans `src/shared/config/routes.ts`.

## 🗄️ Base de données

Tables Supabase utilisées par le backend :

- `user_profiles` : profil (username, display_name, avatar_url, bio, google_id, facebook_id)
- `profile_privacy` : visibilité par champ du profil (email, bio, avatar, préférences musicales) : `public`, `friends_only` ou `private`
- `music_preferences` : genres préférés (5 max)
- `playlists` : métadonnées (owner_id, visibility `public` / `private`, edit_mode `open` / `restricted`)
- `playlist_tracks` : tracks d'une playlist (position, added_by)
- `tracks` : données universelles d'un morceau ; `track_uri` contient le permalink SoundCloud
- `follows` : relations de follow, avec `can_control_music` pour la délégation

## 🛣️ Endpoints

Montés dans `src/shared/config/routes.ts`, documentés dans Swagger (`/api-docs`) :

| Préfixe | Endpoints |
|---|---|
| `/api/auth` | register, login, refresh, logout, me, OAuth google/facebook, providers (liste, unlink), verify-email, resend-verification, forgot-password, reset-password |
| `/api/profile` | profil (get, patch), search, privacy, music-preferences (+ genres), profil d'un autre user |
| `/api/playlists` | CRUD, publiques, par user, tracks (ajout, retrait, move `POST /:id/tracks/:trackId/move`), collaborateurs, viewers |
| `/api/friends` | liste, stats, statut, follow / unfollow |
| `/api/music-control` | permissions (liste, grant, revoke), can-control |
| `/api/soundcloud` | search, track, stream |
| `/health` | santé du serveur et de Redis (sans auth) |

**Limite des tokens invalides (#160)** : chaque route protégée (`authMiddleware`) et chaque handshake Socket.io vérifie le token auprès de Supabase. Les échecs (`INVALID_TOKEN`, `TOKEN_REVOKED`) sont comptés par IP dans Redis (`rl:auth:token:{ip}`, fenêtre fixe `RATE_LIMIT_TOKEN_WINDOW_MS`, 15 min par défaut). À `RATE_LIMIT_TOKEN_MAX` échecs (20 par défaut), l'IP est refusée sans appel à Supabase jusqu'à la fin de la fenêtre, pour tout token, valide ou non : toute route protégée répond alors `429 RATE_LIMIT_EXCEEDED` (avec `retryAfter`), une route à auth optionnelle (`optionalAuthMiddleware`) continue en anonyme, et le handshake est refusé avec `TOO_MANY_ATTEMPTS`. Les vérifications réussies ne sont jamais comptées. Même interrupteur et même whitelist que les autres limiteurs (`RATE_LIMIT_ENABLED`, `RATE_LIMIT_WHITELIST_IPS`) ; Redis non prêt : la limite ne bloque ni ne compte, et `verifyToken` répond déjà 503. Chaque vérification réserve un créneau avant d'appeler Supabase (rendu en cas de succès ou d'échec non compté) : au-delà de `RATE_LIMIT_TOKEN_MAX` vérifications simultanées depuis une IP, les suivantes reçoivent un 429 passager.

**IP partagée** : cette limite couvre toutes les routes protégées et la socket, par IP. Derrière une IP partagée (tunnel ngrok, reverse proxy sans `TRUST_PROXY`, NAT d'un réseau commun), les échecs d'un seul client bloquent tous les clients de cette IP, routes protégées et socket comprises, jusqu'à la fin de la fenêtre. Ajouter l'IP à `RATE_LIMIT_WHITELIST_IPS` ou configurer `TRUST_PROXY` si besoin.

**IP du client derrière un proxy (`TRUST_PROXY`, #173)** : toutes les limites par IP (auth, tokens, verrouillage, liste noire) lisent `req.ip`, et le handshake Socket.io la même IP (`clientIp`, `src/shared/config/trust-proxy.ts`). Par défaut (`TRUST_PROXY` vide), c'est l'adresse de la connexion et `X-Forwarded-For` est ignoré : un client ne peut pas choisir son IP. Derrière un reverse proxy ou un tunnel qui ajoute `X-Forwarded-For`, mettre le nombre de proxies (`TRUST_PROXY=1`) ou leurs adresses (`loopback`, `uniquelocal`, IP, sous-réseaux, séparés par des virgules), avec la syntaxe de `trust proxy` d'Express. Seulement si toutes les requêtes passent par ce proxy : sinon un client joignant le backend en direct peut forger son IP.

## ⚡ Temps réel (Socket.io)

Serveur : `src/realtime/index.ts`.

### Authentification du handshake

Toute connexion est authentifiée au handshake par `src/realtime/socket-auth.ts` (middleware `io.use`), qui documente le contrat. Le client passe dans `io(url, { auth: { ... } })` six chaînes obligatoires :

| Champ | Contenu |
| --- | --- |
| `token` | access token Supabase (JWT), vérifié par `SessionService.verifyToken` |
| `deviceId` | identifiant stable de l'appareil (1 à 128 caractères) |
| `deviceName` | nom de l'appareil |
| `platform` | plateforme (`ios`, `android`, ...) |
| `model` | modèle de l'appareil |
| `appVersion` | version de l'app |

Refus : `connect_error` dont le `message` vaut `NO_TOKEN` (pas de `token`), `INVALID_HANDSHAKE` (champ manquant ou pas une chaîne), `INVALID_TOKEN` (token invalide ou expiré), `TOO_MANY_ATTEMPTS` (trop d'échecs de vérification de token depuis cette IP, voir la limite des tokens invalides ci-dessus ; rafraîchir le token n'y change rien) ou `DEVICE_REGISTRATION_FAILED` (l'appareil n'a pas pu être enregistré ; Socket.io ne relance pas un refus, c'est le client qui réessaie). Accepté : l'appareil est enregistré dans `devices` avant l'acceptation (une ligne par utilisateur et `deviceId`, `last_seen_at` rafraîchi) et `socket.data` contient `{ userId, email, device, appVersion }`, l'identité venant uniquement du token ; l'appareil est enregistré pour le contrôle et la socket rejoint `user:<id>`. Le token n'est vérifié qu'à la connexion. `listening:update` prend l'appareil du handshake, jamais celui du payload.

### Events

- **Client → serveur** : `playlist:join`, `playlist:leave`, `listening:subscribe`, `listening:unsubscribe`, `listening:update`, `control:action`
- **Serveur → client** : `playlist:updated`, `playlist:error`, `listening:status`, `listening:error`, `permission:changed`, `control:command`, `control:success`, `control:error`

Les clients d'une playlist rejoignent la room `playlist:<id>` et reçoivent `playlist:updated` à chaque modification.

`playlist:join <id>` n'ajoute la socket à la room que si son utilisateur (`socket.data.userId`) peut voir la playlist (`canViewPlaylist` : publique, ou propriétaire / viewer / collaborateur), contrôle fait dans `src/realtime/playlist-room.ts`. Sinon la socket reçoit `playlist:error` `{ playlistId, code, message }` :

| `code` | Cas |
| --- | --- |
| `INVALID_PAYLOAD` | l'id n'est pas une chaîne UUID (`playlistId` vaut `null` si ce n'est pas une chaîne) |
| `PLAYLIST_NOT_FOUND` | playlist inconnue (ou lecture en base échouée), ou supprimée pendant que la socket était dans la room |
| `PLAYLIST_ACCESS_DENIED` | l'utilisateur ne peut pas voir la playlist, ou a perdu l'accès |
| `RATE_LIMITED` | trop de `playlist:join` / `playlist:leave` sur cette socket (voir Débit ci-dessous ; `playlistId` vaut `null`) |

L'accès est revérifié quand il peut se perdre : après le retrait d'un viewer ou d'un collaborateur, une mise à jour de la playlist (visibilité) ou sa suppression, les sockets de `playlist:<id>` sans accès quittent la room et reçoivent `playlist:error`. Un échec de cette revérification est seulement loggé.

#### Écoute et contrôle

`listening:subscribe <ownerId>` et `control:action` ne passent que si l'utilisateur de la socket et le propriétaire sont amis mutuels et que le propriétaire lui a ouvert l'interrupteur « tous mes appareils » (`follows.can_control_music`) ou une licence sur l'appareil (`device_control_licenses`) : sur l'appareil ciblé pour `control:action`, sur au moins un appareil pour `listening:subscribe`, qui montre alors le statut de tous les appareils du propriétaire (règle dans `features/music-control/services/control-access.service.ts` ; une erreur de base refuse). L'identité vient toujours de la socket : les champs en trop du payload (`fromUserId`, `controllerId`...) sont ignorés et `control:command.fromUserId` est l'utilisateur de la socket. Payloads validés par Zod dans `src/realtime/music-control-access.ts`, avant toute lecture en base :

| Event | Payload | Erreur |
| --- | --- | --- |
| `listening:subscribe` | id utilisateur (UUID) | `listening:error` |
| `listening:unsubscribe` | id utilisateur (UUID) | aucune pour un payload invalide (ignoré) ; `listening:error` `RATE_LIMITED` au-delà du débit |
| `listening:update` | `{ track: { id: number, title: string (≤ 300), artist: string (≤ 300), artworkUrl: string (≤ 2048) \| null } \| null, isPlaying: boolean }` | `listening:error` |
| `control:action` | `{ targetUserId: UUID, targetDeviceId: string (1-128), action: 'play' \| 'pause' }` | `control:error` |

Les erreurs ont la forme `{ message, code }` : `INVALID_PAYLOAD` (payload invalide), `NOT_AUTHORIZED` (pas le droit de contrôle), `DEVICE_OFFLINE` (`control:action` vers un appareil non connecté), `RATE_LIMITED` (débit dépassé).

**Débit (#204)** : chaque socket a un compteur par événement, en mémoire, sur une fenêtre fixe de 10 s : 20 `listening:update` ou `control:action`, 30 pour chacun des autres événements de l'app, un compteur commun pour tout autre nom (`src/realtime/event-rate-limit.ts`). Au-delà, l'événement n'est pas traité et la socket reçoit `RATE_LIMITED` sur `listening:error`, `playlist:error` ou `control:error` selon l'événement. Le compteur est par socket : une autre connexion du même utilisateur a le sien.

Le contrôleur reçoit `permission:changed` (`{ ownerId, targetUserId, canControl }`) quand l'interrupteur change (`grantControl` / `revokeControl`) et quand une licence d'appareil lui est accordée ou retirée ; pour une licence, `canControl` dit s'il lui reste au moins un appareil contrôlable, et l'app recharge alors sa liste d'appareils contrôlables.

Quand l'accès peut se perdre, il est revérifié : après le retrait de l'interrupteur, le retrait d'une licence, ou un `unfollowUser` dans un sens ou dans l'autre. Les sockets du contrôleur ne quittent `listening:<ownerId>`, et ne reçoivent plus `listening:status`, que s'il ne lui reste aucun appareil contrôlable. Un échec de cette éviction est seulement loggé et ne fait jamais échouer la requête HTTP.

## 🎵 SoundCloud

- Cache des résultats : recherche et détails de track 1 h, URLs de stream 30 min (`features/soundcloud/utils/soundcloud-cache.ts`)
- Seuls les morceaux lisibles en streaming sont renvoyés
- L'URL de stream est récupérée à la demande et expire : ne jamais la stocker en base
- Routes authentifiées (`authMiddleware`) et limitées par utilisateur dans Redis (`rl:soundcloud:`, 120 requêtes par minute par défaut, `RATE_LIMIT_SOUNDCLOUD_MAX` / `RATE_LIMIT_SOUNDCLOUD_WINDOW_MS`) : `429 RATE_LIMIT_EXCEEDED` au-delà, `503` sans Redis (`REVOCATION_UNAVAILABLE` de l'auth, qui passe en premier) (#208)
- `track/:urlOrId` accepte un id numérique ou une URL https sur `soundcloud.com`, `www.soundcloud.com`, `m.soundcloud.com` ou `on.soundcloud.com` ; `stream` n'accepte qu'une telle URL : sinon `400 VALIDATION_ERROR`, sans appel à SoundCloud

## 🔄 Prochaines étapes

Le reste à faire est suivi dans les GitHub Issues du repo (epics et stories BMAD).

## 📖 Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Express.js](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Zod](https://zod.dev/)

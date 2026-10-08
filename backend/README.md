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
│   │   ├── mail/           # Emails transactionnels (Gmail SMTP, nodemailer)
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
└── migrations/             # Migrations SQL, appliquées à la main dans le dashboard Supabase
```

## 🚀 Quick Start

### 1. Setup initial

```bash
make setup
```

Cette commande va :

- Installer les dépendances npm
- Créer le fichier `.env` depuis `.env.example`

### 2. Configurer Supabase

1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet "zumik"
3. Récupérez vos credentials dans Dashboard → Settings → API :
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
4. Ajoutez-les dans le fichier `.env`

### 3. Exécuter la migration SQL

1. Allez dans Supabase Dashboard → SQL Editor
2. Créez une nouvelle query
3. Copiez le contenu de `migrations/001_initial_schema.sql`
4. Exécutez la query

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
- `src/features/auth/services/brute-force.service.ts` - Logique métier protection

#### Clés Redis utilisées

**Rate Limiting:**

```
rl:auth:login:{email}:{ip}       # Compteur login
rl:auth:register:{ip}            # Compteur register
rl:auth:oauth:{provider}:{ip}    # Compteur OAuth
rl:auth:global:{ip}              # Compteur global
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
- **Email**: nodemailer (Gmail SMTP)

## 📂 Structure d'une Feature

Chaque feature suit cette structure (pas de fichier `index.ts` : on importe directement le fichier source, via `@/features/...` ou `@/shared/...`, avec l'extension `.js`) :

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
| `/api/playlists` | CRUD, publiques, par user, tracks (ajout, retrait, reorder), collaborateurs, viewers |
| `/api/friends` | liste, stats, statut, follow / unfollow |
| `/api/music-control` | permissions (liste, grant, revoke), can-control |
| `/api/soundcloud` | search, track, stream |
| `/health` | santé du serveur et de Redis (sans auth) |

## ⚡ Temps réel (Socket.io)

Serveur : `src/realtime/index.ts`. Events :

- **Client → serveur** : `auth:register`, `playlist:join`, `playlist:leave`, `listening:subscribe`, `listening:unsubscribe`, `listening:update`, `control:action`
- **Serveur → client** : `playlist:updated`, `listening:status`, `listening:error`, `permission:changed`, `control:command`, `control:success`, `control:error`

Les clients d'une playlist rejoignent la room `playlist:<id>` et reçoivent `playlist:updated` à chaque modification.

## 🎵 SoundCloud

- Cache des résultats : recherche et détails de track 1 h, URLs de stream 30 min (`features/soundcloud/utils/soundcloud-cache.ts`)
- Seuls les morceaux lisibles en streaming sont renvoyés
- L'URL de stream est récupérée à la demande et expire : ne jamais la stocker en base

## 🔄 Prochaines étapes

Le reste à faire est suivi dans les GitHub Issues du repo (epics et stories BMAD).

## 📖 Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Express.js](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Zod](https://zod.dev/)

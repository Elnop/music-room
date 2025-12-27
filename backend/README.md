# Music Room Backend

Backend pour l'application Music Room - Collaborative music room with music streaming integration.

## 🏗️ Architecture

Ce projet utilise une **architecture feature-first** (colocation par feature) :

```
backend/
├── src/
│   ├── features/           # Features organisées par domaine métier
│   │   ├── auth/          # Authentication feature
│   │   ├── friends/       # Friends system (à venir)
│   │   ├── rooms/         # Music rooms (à venir)
│   │   └── ...
│   ├── shared/            # Code partagé entre features
│   │   ├── config/        # Configuration (Supabase, env, etc.)
│   │   ├── types/         # Types TypeScript globaux
│   │   ├── utils/         # Utilitaires (logger, etc.)
│   │   └── middleware/    # Middleware Express globaux
│   └── server.ts          # Point d'entrée
└── migrations/            # Migrations SQL Supabase
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
2. Créez un nouveau projet "music-room"
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

## 📝 Commandes disponibles

```bash
make help          # Afficher toutes les commandes
make install       # Installer les dépendances
make dev           # Lancer en mode développement
make build         # Build pour production
make start         # Lancer en production
make type-check    # Vérifier les types TypeScript
make clean         # Nettoyer les artifacts
```

## 🔴 Redis Integration

Music Room utilise Redis pour le rate limiting et la protection brute force.

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

# Graceful Degradation
RATE_LIMIT_FALLBACK_MEMORY=true
```

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

### Graceful Degradation

Si Redis est indisponible:
- **Rate limiting**: Fallback vers stockage in-memory (express-rate-limit)
- **Account lockout**: Désactivé automatiquement (log warning)
- **Backend**: Continue de fonctionner normalement

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

### Documentation complète

Consultez la **documentation API complète** : [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

Cette documentation inclut :
- Tous les endpoints disponibles
- Format des requêtes et réponses
- Codes d'erreur
- Exemples cURL
- Règles de validation

### Tester avec Postman

Nous fournissons une collection Postman prête à l'emploi :

1. **Importer la collection** : `Music_Room_API.postman_collection.json`
2. **Importer l'environnement** : `Music_Room_Local.postman_environment.json`
3. **Commencer à tester !**

La collection inclut des scripts automatiques qui :
- Sauvegardent le token JWT après login/register
- L'ajoutent automatiquement aux requêtes authentifiées

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

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth
- **Validation**: Zod
- **Real-time**: Socket.io (à venir)

## 📂 Structure d'une Feature

Chaque feature suit cette structure :

```
features/auth/
├── auth.types.ts        # Types TypeScript
├── auth.validators.ts   # Validation Zod
├── auth.service.ts      # Business logic
├── auth.controller.ts   # Handlers Express
├── auth.middleware.ts   # Middleware spécifiques
├── auth.routes.ts       # Routes Express
└── index.ts             # Exports publics
```

## 🔄 Prochaines étapes

- [ ] Feature Friends (système d'amis)
- [ ] Feature Rooms (salles de musique)
- [ ] Socket.io integration
- [ ] Feature Music Search (SoundCloud integration)
- [x] Feature Playlists (collaborative playlists) - Complete

## 📖 Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Express.js](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Zod](https://zod.dev/)

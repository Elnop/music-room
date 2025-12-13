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

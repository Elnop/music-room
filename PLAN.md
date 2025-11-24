# Music Room - Plan d'Action Complet v3.0

> **Projet**: Application mobile collaborative de musique
> **Version PDF**: 5.3
> **Plan Révisé**: 3.0 (Architecture Supabase Auth + Backend Node.js)
> **Stack**: Node.js + Supabase (Auth + DB) + Socket.io + React Native + Spotify API

---

## 📋 Table des Matières

1. [Changements Majeurs](#-changements-majeurs-v20)
2. [Vue d'ensemble](#-vue-densemble)
3. [Justifications Techniques](#-justifications-techniques-respect-du-pdf)
4. [Architecture](#️-architecture-technique)
5. [Plan de Développement](#-plan-de-développement-détaillé)
6. [Technologies](#-stack-technologique)
7. [Structure du Projet](#️-structure-du-projet)
8. [Guide de Démarrage](#-guide-de-démarrage)
9. [Exigences PDF](#-conformité-aux-exigences-pdf)
10. [Timeline](#-timeline--roadmap)

---

## 🔄 Changements Majeurs v3.0

### Services Implémentés (2 sur 3 - conforme PDF)

| Service | Statut | Justification |
|---------|--------|---------------|
| ~~Music Track Vote~~ | ❌ **NON IMPLÉMENTÉ** | PDF exige "at least 2 out of 3". Choix de se concentrer sur les 2 autres. |
| **Music Playlist Editor** | ✅ **IMPLÉMENTÉ** | Service principal collaboratif temps réel |
| **Music Control Delegation** | ✅ **IMPLÉMENTÉ** | Service de délégation entre devices |

### Évolution Architecture

| Composant | v1.0 | v2.0 (JWT custom) | v3.0 (FINAL) |
|-----------|------|-------------------|--------------|
| **Auth** | Supabase Auth basique | JWT custom complet | **Supabase Auth complet** |
| **Realtime** | Supabase Realtime | Socket.io custom | **Socket.io custom** |
| **Database** | Supabase DB | PostgreSQL hébergé | **Supabase DB + RLS** |
| **Business Logic** | ❌ Minimal | ✅ Custom | **✅ Custom complet** |

### Décisions Architecture v3.0

✅ **Supabase Auth** (email, OAuth Google/Facebook, verification, reset)
- Gain de temps: 3 semaines économisées vs JWT custom
- Standard industrie (Firebase, Auth0 font pareil)
- **Risque "SDK does work" accepté** - Focus sur business logic

✅ **Backend Node.js/Express** pour TOUTE la business logic
- Services métier (playlists, devices, friends, Spotify)
- Validations (Zod)
- Conflict resolution
- **C'est là qu'on fait NOTRE travail**

✅ **Socket.io custom** pour realtime
- Pas Supabase Realtime
- Contrôle total du protocole
- Custom rooms, namespaces, broadcast

✅ **Supabase Database** (PostgreSQL + RLS)
- Row Level Security pour isolation données
- Hébergement managé
- Pas de logique métier dans DB

### Timeline Optimisée

| Version | Durée | Auth | Business Logic | Justification |
|---------|-------|------|----------------|---------------|
| v2.0 | 21 sem | 2 sem (JWT custom) | 11 sem | Beaucoup de temps sur auth |
| **v3.0** | **18 sem** | **3-4 jours (Supabase)** | **12+ sem** | **Plus de temps sur métier** |

---

## 🎯 Vue d'ensemble

Music Room est une application mobile collaborative centrée sur la musique, permettant :

### Fonctionnalités Principales

1. **Gestion Utilisateurs & Amis**
   - Inscription email/password avec validation
   - Connexion via Google ou Facebook (OAuth)
   - Profil avec 3 niveaux de privacy (public / amis / privé)
   - Système de demandes d'amitié
   - Préférences musicales

2. **Music Playlist Editor** (Service #1 - Mandatory)
   - Création de playlists collaboratives
   - Édition multi-utilisateurs en temps réel
   - Ajout de morceaux depuis Spotify
   - Réordonnancement drag-and-drop
   - Gestion des collaborateurs et permissions
   - Résolution automatique des conflits
   - Visibility publique ou privée

3. **Music Control Delegation** (Service #2 - Mandatory)
   - Enregistrement des appareils (devices)
   - Délégation de contrôle musical à des amis
   - Permissions granulaires (play, pause, skip, volume)
   - Synchronisation de l'état de lecture
   - Gestion multi-devices

4. **Intégration Spotify**
   - Recherche dans le catalogue Spotify
   - Lecture audio via Spotify SDK
   - Connexion compte Spotify
   - Preview et métadonnées

### Fonctionnalités Bonus

- **Web Responsive** : Interface web complète (Next.js)
- **Subscriptions** : Free vs Premium (feature flags)
- **Mode Offline** : Cache local + synchronisation
- **IoT** : iBeacon pour proximity-based features

---

## 📚 Justifications Techniques & Architecture v3.0

### Position sur "SDK must not do your work"

Le PDF avertit : **"Warning the SDK you choose must not do your work."**

#### Notre Interprétation & Décision

**Contexte**: Le projet Music Room est sur les **services musicaux collaboratifs**, pas sur l'authentification.

**Décision v3.0**: Utiliser Supabase Auth complet et **accepter le risque**

**Justifications**:

1. **Auth n'est PAS le coeur du projet**
   - Le travail métier = Playlist Editor, Control Delegation, Spotify integration
   - Auth = prérequis technique, pas la valeur ajoutée
   - Comme utiliser Express pour HTTP au lieu de réimplémenter TCP

2. **On fait BEAUCOUP de travail custom ailleurs**
   - Socket.io custom pour realtime collaboratif
   - Algorithmes de conflict resolution (CRDT)
   - Business logic complète (playlists, devices, friends)
   - Intégration Spotify (search, playback, sync)
   - Tous les services métier

3. **Gains de productivité réinvestis**
   - 3 semaines économisées sur auth custom
   - → Investies dans qualité des features métier
   - → Plus de temps pour tests, polish, bonus
   - → Meilleure expérience utilisateur finale

4. **Standard industrie**
   - Firebase Auth, Auth0, Clerk, AWS Cognito font pareil
   - Tous les projets modernes utilisent auth managée
   - Focus: valeur métier, pas réinventer la roue

#### ✅ Ce que NOUS implémentons (NOTRE travail)

| Fonctionnalité | Implémentation | Complexité |
|----------------|----------------|------------|
| **Playlist Collaborative Editor** | Socket.io + CRDT + UI temps réel | 🔥🔥🔥 Élevée |
| **Control Delegation** | Multi-device sync + permissions | 🔥🔥 Moyenne |
| **Friends System** | Requests + privacy levels | 🔥🔥 Moyenne |
| **Spotify Integration** | Search + playback + sync | 🔥🔥 Moyenne |
| **Conflict Resolution** | Algorithme custom CRDT | 🔥🔥🔥 Élevée |
| **Business Logic** | Validations + services + controllers | 🔥🔥🔥 Élevée |
| **Realtime WebSocket** | Socket.io rooms/namespaces/broadcast | 🔥🔥 Moyenne |
| **API REST** | Express + Zod + Swagger | 🔥 Faible |

**Total travail custom**: 70%+ du projet

#### 🔧 Ce que Supabase fait (10-15% du projet)

| Fonctionnalité | Supabase | Notre utilisation |
|----------------|----------|-------------------|
| **Auth** | Email, OAuth, JWT | Setup + intégration |
| **Database** | PostgreSQL + RLS | Schéma + migrations + queries |
| **Hosting** | Infrastructure | Configuration |

#### Architecture Détaillée v3.0

```typescript
// ✅ v3.0 - Approche pragmatique et productive

// AUTH: Supabase fait (gain 3 semaines)
const { data, error } = await supabase.auth.signUp({ email, password });

// MAIS Business logic: NOUS faisons
async function register(email: string, password: string) {
  // 1. Validations métier (NOTRE CODE)
  const schema = z.object({
    email: z.string().email(),
    password: z.string()
      .min(8)
      .regex(/[A-Z]/, "Need uppercase")
      .regex(/[0-9]/, "Need number")
  });

  const validated = schema.parse({ email, password });

  // 2. Check business rules (NOTRE CODE)
  const existingUser = await checkUserExists(email);
  if (existingUser && existingUser.deleted) {
    throw new Error("Account was deleted, contact support");
  }

  // 3. Supabase Auth (SDK fait)
  const { data, error } = await supabase.auth.signUp({
    email: validated.email,
    password: validated.password
  });

  if (error) throw error;

  // 4. Create profile avec privacy (NOTRE CODE)
  await createUserProfile({
    userId: data.user.id,
    username: generateUsername(email),
    privacy: {
      public: { bio: "", avatar: "" },
      friends: { favoriteGenres: [] },
      private: { email: true }
    }
  });

  // 5. Setup default preferences (NOTRE CODE)
  await setupDefaultMusicPreferences(data.user.id);

  // 6. Log event (NOTRE CODE)
  await logUserRegistration({
    userId: data.user.id,
    method: 'email',
    platform: req.headers['x-platform'],
    device: req.headers['x-device']
  });

  return data;
}
```

**Bilan**: Supabase Auth = 5 lignes. Notre business logic = 40+ lignes.

---

### Choix Technologiques Justifiés

#### Pourquoi Node.js + Express ?

**Choix** : Node.js 18+ avec Express.js

**Avantages** :
- JSON natif (requis par PDF pour API)
- Async/await pour opérations temps réel
- Écosystème npm très riche
- Performance I/O non-bloquante (critique pour WebSocket)
- Même langage que frontend (TypeScript)

**Inconvénients** :
- Single-threaded (mais async compense)
- Typage moins strict que Go

**Alternatives considérées** :
- **Python (Django/FastAPI)** : Excellent pour API REST mais moins performant pour WebSocket temps réel
- **Go (Gin/Echo)** : Meilleures performances mais écosystème plus petit et courbe d'apprentissage
- **PHP (Laravel)** : Mature mais moins adapté au temps réel

**Verdict** : Node.js optimal pour ce projet (REST + WebSocket + JSON + Spotify SDK disponible)

---

#### Pourquoi PostgreSQL ?

**Choix** : PostgreSQL 15+ (hébergé sur Supabase pour infrastructure managée)

**Avantages** :
- Relations complexes (users ↔ friends ↔ playlists ↔ tracks)
- ACID pour gestion concurrence (crucial pour édition collaborative)
- JSON support (colonnes preferences, permissions)
- Transactions robustes
- Open source, mûr, performant

**Inconvénients** :
- Plus complexe que NoSQL pour schéma simple

**Alternatives considérées** :
- **MongoDB** : Plus simple mais manque de transactions multi-documents (v4.0+)
- **MySQL** : Équivalent mais moins de features avancées

**Verdict** : PostgreSQL = meilleur choix pour relations + concurrence

---

#### Pourquoi React Native (Expo) ?

**Choix** : React Native 0.73+ avec Expo

**Avantages** :
- Code partageable iOS/Android (bonus multi-platform facilité)
- Spotify SDK disponible (expo-spotify)
- Large communauté et librairies
- Hot reload pour dev rapide
- Expo simplifie build Android

**Inconvénients** :
- Performances légèrement inférieures au natif
- Debugging parfois complexe

**Alternatives considérées** :
- **Android natif (Kotlin)** : Meilleures perfs mais pas de code sharing
- **Flutter** : Performant mais moins de libs tierces (Spotify SDK limité)

**Verdict** : React Native = bon compromis productivité/performance

---

#### Pourquoi Socket.io (pas Supabase Realtime) ?

**Choix** : Socket.io 4.6+ pour WebSocket

**Avantages** :
- Contrôle total du protocole temps réel
- Rooms et namespaces (isolation par playlist)
- Fallback automatique (WebSocket → polling)
- **On écrit TOUTE la logique** (respect PDF)

**Inconvénients** :
- Plus de code que solution managed

**Alternatives considérées** :
- **Supabase Realtime** : Simple mais SDK fait le travail (❌ PDF)
- **Native WebSocket** : Plus bas niveau, plus de boilerplate

**Verdict** : Socket.io = meilleur compromis custom/productivité

---

#### Pourquoi Spotify API ?

**Choix** : Spotify Web API + Spotify SDK Android

**Avantages** :
- Catalogue le plus complet (70M+ tracks)
- SDK mobile officiel et robuste
- Documentation excellente
- API gratuite (avec limitations)
- Preview tracks 30s sans premium

**Inconvénients** :
- Lecture complète nécessite Spotify Premium
- Rate limits API

**Alternatives considérées** :
- **Deezer API** : Bien mais moins populaire
- **YouTube Music API** : Limitations contrôle lecture
- **Catalogue local fictif** : Pas de vraie musique

**Verdict** : Spotify = standard industrie, SDK solide

---

## 🏗️ Architecture Technique

### Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                 │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │   Mobile    │    │     Web     │    │ IoT (Bonus) │       │
│  │   React     │    │   Next.js   │    │   iBeacon   │       │
│  │   Native    │    │   14        │    │  Proximity  │       │
│  │             │    │             │    │             │       │
│  │ Spotify SDK │    │ Spotify Web │    │             │       │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘       │
│         │                   │                   │               │
└─────────┼───────────────────┼───────────────────┼───────────────┘
          │                   │                   │
          │    ┌──────────────┴───────────────────┘
          │    │
          │    │  HTTPS (REST) + WSS (WebSocket)
          │    │
          ▼    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js)                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Express.js Server                       │  │
│  │                                                           │  │
│  │  ├─ REST API (JSON)                                      │  │
│  │  │  ├─ /api/auth/*        (JWT custom)                   │  │
│  │  │  ├─ /api/users/*       (profiles, friends)            │  │
│  │  │  ├─ /api/playlists/*   (collaborative editing)        │  │
│  │  │  ├─ /api/devices/*     (device management)            │  │
│  │  │  ├─ /api/delegations/* (control delegation)           │  │
│  │  │  └─ /api/spotify/*     (search, tracks)               │  │
│  │  │                                                        │  │
│  │  └─ Socket.io Server (WebSocket)                         │  │
│  │     ├─ Namespace: /playlists (realtime collab)           │  │
│  │     ├─ Namespace: /playback  (music sync)                │  │
│  │     └─ Rooms: par playlist/device                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Business   │  │    Custom    │  │   Spotify    │        │
│  │    Logic     │  │     Auth     │  │     API      │        │
│  │              │  │              │  │   Integration │        │
│  │  Services    │  │  JWT + OAuth │  │              │        │
│  │  Controllers │  │  Bcrypt      │  │  Search      │        │
│  │  Models      │  │  Nodemailer  │  │  Metadata    │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                  │                 │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
│                                                                 │
│  ┌────────────────────────────────────┐  ┌─────────────────┐  │
│  │   PostgreSQL (hébergé Supabase)    │  │  Redis (cache)  │  │
│  │                                    │  │   (optionnel)   │  │
│  │  Tables:                           │  │                 │  │
│  │  ├─ users                          │  │  Session store  │  │
│  │  ├─ user_profiles                  │  │  Rate limiting  │  │
│  │  ├─ friendships                    │  │  Temp data      │  │
│  │  ├─ friend_requests                │  │                 │  │
│  │  ├─ playlists                      │  └─────────────────┘  │
│  │  ├─ playlist_tracks                │                        │
│  │  ├─ playlist_collaborators         │                        │
│  │  ├─ devices                        │                        │
│  │  ├─ control_delegations            │                        │
│  │  ├─ playback_state                 │                        │
│  │  ├─ subscriptions (bonus)          │                        │
│  │  └─ sync_queue (offline bonus)     │                        │
│  └────────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
          │
          │  Client credentials
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Spotify    │  │    Google    │  │   Facebook   │        │
│  │   Web API    │  │    OAuth     │  │    OAuth     │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### Flux d'Authentification

```
┌────────┐                 ┌─────────┐                ┌──────────┐
│ Client │                 │ Backend │                │ OAuth    │
│        │                 │ (JWT)   │                │ Provider │
└───┬────┘                 └────┬────┘                └────┬─────┘
    │                           │                          │
    │ 1. POST /auth/login/oauth │                          │
    ├──────────────────────────►│                          │
    │                           │                          │
    │                           │ 2. Redirect OAuth        │
    │◄──────────────────────────┤                          │
    │                           │                          │
    │ 3. User consent           │                          │
    ├───────────────────────────┼─────────────────────────►│
    │                           │                          │
    │                           │◄─────────────────────────┤
    │                           │ 4. OAuth callback + code │
    │                           │                          │
    │                           │ 5. Exchange code → token │
    │                           ├─────────────────────────►│
    │                           │                          │
    │                           │◄─────────────────────────┤
    │                           │ 6. Access token          │
    │                           │                          │
    │                           │ 7. Get user profile      │
    │                           ├─────────────────────────►│
    │                           │                          │
    │                           │◄─────────────────────────┤
    │                           │ 8. User data             │
    │                           │                          │
    │                           │ 9. Create/find user DB   │
    │                           │ 10. Generate OUR JWT     │
    │                           │                          │
    │◄──────────────────────────┤                          │
    │ 11. Return our JWT        │                          │
    │                           │                          │
```

**Notre travail** : Étapes 1, 5-11 (flow complet, génération JWT, DB)
**SDK travail** : Étapes 2-4 (vérification token OAuth uniquement)

### Flux Temps Réel (Playlist Collaborative)

```
User A (Mobile)          Backend (Socket.io)          User B (Web)
─────────────           ──────────────────          ─────────────

    │                           │                          │
    │ 1. Connect WS             │                          │
    ├──────────────────────────►│                          │
    │                           │                          │
    │                           │◄─────────────────────────┤
    │                           │ 2. Connect WS            │
    │                           │                          │
    │                           │ 3. Join room "playlist_123"
    │                           │                          │
    │ 4. Edit: Add track        │                          │
    ├──────────────────────────►│                          │
    │                           │ 5. Validate operation    │
    │                           │ 6. Apply to DB           │
    │                           │ 7. Resolve conflicts     │
    │                           │                          │
    │                           │ 8. Broadcast change      │
    │◄──────────────────────────┼─────────────────────────►│
    │ 9. Update UI              │                          │ 9. Update UI
    │                           │                          │
    │                           │◄─────────────────────────┤
    │                           │ 10. Edit: Reorder tracks │
    │                           │                          │
    │                           │ 11. Conflict avec op 4 ? │
    │                           │ 12. Apply CRDT rules     │
    │                           │                          │
    │◄──────────────────────────┼─────────────────────────►│
    │ 13. Merged state          │                          │ 13. Merged state
```

**Notre implémentation complète** : Socket.io, rooms, broadcast, conflict resolution

---

## 📅 Plan de Développement Détaillé

### Phase 1: Infrastructure & Configuration (2 semaines)

#### Objectifs
- ✅ Structure complète du projet
- ✅ Configuration environnements
- ✅ Setup bases de données
- ✅ Configuration Spotify Developer

#### Tasks Backend

**1.1 Initialisation projet Node.js**
```bash
mkdir backend && cd backend
npm init -y
npm install express typescript @types/node @types/express
npm install cors helmet express-rate-limit
npm install dotenv zod
npm install -D nodemon ts-node eslint prettier
```

**1.2 Structure MVC**
```
backend/src/
├── config/
│   ├── database.ts       # PostgreSQL connection
│   ├── spotify.ts        # Spotify API config
│   └── jwt.ts            # JWT secrets & config
├── controllers/
│   ├── auth.controller.ts
│   ├── users.controller.ts
│   ├── friends.controller.ts
│   ├── playlists.controller.ts
│   ├── devices.controller.ts
│   └── spotify.controller.ts
├── models/
│   ├── user.model.ts
│   ├── playlist.model.ts
│   └── device.model.ts
├── routes/
│   ├── auth.routes.ts
│   ├── users.routes.ts
│   ├── playlists.routes.ts
│   └── devices.routes.ts
├── middleware/
│   ├── auth.middleware.ts
│   ├── validation.middleware.ts
│   └── rateLimit.middleware.ts
├── services/
│   ├── auth.service.ts
│   ├── spotify.service.ts
│   ├── playlist.service.ts
│   └── socket.service.ts
├── utils/
│   ├── logger.ts
│   ├── errors.ts
│   └── validators.ts
├── socket/
│   ├── playlist.socket.ts
│   └── playback.socket.ts
├── app.ts
└── server.ts
```

**1.3 Configuration PostgreSQL (Supabase)**
```typescript
// config/database.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default pool;
```

**1.4 Migrations SQL**
```sql
-- migrations/001_initial_schema.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  oauth_provider VARCHAR(50),
  oauth_id VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(100) UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  -- Public info
  display_name VARCHAR(100),
  -- Friends-only info
  favorite_genres JSONB,
  favorite_artists JSONB,
  -- Private info
  phone VARCHAR(50),
  location VARCHAR(255),
  -- Music preferences
  music_preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- Plus de tables dans les phases suivantes...
```

**1.5 Configuration Spotify Developer**
- [ ] Créer compte Spotify Developer
- [ ] Créer application Spotify
- [ ] Obtenir Client ID et Client Secret
- [ ] Configurer redirect URIs
- [ ] Tester API dans Postman

#### Tasks Mobile

**1.6 Initialisation React Native (Expo)**
```bash
npx create-expo-app mobile --template
cd mobile
npx expo install expo-router expo-secure-store expo-location
npm install axios zustand react-native-draggable-flatlist
npm install @react-navigation/native @react-navigation/stack
```

**1.7 Structure mobile**
```
mobile/src/
├── screens/
│   ├── auth/
│   ├── friends/
│   ├── playlists/
│   └── devices/
├── components/
│   ├── common/
│   ├── playlist/
│   └── player/
├── navigation/
│   ├── AppNavigator.tsx
│   └── AuthNavigator.tsx
├── services/
│   ├── api.service.ts
│   ├── auth.service.ts
│   ├── socket.service.ts
│   └── spotify.service.ts
├── store/
│   ├── auth.store.ts
│   ├── playlist.store.ts
│   └── playback.store.ts
├── hooks/
├── types/
├── constants/
└── utils/
```

#### Tasks Configuration

**1.8 Fichiers environnement**

Backend `.env`:
```env
NODE_ENV=development
PORT=3000

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/musicroom

# JWT Secrets (générer avec: openssl rand -hex 32)
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Spotify API
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/spotify/callback

# OAuth Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# OAuth Facebook
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/auth/facebook/callback

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis (optionnel)
REDIS_URL=redis://localhost:6379

# Frontend URLs
FRONTEND_URL=http://localhost:19006
WEB_URL=http://localhost:3001
```

Mobile `.env`:
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3000
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your-spotify-client-id
```

**1.9 Makefile**
```makefile
.PHONY: help install setup dev-backend dev-mobile dev-web test lint clean

help:
	@echo "Music Room - Available commands:"
	@echo "  make install      - Install all dependencies"
	@echo "  make setup        - Initial project setup"
	@echo "  make dev-backend  - Start backend server"
	@echo "  make dev-mobile   - Start mobile app"
	@echo "  make dev-web      - Start web app"
	@echo "  make test         - Run all tests"
	@echo "  make lint         - Lint all code"

install:
	cd backend && npm install
	cd mobile && npm install
	cd web && npm install

setup:
	@echo "Setting up Music Room..."
	cp backend/.env.example backend/.env
	cp mobile/.env.example mobile/.env
	@echo "Please edit .env files with your credentials"
	make install

dev-backend:
	cd backend && npm run dev

dev-mobile:
	cd mobile && npx expo start

dev-web:
	cd web && npm run dev

test:
	cd backend && npm test
	cd mobile && npm test

lint:
	cd backend && npm run lint
	cd mobile && npm run lint
```

**Checklist Phase 1**:
- [ ] Backend Node.js initialisé avec TypeScript
- [ ] Structure MVC en place
- [ ] PostgreSQL configuré (Supabase)
- [ ] Migrations initiales créées
- [ ] Mobile React Native initialisé
- [ ] Structure navigation mobile
- [ ] Fichiers .env.example créés
- [ ] Makefile fonctionnel
- [ ] Git init avec .gitignore complet
- [ ] Spotify Developer app créée
- [ ] OAuth Google/Facebook apps créées

---

### Phase 2: Authentification avec Supabase (3-4 jours) ⚡

#### Objectifs
- ✅ Supabase Auth (email, OAuth Google/Facebook, verification, reset)
- ✅ Middleware auth backend
- ✅ Business logic autour de l'auth
- ✅ Mobile auth UI complète
- ✅ Row Level Security (RLS) setup

#### 2.1 Backend - Supabase Auth Setup

**Configuration Supabase**
```typescript
// config/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Client pour opérations user (avec anon key)
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

// Client admin pour opérations backend (avec service key)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)
```

**Middleware d'authentification**
```typescript
// middleware/auth.middleware.ts
import { supabaseAdmin } from '../config/supabase'

export const authenticateSupabase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.substring(7)

  try {
    // Vérifier le token JWT Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Ajouter user à request (NOTRE ENRICHISSEMENT)
    req.user = {
      id: user.id,
      email: user.email,
      provider: user.app_metadata.provider
    }

    next()
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' })
  }
}
```

**Controller Auth avec Business Logic**
```typescript
// controllers/auth.controller.ts
import { supabase } from '../config/supabase'
import { z } from 'zod'

class AuthController {

  // Register avec BUSINESS LOGIC
  async register(req: Request, res: Response) {
    try {
      const { email, password } = req.body

      // 1. Validation business (NOTRE CODE)
      const schema = z.object({
        email: z.string().email('Invalid email format'),
        password: z.string()
          .min(8, 'Password must be at least 8 characters')
          .regex(/[A-Z]/, 'Password must contain uppercase')
          .regex(/[0-9]/, 'Password must contain number')
          .regex(/[^A-Za-z0-9]/, 'Password must contain special char')
      })

      const validated = schema.parse({ email, password })

      // 2. Check business rules (NOTRE CODE)
      const { data: existingProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('user_id, deleted_at')
        .eq('email', email)
        .single()

      if (existingProfile && !existingProfile.deleted_at) {
        return res.status(400).json({
          error: 'Email already registered'
        })
      }

      if (existingProfile && existingProfile.deleted_at) {
        return res.status(400).json({
          error: 'Account was deleted. Contact support to recover.'
        })
      }

      // 3. Supabase Auth (SDK fait auth)
      const { data, error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          data: {
            registered_from: 'mobile',
            registration_ip: req.ip
          }
        }
      })

      if (error) {
        return res.status(400).json({ error: error.message })
      }

      // 4. Create user profile (NOTRE BUSINESS LOGIC)
      await this.createUserProfile({
        userId: data.user!.id,
        email: validated.email,
        username: this.generateUsername(validated.email),
        source: 'email_registration'
      })

      // 5. Setup default music preferences (NOTRE LOGIC)
      await this.setupDefaultPreferences(data.user!.id)

      // 6. Log registration event (NOTRE LOGGING)
      await this.logUserEvent({
        userId: data.user!.id,
        event: 'user_registered',
        method: 'email',
        platform: req.headers['x-platform'] || 'unknown',
        device: req.headers['x-device'] || 'unknown',
        app_version: req.headers['x-app-version'] || 'unknown',
        ip: req.ip
      })

      // 7. Send welcome notification (NOTRE BUSINESS)
      await this.sendWelcomeNotification(data.user!.id)

      res.status(201).json({
        user: data.user,
        session: data.session,
        message: 'Please check your email to verify your account'
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        })
      }
      res.status(500).json({ error: 'Registration failed' })
    }
  }

  // Login (Supabase auth + NOTRE business logic)
  async login(req: Request, res: Response) {
    const { email, password } = req.body

    // 1. Validation (NOTRE CODE)
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    // 2. Supabase auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      // 3. Log failed attempt (NOTRE SÉCURITÉ)
      await this.logFailedLogin(email, req.ip)
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // 4. Check if account suspended (NOTRE BUSINESS RULE)
    const profile = await this.getUserProfile(data.user.id)
    if (profile.suspended) {
      return res.status(403).json({
        error: 'Account suspended. Contact support.'
      })
    }

    // 5. Update last login (NOTRE CODE)
    await this.updateLastLogin(data.user.id, {
      ip: req.ip,
      platform: req.headers['x-platform'],
      device: req.headers['x-device']
    })

    // 6. Log successful login (NOTRE LOGGING)
    await this.logUserEvent({
      userId: data.user.id,
      event: 'user_logged_in',
      platform: req.headers['x-platform'],
      device: req.headers['x-device']
    })

    res.json({
      user: data.user,
      session: data.session,
      profile: profile
    })
  }

  // OAuth Google (Supabase fait auth, on fait business)
  async loginWithGoogle(req: Request, res: Response) {
    // Supabase génère l'URL OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.FRONTEND_URL}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ url: data.url })
  }

  // Callback OAuth (NOTRE business logic après auth)
  async handleOAuthCallback(req: Request, res: Response) {
    const { code } = req.query

    if (!code) {
      return res.status(400).json({ error: 'No code provided' })
    }

    // Supabase échange le code
    const { data, error } = await supabase.auth.exchangeCodeForSession(
      code as string
    )

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    const user = data.user

    // Check si c'est la première connexion (NOTRE LOGIC)
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      // Première connexion OAuth (NOTRE ONBOARDING)
      await this.createUserProfile({
        userId: user.id,
        email: user.email!,
        username: user.user_metadata.full_name || this.generateUsername(user.email!),
        avatar_url: user.user_metadata.avatar_url,
        source: `oauth_${user.app_metadata.provider}`
      })

      await this.setupDefaultPreferences(user.id)

      await this.logUserEvent({
        userId: user.id,
        event: 'user_registered',
        method: `oauth_${user.app_metadata.provider}`,
        platform: req.headers['x-platform']
      })
    } else {
      // Connexion existante (NOTRE LOGGING)
      await this.updateLastLogin(user.id, {
        ip: req.ip,
        platform: req.headers['x-platform']
      })

      await this.logUserEvent({
        userId: user.id,
        event: 'user_logged_in',
        method: `oauth_${user.app_metadata.provider}`
      })
    }

    res.json({
      user: data.user,
      session: data.session
    })
  }

  // Helper methods (NOTRE BUSINESS LOGIC)
  private async createUserProfile(params: any) {
    await supabaseAdmin.from('user_profiles').insert({
      user_id: params.userId,
      username: params.username,
      avatar_url: params.avatar_url || null,
      registration_source: params.source,
      privacy: {
        public: { bio: '', display_name: params.username },
        friends: { favorite_genres: [], favorite_artists: [] },
        private: { email: params.email }
      }
    })
  }

  private async setupDefaultPreferences(userId: string) {
    await supabaseAdmin.from('music_preferences').insert({
      user_id: userId,
      genres: [],
      mood_tags: [],
      discovery_mode: true
    })
  }

  private generateUsername(email: string): string {
    const base = email.split('@')[0]
    const random = Math.floor(Math.random() * 10000)
    return `${base}${random}`
  }

  private async logUserEvent(event: any) {
    await supabaseAdmin.from('user_events').insert(event)
  }
}
```

**Routes**
```typescript
// routes/auth.routes.ts
import express from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateSupabase } from '../middleware/auth.middleware';

const router = express.Router();

// Auth (Supabase fait, on wrappe avec business logic)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authenticateSupabase, authController.logout);

// OAuth
router.get('/google', authController.loginWithGoogle);
router.get('/google/callback', authController.handleOAuthCallback);
router.get('/facebook', authController.loginWithFacebook);
router.get('/facebook/callback', authController.handleOAuthCallback);

// Password (Supabase gère)
router.post('/reset-password', authController.resetPassword);

// User info (avec business logic)
router.get('/me', authenticateSupabase, authController.getCurrentUser);

export default router;
```

#### 2.2 Mobile - Supabase Auth

**Configuration mobile**
```typescript
// config/supabase.ts
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
)
```

**Service Auth**
```typescript
// services/auth.service.ts
import { supabase } from '../config/supabase'

class AuthService {
  async register(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) throw error
    return data
  }

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  }

  async loginWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google'
    })

    if (error) throw error
    return data
  }

  async loginWithFacebook() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook'
    })

    if (error) throw error
    return data
  }

  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }

  // Listen auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

export const authService = new AuthService()
```

**Store Zustand avec Supabase**
```typescript
// store/auth.store.ts
import create from 'zustand'
import { authService } from '../services/auth.service'

interface AuthState {
  user: any | null
  session: any | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  initialize: async () => {
    const session = await authService.getSession()
    set({
      user: session?.user || null,
      session,
      loading: false
    })

    // Listen to auth changes (auto refresh)
    authService.onAuthStateChange((event, session) => {
      set({ user: session?.user || null, session })
    })
  },

  login: async (email, password) => {
    const { user, session } = await authService.login(email, password)
    set({ user, session })
  },

  logout: async () => {
    await authService.logout()
    set({ user: null, session: null })
  }
}))
```

**LoginScreen (simplifié)**
```typescript
// screens/auth/LoginScreen.tsx
export const LoginScreen = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const login = useAuthStore(state => state.login)

  const handleLogin = async () => {
    try {
      await login(email, password)
      // Navigation automatique via auth state
    } catch (error) {
      Alert.alert('Error', error.message)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await authService.loginWithGoogle()
    } catch (error) {
      Alert.alert('Error', error.message)
    }
  }

  return (
    <View>
      <TextInput value={email} onChangeText={setEmail} />
      <TextInput value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Login" onPress={handleLogin} />
      <Button title="Login with Google" onPress={handleGoogleLogin} />
    </View>
  )
}
```

**Checklist Phase 2** (3-4 jours vs 2 semaines):
- [ ] Backend: Supabase client setup
- [ ] Backend: Middleware auth Supabase
- [ ] Backend: Business logic auth (validations, logging)
- [ ] Backend: Routes auth
- [ ] Backend: OAuth callbacks
- [ ] Backend: RLS policies setup
- [ ] Mobile: Supabase client setup
- [ ] Mobile: AuthService
- [ ] Mobile: Zustand store avec auto-refresh
- [ ] Mobile: LoginScreen
- [ ] Mobile: RegisterScreen
- [ ] Mobile: OAuth flows
- [ ] Tests auth flow

---

### Phase 3: Système d'Amis (1 semaine)

#### Objectifs
- ✅ Demandes d'amitié (send, accept, reject)
- ✅ Liste d'amis
- ✅ Privacy profile basée sur friendship

#### 3.1 Backend - Friends System

**Migrations SQL**
```sql
-- Déjà créées en Phase 1:
-- friendships table
-- friend_requests table

-- Index pour performance
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friend_requests_to_user ON friend_requests(to_user_id);
CREATE INDEX idx_friend_requests_from_user ON friend_requests(from_user_id);
```

**Service friends**
```typescript
// services/friends.service.ts
class FriendsService {

  // Envoyer demande d'amitié
  async sendFriendRequest(from_user_id: string, to_user_id: string): Promise<FriendRequest> {
    // 1. Vérifier que l'utilisateur cible existe
    const targetUser = await db.query('SELECT id FROM users WHERE id = $1', [to_user_id]);
    if (targetUser.rows.length === 0) {
      throw new Error('User not found');
    }

    // 2. Vérifier qu'ils ne sont pas déjà amis
    const existingFriendship = await db.query(
      'SELECT * FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
      [from_user_id, to_user_id]
    );
    if (existingFriendship.rows.length > 0) {
      throw new Error('Already friends');
    }

    // 3. Vérifier qu'il n'y a pas déjà une demande en attente
    const existingRequest = await db.query(
      `SELECT * FROM friend_requests
       WHERE ((from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1))
       AND status = 'pending'`,
      [from_user_id, to_user_id]
    );
    if (existingRequest.rows.length > 0) {
      throw new Error('Friend request already exists');
    }

    // 4. Créer demande
    const result = await db.query(
      `INSERT INTO friend_requests (from_user_id, to_user_id, status)
       VALUES ($1, $2, 'pending') RETURNING *`,
      [from_user_id, to_user_id]
    );

    return result.rows[0];
  }

  // Accepter demande
  async acceptFriendRequest(request_id: string, user_id: string): Promise<void> {
    // 1. Vérifier que la demande existe et est pour cet utilisateur
    const result = await db.query(
      'SELECT * FROM friend_requests WHERE id = $1 AND to_user_id = $2 AND status = $3',
      [request_id, user_id, 'pending']
    );

    if (result.rows.length === 0) {
      throw new Error('Friend request not found');
    }

    const request = result.rows[0];

    // 2. Créer friendship (bidirectionnelle)
    await db.query(
      'INSERT INTO friendships (user_id, friend_id) VALUES ($1, $2), ($2, $1)',
      [request.from_user_id, request.to_user_id]
    );

    // 3. Mettre à jour statut de la demande
    await db.query(
      `UPDATE friend_requests SET status = 'accepted', updated_at = NOW() WHERE id = $1`,
      [request_id]
    );
  }

  // Rejeter demande
  async rejectFriendRequest(request_id: string, user_id: string): Promise<void> {
    await db.query(
      `UPDATE friend_requests SET status = 'rejected', updated_at = NOW()
       WHERE id = $1 AND to_user_id = $2 AND status = 'pending'`,
      [request_id, user_id]
    );
  }

  // Liste d'amis
  async getFriends(user_id: string): Promise<User[]> {
    const result = await db.query(
      `SELECT u.*, up.username, up.avatar_url
       FROM users u
       JOIN friendships f ON (f.friend_id = u.id)
       JOIN user_profiles up ON (up.user_id = u.id)
       WHERE f.user_id = $1`,
      [user_id]
    );

    return result.rows;
  }

  // Demandes reçues
  async getPendingRequests(user_id: string): Promise<FriendRequest[]> {
    const result = await db.query(
      `SELECT fr.*, u.email, up.username, up.avatar_url
       FROM friend_requests fr
       JOIN users u ON (fr.from_user_id = u.id)
       JOIN user_profiles up ON (up.user_id = u.id)
       WHERE fr.to_user_id = $1 AND fr.status = 'pending'
       ORDER BY fr.created_at DESC`,
      [user_id]
    );

    return result.rows;
  }

  // Supprimer ami
  async removeFriend(user_id: string, friend_id: string): Promise<void> {
    await db.query(
      'DELETE FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
      [user_id, friend_id]
    );
  }

  // Vérifier si amis
  async areFriends(user_id: string, other_user_id: string): Promise<boolean> {
    const result = await db.query(
      'SELECT * FROM friendships WHERE user_id = $1 AND friend_id = $2',
      [user_id, other_user_id]
    );

    return result.rows.length > 0;
  }
}
```

**Routes**
```typescript
// routes/friends.routes.ts
import express from 'express';
import { friendsController } from '../controllers/friends.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticateJWT); // Toutes les routes nécessitent auth

router.post('/requests', friendsController.sendRequest);
router.get('/requests/pending', friendsController.getPendingRequests);
router.post('/requests/:requestId/accept', friendsController.acceptRequest);
router.post('/requests/:requestId/reject', friendsController.rejectRequest);
router.get('/', friendsController.getFriends);
router.delete('/:friendId', friendsController.removeFriend);

export default router;
```

#### 3.2 Mobile - Friends UI

**Écrans**
```typescript
// screens/friends/FriendsListScreen.tsx
export const FriendsListScreen = () => {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    loadFriends();
    loadPendingRequests();
  }, []);

  const loadFriends = async () => {
    const data = await friendsService.getFriends();
    setFriends(data);
  };

  const loadPendingRequests = async () => {
    const data = await friendsService.getPendingRequests();
    setPendingRequests(data);
  };

  return (
    <View>
      {pendingRequests.length > 0 && (
        <View>
          <Text>Friend Requests ({pendingRequests.length})</Text>
          {pendingRequests.map(request => (
            <FriendRequestCard
              key={request.id}
              request={request}
              onAccept={() => handleAccept(request.id)}
              onReject={() => handleReject(request.id)}
            />
          ))}
        </View>
      )}

      <Text>Friends ({friends.length})</Text>
      <FlatList
        data={friends}
        renderItem={({ item }) => <FriendCard friend={item} />}
        keyExtractor={item => item.id}
      />
    </View>
  );
};

// screens/friends/AddFriendScreen.tsx
export const AddFriendScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async () => {
    const results = await friendsService.searchUsers(searchQuery);
    setSearchResults(results);
  };

  const handleSendRequest = async (userId: string) => {
    await friendsService.sendFriendRequest(userId);
    Alert.alert('Success', 'Friend request sent!');
  };

  return (
    <View>
      <TextInput
        placeholder="Search by username or email"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <Button title="Search" onPress={handleSearch} />

      <FlatList
        data={searchResults}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            onSendRequest={() => handleSendRequest(item.id)}
          />
        )}
      />
    </View>
  );
};
```

**Checklist Phase 3**:
- [ ] Backend: Service friends complet
- [ ] Backend: Routes friends
- [ ] Backend: Tests friends
- [ ] Mobile: FriendsListScreen
- [ ] Mobile: AddFriendScreen
- [ ] Mobile: FriendRequestCard component
- [ ] Mobile: User search
- [ ] Privacy profile basée sur friendship (Phase profil suivante)

---

### Phase 4: Intégration Spotify (2 semaines)

#### Objectifs
- ✅ Backend: Spotify Web API integration
- ✅ Backend: Search tracks, albums, artists
- ✅ Backend: User Spotify account linking
- ✅ Mobile: Spotify SDK Android
- ✅ Mobile: Audio playback
- ✅ Mobile: Search UI

#### 4.1 Backend - Spotify Web API

**Configuration**
```typescript
// config/spotify.ts
import SpotifyWebApi from 'spotify-web-api-node';

export const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// Client Credentials Flow (pour recherches sans user)
export async function getSpotifyClientToken(): Promise<string> {
  const data = await spotifyApi.clientCredentialsGrant();
  spotifyApi.setAccessToken(data.body.access_token);
  return data.body.access_token;
}
```

**Models**
```typescript
// models/spotify.model.ts
export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  duration_ms: number;
  preview_url?: string;
  album_art_url: string;
  spotify_uri: string;
}

export interface UserSpotifyAccount {
  id: string;
  user_id: string;
  spotify_user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: Date;
  created_at: Date;
}
```

**Service Spotify**
```typescript
// services/spotify.service.ts
class SpotifyService {

  // Recherche tracks
  async searchTracks(query: string, limit: number = 20): Promise<SpotifyTrack[]> {
    await getSpotifyClientToken(); // Refresh token si nécessaire

    const result = await spotifyApi.searchTracks(query, { limit });

    return result.body.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      duration_ms: track.duration_ms,
      preview_url: track.preview_url,
      album_art_url: track.album.images[0]?.url,
      spotify_uri: track.uri
    }));
  }

  // Link Spotify account (Authorization Code Flow)
  getAuthorizationUrl(userId: string): string {
    const scopes = [
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'streaming'
    ];

    return spotifyApi.createAuthorizeURL(scopes, userId); // state = userId
  }

  // Callback OAuth Spotify
  async handleSpotifyCallback(code: string, state: string): Promise<void> {
    const userId = state;

    const data = await spotifyApi.authorizationCodeGrant(code);

    const accessToken = data.body.access_token;
    const refreshToken = data.body.refresh_token;
    const expiresIn = data.body.expires_in;

    // Récupérer infos user Spotify
    spotifyApi.setAccessToken(accessToken);
    const userInfo = await spotifyApi.getMe();

    // Sauvegarder en DB
    await db.query(
      `INSERT INTO user_spotify_accounts (user_id, spotify_user_id, access_token, refresh_token, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
         spotify_user_id = $2,
         access_token = $3,
         refresh_token = $4,
         expires_at = $5`,
      [
        userId,
        userInfo.body.id,
        accessToken,
        refreshToken,
        new Date(Date.now() + expiresIn * 1000)
      ]
    );
  }

  // Get user Spotify token (refresh si expiré)
  async getUserSpotifyToken(userId: string): Promise<string> {
    const result = await db.query(
      'SELECT * FROM user_spotify_accounts WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Spotify account not linked');
    }

    const account = result.rows[0];

    // Check si token expiré
    if (new Date() >= account.expires_at) {
      // Refresh token
      spotifyApi.setRefreshToken(account.refresh_token);
      const data = await spotifyApi.refreshAccessToken();

      const newAccessToken = data.body.access_token;
      const expiresIn = data.body.expires_in;

      // Update DB
      await db.query(
        'UPDATE user_spotify_accounts SET access_token = $1, expires_at = $2 WHERE user_id = $3',
        [newAccessToken, new Date(Date.now() + expiresIn * 1000), userId]
      );

      return newAccessToken;
    }

    return account.access_token;
  }

  // Get track details
  async getTrack(trackId: string): Promise<SpotifyTrack> {
    await getSpotifyClientToken();

    const result = await spotifyApi.getTrack(trackId);
    const track = result.body;

    return {
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      duration_ms: track.duration_ms,
      preview_url: track.preview_url,
      album_art_url: track.album.images[0]?.url,
      spotify_uri: track.uri
    };
  }
}
```

**Routes**
```typescript
// routes/spotify.routes.ts
import express from 'express';
import { spotifyController } from '../controllers/spotify.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = express.Router();

// Public search (Client Credentials)
router.get('/search/tracks', spotifyController.searchTracks);
router.get('/tracks/:trackId', spotifyController.getTrack);

// User Spotify account linking (requires auth)
router.get('/auth', authenticateJWT, spotifyController.getAuthUrl);
router.get('/callback', spotifyController.handleCallback);
router.get('/me/account', authenticateJWT, spotifyController.getLinkedAccount);
router.delete('/me/account', authenticateJWT, spotifyController.unlinkAccount);

export default router;
```

#### 4.2 Mobile - Spotify SDK & Playback

**Installation**
```bash
cd mobile
npm install react-native-spotify-remote
# Configuration dans android/app/build.gradle
```

**Service Spotify mobile**
```typescript
// services/spotify.service.ts
import { remote as SpotifyRemote } from 'react-native-spotify-remote';
import { API_URL } from '../constants';

class SpotifyService {
  private isInitialized = false;

  // Initialiser SDK
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await SpotifyRemote.connect(process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID!);
      this.isInitialized = true;
    } catch (error) {
      console.error('Spotify initialization failed:', error);
      throw error;
    }
  }

  // Recherche tracks via notre API
  async searchTracks(query: string): Promise<SpotifyTrack[]> {
    const response = await axios.get(`${API_URL}/spotify/search/tracks`, {
      params: { q: query, limit: 20 }
    });
    return response.data;
  }

  // Link Spotify account (OAuth)
  async linkAccount(): Promise<void> {
    // Get auth URL from backend
    const response = await axios.get(`${API_URL}/spotify/auth`, {
      headers: { Authorization: `Bearer ${await getToken()}` }
    });

    const authUrl = response.data.url;

    // Open in browser (deep link callback)
    await Linking.openURL(authUrl);
  }

  // Jouer un track
  async playTrack(spotifyUri: string): Promise<void> {
    await this.initialize();
    await SpotifyRemote.playUri(spotifyUri);
  }

  // Pause
  async pause(): Promise<void> {
    await SpotifyRemote.pause();
  }

  // Resume
  async resume(): Promise<void> {
    await SpotifyRemote.resume();
  }

  // Skip to next
  async skipToNext(): Promise<void> {
    await SpotifyRemote.skipToNext();
  }

  // Skip to previous
  async skipToPrevious(): Promise<void> {
    await SpotifyRemote.skipToPrevious();
  }

  // Get playback state
  async getPlaybackState(): Promise<PlaybackState> {
    const state = await SpotifyRemote.getPlayerState();
    return {
      track: state.track,
      isPlaying: !state.isPaused,
      position: state.playbackPosition,
      duration: state.track.duration
    };
  }

  // Subscribe to state changes
  subscribeToPlayerState(callback: (state: PlaybackState) => void): () => void {
    const subscription = SpotifyRemote.addListener('playerStateChanged', callback);
    return () => subscription.remove();
  }
}

export const spotifyService = new SpotifyService();
```

**Composant Player**
```typescript
// components/player/SpotifyPlayer.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { spotifyService } from '../../services/spotify.service';

export const SpotifyPlayer = () => {
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);

  useEffect(() => {
    const unsubscribe = spotifyService.subscribeToPlayerState(setPlaybackState);
    return unsubscribe;
  }, []);

  if (!playbackState) {
    return <Text>No track playing</Text>;
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: playbackState.track.albumArt }} style={styles.albumArt} />

      <View style={styles.info}>
        <Text style={styles.trackName}>{playbackState.track.name}</Text>
        <Text style={styles.artistName}>{playbackState.track.artist}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={() => spotifyService.skipToPrevious()}>
          <Text>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() =>
          playbackState.isPlaying ? spotifyService.pause() : spotifyService.resume()
        }>
          <Text>{playbackState.isPlaying ? '⏸' : '▶️'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => spotifyService.skipToNext()}>
          <Text>⏭</Text>
        </TouchableOpacity>
      </View>

      <ProgressBar
        position={playbackState.position}
        duration={playbackState.duration}
      />
    </View>
  );
};
```

**Écran de recherche**
```typescript
// screens/spotify/TrackSearchScreen.tsx
export const TrackSearchScreen = ({ onSelectTrack }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const tracks = await spotifyService.searchTracks(query);
      setResults(tracks);
    } catch (error) {
      Alert.alert('Error', 'Failed to search tracks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Search tracks, artists, albums..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity onPress={handleSearch}>
          <Text>🔍</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TrackCard
              track={item}
              onPress={() => onSelectTrack(item)}
              onPlayPreview={() => spotifyService.playTrack(item.spotify_uri)}
            />
          )}
        />
      )}
    </View>
  );
};
```

**Checklist Phase 4**:
- [ ] Backend: Spotify Web API configured
- [ ] Backend: Client Credentials flow
- [ ] Backend: Authorization Code flow (user accounts)
- [ ] Backend: Search tracks endpoint
- [ ] Backend: Get track details endpoint
- [ ] Backend: Link/unlink Spotify account
- [ ] Backend: Token refresh logic
- [ ] Mobile: Spotify SDK installed
- [ ] Mobile: SpotifyService avec playback
- [ ] Mobile: TrackSearchScreen
- [ ] Mobile: SpotifyPlayer component
- [ ] Mobile: Link account flow
- [ ] Mobile: Playback controls (play/pause/skip)
- [ ] Tests integration Spotify

---

**(Continuer avec les phases suivantes : Playlist Editor, Control Delegation, Sécurité, Bonus, Testing, Déploiement dans le même niveau de détail...)**

---

## 🛠️ Stack Technologique

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18+
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 15+ (hébergé sur Supabase pour infrastructure managée)
- **ORM/Client**: `pg` (node-postgres) - client SQL direct
- **Authentication**: JWT (jsonwebtoken + bcrypt) - **implémenté par nous**
- **OAuth**: Passport.js (strategies Google, Facebook) - **SDK pour vérification uniquement**
- **Realtime**: Socket.io 4.6+ - **implémenté par nous**
- **Validation**: Zod
- **Email**: Nodemailer
- **Logging**: Winston
- **Testing**: Jest + Supertest
- **Load Testing**: k6
- **API Docs**: Swagger (swagger-jsdoc + swagger-ui-express)
- **Music**: Spotify Web API (spotify-web-api-node)

### Mobile
- **Framework**: React Native 0.73+
- **Platform**: Android (avec Expo pour faciliter builds)
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Realtime**: Socket.io-client
- **Storage**: Expo SecureStore (tokens) + AsyncStorage (cache)
- **Spotify**: react-native-spotify-remote
- **Location**: expo-location (pour geofencing bonus)
- **Testing**: Jest + Detox

### Web (Bonus)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand + TanStack Query (React Query)
- **Realtime**: Socket.io-client
- **Spotify**: Spotify Web Playback SDK
- **Testing**: Playwright

### DevOps & Infrastructure
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions
- **Backend Hosting**: Railway / Render / Fly.io
- **Database**: PostgreSQL hébergé sur Supabase (infrastructure managée)
- **Web Hosting**: Vercel / Netlify
- **Monitoring**: Winston logs + Sentry (optionnel)
- **Cache**: Redis (optionnel pour sessions/rate limiting)

---

## 🗂️ Structure du Projet

```
Music_Room/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── spotify.ts
│   │   │   └── jwt.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── friends.controller.ts
│   │   │   ├── playlists.controller.ts
│   │   │   ├── devices.controller.ts
│   │   │   └── spotify.controller.ts
│   │   ├── models/
│   │   │   ├── user.model.ts
│   │   │   ├── playlist.model.ts
│   │   │   ├── device.model.ts
│   │   │   └── spotify.model.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── users.routes.ts
│   │   │   ├── friends.routes.ts
│   │   │   ├── playlists.routes.ts
│   │   │   ├── devices.routes.ts
│   │   │   └── spotify.routes.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   ├── rateLimit.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── friends.service.ts
│   │   │   ├── playlist.service.ts
│   │   │   ├── device.service.ts
│   │   │   ├── spotify.service.ts
│   │   │   └── socket.service.ts
│   │   ├── socket/
│   │   │   ├── playlist.socket.ts
│   │   │   └── playback.socket.ts
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   ├── errors.ts
│   │   │   ├── validators.ts
│   │   │   └── crypto.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_friends_system.sql
│   │   ├── 003_playlists.sql
│   │   ├── 004_devices_delegation.sql
│   │   └── 005_bonus_features.sql
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── load/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   └── README.md
├── mobile/
│   ├── src/
│   │   ├── screens/
│   │   │   ├── auth/
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   ├── RegisterScreen.tsx
│   │   │   │   ├── ForgotPasswordScreen.tsx
│   │   │   │   └── ProfileScreen.tsx
│   │   │   ├── friends/
│   │   │   │   ├── FriendsListScreen.tsx
│   │   │   │   └── AddFriendScreen.tsx
│   │   │   ├── playlists/
│   │   │   │   ├── PlaylistListScreen.tsx
│   │   │   │   ├── PlaylistDetailScreen.tsx
│   │   │   │   ├── CreatePlaylistScreen.tsx
│   │   │   │   └── PlaylistEditorScreen.tsx
│   │   │   ├── devices/
│   │   │   │   ├── DevicesScreen.tsx
│   │   │   │   ├── DelegationsScreen.tsx
│   │   │   │   └── PlayerScreen.tsx
│   │   │   └── spotify/
│   │   │       └── TrackSearchScreen.tsx
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   └── Card.tsx
│   │   │   ├── playlist/
│   │   │   │   ├── PlaylistCard.tsx
│   │   │   │   ├── TrackCard.tsx
│   │   │   │   └── DraggableTrackList.tsx
│   │   │   ├── player/
│   │   │   │   ├── SpotifyPlayer.tsx
│   │   │   │   ├── ProgressBar.tsx
│   │   │   │   └── VolumeControl.tsx
│   │   │   └── friends/
│   │   │       ├── FriendCard.tsx
│   │   │       └── FriendRequestCard.tsx
│   │   ├── navigation/
│   │   │   ├── AppNavigator.tsx
│   │   │   ├── AuthNavigator.tsx
│   │   │   └── TabNavigator.tsx
│   │   ├── services/
│   │   │   ├── api.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── socket.service.ts
│   │   │   ├── spotify.service.ts
│   │   │   └── storage.service.ts
│   │   ├── store/
│   │   │   ├── auth.store.ts
│   │   │   ├── friends.store.ts
│   │   │   ├── playlist.store.ts
│   │   │   └── playback.store.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useSocket.ts
│   │   │   └── useSpotify.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── constants/
│   │   │   └── index.ts
│   │   └── utils/
│   │       ├── validators.ts
│   │       └── formatters.ts
│   ├── assets/
│   ├── app.json
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── web/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── playlists/
│   │   │   │   ├── friends/
│   │   │   │   └── devices/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── playlist/
│   │   │   └── player/
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── socket.ts
│   │   │   └── spotify.ts
│   │   └── hooks/
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   ├── next.config.js
│   └── tailwind.config.js
├── docs/
│   ├── api/
│   │   └── openapi.yaml
│   ├── architecture/
│   │   ├── decisions.md
│   │   └── diagrams/
│   ├── guides/
│   │   ├── SETUP.md
│   │   ├── DEVELOPMENT.md
│   │   └── DEPLOYMENT.md
│   └── security/
│       └── analysis.md
├── .gitignore
├── .env.example
├── Makefile
└── README.md (ce fichier)
```

---

## 🚀 Guide de Démarrage

### Prérequis

- **Node.js** 18+ et npm/yarn
- **PostgreSQL** 15+ (ou compte Supabase)
- **Android Studio** (pour émulateur Android)
- **Expo CLI**: `npm install -g expo-cli`
- **Comptes développeur**:
  - Spotify Developer Account
  - Google Cloud Console (OAuth)
  - Facebook Developers (OAuth)

### Installation Rapide

```bash
# 1. Cloner le repository
git clone <repo-url>
cd Music_Room

# 2. Installation automatique
make install

# 3. Configuration
make setup
# Éditer les fichiers .env avec vos credentials

# 4. Démarrer backend
make dev-backend

# 5. Dans un autre terminal, démarrer mobile
make dev-mobile

# 6. (Optionnel) Démarrer web
make dev-web
```

### Configuration Détaillée

#### 1. PostgreSQL (Supabase)

```bash
# Option A: Supabase cloud (recommandé)
1. Aller sur https://supabase.com
2. Créer nouveau projet
3. Copier DATABASE_URL depuis Settings > Database
4. Coller dans backend/.env

# Option B: PostgreSQL local
1. Installer PostgreSQL 15+
2. Créer database: createdb musicroom
3. DATABASE_URL=postgresql://localhost:5432/musicroom
```

#### 2. Migrations Database

```bash
cd backend
npm run migrate  # Exécute tous les fichiers migrations/*.sql
```

#### 3. Spotify Developer

```bash
1. Aller sur https://developer.spotify.com/dashboard
2. Create an App
3. Copier Client ID et Client Secret
4. Ajouter Redirect URIs:
   - http://localhost:3000/auth/spotify/callback (backend)
   - exp://localhost:19000/--/spotify (mobile Expo)
5. Coller credentials dans .env
```

#### 4. Google OAuth

```bash
1. Google Cloud Console: https://console.cloud.google.com
2. Créer projet
3. APIs & Services > Credentials > Create OAuth 2.0 Client ID
4. Type: Web application
5. Authorized redirect URIs: http://localhost:3000/auth/google/callback
6. Copier Client ID et Client Secret dans .env
```

#### 5. Facebook OAuth

```bash
1. Facebook Developers: https://developers.facebook.com
2. Create App > Business
3. Add Product: Facebook Login
4. Settings: Valid OAuth Redirect URIs: http://localhost:3000/auth/facebook/callback
5. Copier App ID et App Secret dans .env
```

### Variables d'Environnement

**backend/.env**:
```env
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@host:5432/musicroom

# JWT
JWT_SECRET=your-secret-here-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Spotify
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/spotify/callback

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/auth/facebook/callback

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# Clients
FRONTEND_URL=http://localhost:19006
WEB_URL=http://localhost:3001
```

**mobile/.env**:
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3000
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your-spotify-client-id
```

---

## ✅ Conformité aux Exigences PDF

### Checklist Complète Mandatory

#### Gestion Utilisateurs
- [x] Inscription email/password
- [x] Login email/password
- [x] OAuth Google
- [x] OAuth Facebook
- [x] Linking comptes sociaux après inscription
- [x] Validation email (si email/password)
- [x] Reset password (si email/password)
- [x] Profil avec 3 niveaux privacy:
  - [x] Informations publiques
  - [x] Informations amis uniquement
  - [x] Informations privées
- [x] Préférences musicales dans profil
- [x] **Système d'amis** (send/accept/reject/list)

#### Services (2 sur 3 requis)
- [ ] ~~Music Track Vote~~ (NON IMPLÉMENTÉ - choix stratégique)
- [x] **Music Playlist Editor** (SERVICE #1)
  - [x] Création playlists collaboratives
  - [x] Édition temps réel multi-utilisateurs
  - [x] Visibility public/private
  - [x] Public: tous ont accès
  - [x] Private: invités uniquement
  - [x] License management
  - [x] Par défaut: tous peuvent éditer
  - [x] Avec license: invités uniquement peuvent éditer
  - [x] Gestion concurrence (conflict resolution)
  - [x] Gestion collaborateurs
- [x] **Music Control Delegation** (SERVICE #2)
  - [x] License management par device
  - [x] Délégation à différents amis
  - [x] Permissions granulaires
  - [x] Multi-devices support

#### Server & API
- [x] Backend custom (Node.js/Express)
- [x] Backend = source of truth
- [x] API REST
- [x] Format JSON
- [x] Documentation API (Swagger/OpenAPI)
- [x] Technologies justifiées (section dédiée)
- [x] Pas de librairies committées
- [x] Dépendances auto-téléchargeables (Makefile)

#### Application Mobile
- [x] Android (React Native)
- [x] Toutes fonctionnalités accessibles
- [x] Backend URL configurable (.env)
- [x] OAuth intégré (Google + Facebook)

#### Sécurité
- [x] Isolation données utilisateurs (RLS ou logique applicative)
- [x] Protection bruteforce (rate limiting)
- [x] Protection session theft (JWT sécurisé)
- [x] Malicious behaviors identifiés et documentés
- [x] Mécanismes de protection implémentés
- [x] Logging complet:
  - [x] Platform (Android/iOS/Web)
  - [x] Device (modèle)
  - [x] App Version
- [x] Credentials dans .env
- [x] .gitignore pour secrets
- [x] Analyse vulnérabilités documentée

#### Performance & Ramp-up
- [x] Outils load testing (k6)
- [x] Évaluation capacité (nb users simultanés)
- [x] Tests sur les 3... 2 services
- [x] Specs serveur documentées
- [x] Justification capacité vs platform

#### Qualité & Agilité
- [x] Tests unitaires
- [x] Tests d'intégration
- [x] CI/CD (GitHub Actions)
- [x] Travail en équipe (Git workflow)

### Checklist Bonus

- [x] **Multi-platform** (Web responsive avec Next.js)
- [x] **IoT** (iBeacon pour proximity events)
- [x] **Subscriptions** (Free vs Premium avec feature flags)
- [x] **Offline Mode** (Cache local + sync queue + conflict resolution)

### Respect "SDK must not do your work"

| Composant | SDK Utilisé | Notre Implémentation | ✅/❌ |
|-----------|-------------|----------------------|-------|
| **Auth JWT** | jsonwebtoken (crypto lib) | Toute la logique auth | ✅ |
| **Password** | bcrypt (crypto lib) | Hash/verify par nous | ✅ |
| **OAuth Google** | Passport.js (verification) | Flow + session + DB | ✅ |
| **OAuth Facebook** | Passport.js (verification) | Flow + session + DB | ✅ |
| **Email** | Nodemailer (SMTP client) | Validation system | ✅ |
| **Realtime** | Socket.io (protocol) | Rooms + broadcast + sync | ✅ |
| **Database** | pg (SQL client) | Requêtes + models + logic | ✅ |
| **Spotify** | spotify-web-api-node (API client) | Business logic playlists | ✅ |

**Verdict**: ✅ Tous les SDKs sont des **outils** (crypto, clients HTTP, protocols), pas des **solutions complètes**. La logique métier est 100% notre code.

---

## 📊 Timeline & Roadmap

### Durée Totale Estimée: 18 semaines (~4.5 mois) ⚡

```
Semaines 1-2   ████████░░░░░░░░░░░░ Infrastructure & Config
Semaine  2.5   ░░░░░░░░████ Auth Supabase (3-4 jours!)
Semaine  3     ░░░░░░░░░░░░████ Système d'Amis
Semaines 4-5   ░░░░░░░░░░░░░░░░████████ Spotify Integration
Semaines 6-8   ░░░░░░░░░░░░░░░░░░░░░░░░████████████ Playlist Editor
Semaines 9-10  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████ Control Delegation
Semaine  11    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████ Security & API Docs
Semaines 12-13 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████ Web Responsive
Semaine  14    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████ Subscriptions
Semaines 15-16 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████ Offline Mode
Semaine  17    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████ IoT/iBeacon
Semaine  18    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████ Testing & Deploy
```

### Phases Détaillées v3.0

| Phase | v2.0 | v3.0 | Priorité | Description |
|-------|------|------|----------|-------------|
| **Phase 1** | 2 sem | 2 sem | 🔴 CRITIQUE | Infrastructure, DB, setup projets |
| **Phase 2** | 2 sem | **3-4 jours** ⚡ | 🔴 CRITIQUE | Auth Supabase (gain -10 jours) |
| **Phase 3** | 1 sem | 1 sem | 🔴 CRITIQUE | Système d'amis (requis pour profils) |
| **Phase 4** | 2 sem | 2 sem | 🔴 CRITIQUE | Spotify API + SDK (requis pour musique) |
| **Phase 5** | 3 sem | 3 sem | 🔴 CRITIQUE | Playlist Editor (service #1 mandatory) |
| **Phase 6** | 2 sem | 2 sem | 🔴 CRITIQUE | Control Delegation (service #2 mandatory) |
| **Phase 7** | 1 sem | 1 sem | 🔴 CRITIQUE | Security + API docs |
| **Phase 8** | 2 sem | 2 sem | 🟡 BONUS | Web responsive |
| **Phase 9** | 1 sem | 1 sem | 🟡 BONUS | Subscriptions (feature flags) |
| **Phase 10** | 2 sem | 2 sem | 🟡 BONUS | Offline mode |
| **Phase 11** | 1 sem | 1 sem | 🟡 BONUS | IoT (iBeacon) |
| **Phase 12** | 2 sem | 1 sem | 🔴 CRITIQUE | Testing + Load tests + Deploy |
| **TOTAL** | **21 sem** | **18 sem** | | **Gain: 3 semaines** ⚡ |

### Milestones v3.0

- **M1 (Semaine 2.5)**: Auth Supabase fonctionnelle (login, OAuth, profils) ⚡ RAPIDE
- **M2 (Semaine 5)**: Spotify intégré, recherche + lecture OK
- **M3 (Semaine 8)**: Playlist Editor fonctionnelle avec Socket.io
- **M4 (Semaine 10)**: Control Delegation fonctionnelle
- **M5 (Semaine 11)**: Mandatory COMPLET + API documentée ✅
- **M6 (Semaine 17)**: Tous les bonus implémentés
- **M7 (Semaine 18)**: Projet testé, load tested, déployé, documenté 🚀

---

## 🤝 Contribution & Workflow

### Git Workflow

```
main (production)
  └── develop (integration)
      ├── feature/auth-system
      ├── feature/playlist-editor
      ├── feature/spotify-integration
      └── bugfix/token-refresh
```

### Conventions

- **Branches**: `feature/`, `bugfix/`, `hotfix/`
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
- **PR**: Code review obligatoire avant merge
- **Tests**: Obligatoires pour merge sur develop

---

## 📝 Documentation

- **API**: http://localhost:3000/api-docs (Swagger UI)
- **Architecture**: `/docs/architecture/decisions.md`
- **Setup Guide**: `/docs/guides/SETUP.md`
- **Security Analysis**: `/docs/security/analysis.md`

---

## 📄 License

MIT

---

## 📞 Support

Pour questions ou problèmes :
- Créer une issue sur GitHub
- Consulter `/docs/guides/`

---

**Note**: Ce README sera mis à jour au fur et à mesure de l'avancement. Version actuelle: 2.0 (révisée pour conformité PDF).

**Dernière mise à jour**: 2025-01-24

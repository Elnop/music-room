# Guide de Démarrage - Zumik

## 🎯 Phase 1 & 2 : Backend Auth (Terminée ✅)

Le backend avec le système d'authentification complet est maintenant créé !

### ✅ Ce qui a été créé :

```
backend/
├── src/
│   ├── features/
│   │   └── auth/                    # ✅ Feature Auth complète
│   │       ├── auth.types.ts        # Types TypeScript
│   │       ├── auth.validators.ts   # Validation Zod
│   │       ├── auth.service.ts      # Business logic
│   │       ├── auth.controller.ts   # Handlers Express
│   │       ├── auth.middleware.ts   # JWT verification
│   │       ├── auth.routes.ts       # Routes API
│   │       └── index.ts             # Exports publics
│   ├── shared/
│   │   ├── config/                  # ✅ Configuration
│   │   │   ├── env.ts               # Validation env variables
│   │   │   └── supabase.ts          # Clients Supabase
│   │   ├── types/                   # ✅ Types globaux
│   │   ├── utils/                   # ✅ Utilitaires
│   │   │   └── logger.ts            # Logger
│   │   └── middleware/              # ✅ Middleware globaux
│   │       └── error-handler.ts     # Gestion erreurs
│   └── server.ts                    # ✅ Point d'entrée
├── migrations/
│   └── 001_initial_schema.sql       # ✅ Migration user_profiles
├── package.json                     # ✅ Dependencies
├── tsconfig.json                    # ✅ Config TypeScript
├── Makefile                         # ✅ Commandes utiles
└── README.md                        # ✅ Documentation
```

---

## 🚀 Prochaines étapes

### Étape 1 : Configurer Supabase (15 min)

1. **Créer un compte Supabase**
   - Allez sur https://supabase.com
   - Créez un compte gratuit

2. **Créer un projet**
   - Cliquez sur "New Project"
   - Nom du projet : `zumik`
   - Choisissez une région proche de vous
   - Créez un mot de passe fort (notez-le !)
   - Attendez ~2 minutes que le projet soit créé

3. **Récupérer les credentials**
   - Allez dans `Settings` → `API`
   - Copiez les valeurs suivantes :
     - `URL` (Project URL)
     - `anon public` (API Key - anon key)
     - `service_role` (API Key - service_role key) ⚠️ Secret !

### Étape 2 : Setup Backend (5 min)

```bash
cd backend
make setup
```

Ensuite, éditez le fichier `.env` créé :

```bash
nano .env  # ou votre éditeur préféré
```

Remplacez les valeurs par vos credentials Supabase :

```env
SUPABASE_URL=https://votre-project-id.supabase.co
SUPABASE_ANON_KEY=votre-anon-key-ici
SUPABASE_SERVICE_KEY=votre-service-role-key-ici
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:8081,exp://localhost:8081
```

### Étape 3 : Exécuter la migration SQL (5 min)

1. Allez dans Supabase Dashboard → `SQL Editor`
2. Cliquez sur `New Query`
3. Ouvrez le fichier `backend/migrations/001_initial_schema.sql`
4. Copiez tout le contenu
5. Collez-le dans l'éditeur SQL
6. Cliquez sur `Run` (ou Ctrl+Enter)

✅ Vous devriez voir : "Success. No rows returned"

**Vérification** : Allez dans `Table Editor` → vous devriez voir la table `user_profiles`

### Étape 4 : Lancer le backend (2 min)

```bash
cd backend
make dev
```

Vous devriez voir :

```
🚀 Zumik backend is running!
📍 Server: http://localhost:3000
🏥 Health: http://localhost:3000/health
🔐 Auth API: http://localhost:3000/api/auth
🌍 Environment: development
```

### Étape 5 : Tester l'API avec curl (5 min)

#### Test 1 : Health check

```bash
curl http://localhost:3000/health
```

#### Test 2 : Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "username": "testuser",
    "displayName": "Test User"
  }'
```

Vous devriez recevoir une réponse avec un `access_token` et `refresh_token`.

**Copiez le `access_token`** pour le prochain test !

#### Test 3 : Get current user

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN_ICI"
```

Remplacez `VOTRE_ACCESS_TOKEN_ICI` par le token reçu.

#### Test 4 : Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

---

## ✅ Backend Auth est fonctionnel !

Si tous les tests passent, votre backend est **100% opérationnel** ! 🎉

---

## 📱 Prochaine étape : Mobile React Native + Expo

Voulez-vous que je crée maintenant l'application mobile Expo avec l'intégration Supabase et les écrans d'authentification ?

Les prochaines tâches seraient :
1. Initialiser le projet Expo avec TypeScript
2. Configurer le client Supabase mobile
3. Créer les écrans Login/Register
4. Intégrer Zustand pour la gestion d'état
5. Tester le flow auth end-to-end (mobile → backend)

**Commande pour commencer** :
```bash
# Depuis la racine du projet
npx create-expo-app@latest mobile --template blank-typescript
```

Voulez-vous que je continue avec le mobile ?

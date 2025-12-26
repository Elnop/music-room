# Migration vers les Types Supabase Générés

Ce guide explique comment migrer le code backend pour utiliser les types TypeScript générés automatiquement depuis le schéma Supabase.

## Pourquoi générer les types ?

Actuellement, le projet a **202 warnings ESLint** liés aux manipulations de valeurs `any` provenant des queries Supabase non typées. En générant les types depuis le schéma, on obtient :

- ✅ **Type safety complet** pour toutes les queries Supabase
- ✅ **Autocomplétion IDE** pour les noms de tables et colonnes
- ✅ **Détection d'erreurs à la compilation** au lieu du runtime
- ✅ **0 warnings ESLint** au lieu de 202

## Étape 1 : Configuration

### 1.1 Installer Supabase CLI

✅ **Déjà installé !** Supabase CLI est inclus dans les `devDependencies` du projet.

Si vous avez fait `make install` ou `npm install`, le CLI est déjà disponible via `npx supabase`.

> **Documentation officielle** : https://supabase.com/docs/guides/cli/getting-started

### 1.2 Se connecter à Supabase

Authentification requise pour accéder aux projets distants :

**Via Makefile (recommandé)** :
```bash
make supabase-login
```

**Ou directement** :
```bash
cd backend
npx supabase login
```

Vous aurez besoin d'un **Personal Access Token** disponible ici :
https://supabase.com/dashboard/account/tokens

Le login est **une opération unique** (le token est stocké localement).

### 1.3 Obtenir le Project ID

1. Ouvrir le dashboard Supabase : https://supabase.com/dashboard
2. Sélectionner votre projet
3. L'URL contient votre project ID : `https://supabase.com/dashboard/project/YOUR_PROJECT_ID`

### 1.4 Ajouter le Project ID dans .env

```bash
# backend/.env
SUPABASE_PROJECT_ID=your-project-id-here
```

## Étape 2 : Générer les types

```bash
make generate-types
```

Cela créera le fichier `backend/src/shared/types/supabase.generated.ts` avec tous les types de votre schéma.

**Note** : La commande vérifie automatiquement :
- Que `.env` existe et contient `SUPABASE_PROJECT_ID`
- Que vous êtes authentifié avec Supabase
- Génère les types pour le schéma `public`

## Étape 3 : Activer les helpers

Décommenter le code dans `src/shared/types/supabase.helpers.ts` pour activer les helpers de types.

## Étape 4 : Migrer le code

### Avant (sans types) :

```typescript
// auth/services/user.service.ts
async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // ⚠️ data est de type 'any' - 0 type safety
  return data;
}
```

### Après (avec types générés) :

```typescript
// shared/config/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/shared/types/supabase.generated';

export const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// auth/services/user.service.ts
import { Tables } from '@/shared/types/supabase.helpers';

type UserProfile = Tables<'user_profiles'>;

async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')  // ✅ Autocomplété avec toutes les tables
    .select('*')             // ✅ Colonnes typées
    .eq('id', userId)        // ✅ Vérifie que 'id' existe dans user_profiles
    .single();

  // ✅ data est de type UserProfile - 100% type safe
  return data;
}
```

## Étape 5 : Exemples de migration par feature

### Auth Service

**Avant** :
```typescript
const { data } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('email', email)
  .single();

const username = data.username;  // ⚠️ TypeScript ne vérifie rien
```

**Après** :
```typescript
import { Tables } from '@/shared/types/supabase.helpers';

type UserProfile = Tables<'user_profiles'>;

const { data } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('email', email)
  .single();

const username = data.username;  // ✅ TypeScript vérifie que username existe
```

### Playlist Service

**Avant** :
```typescript
const { data: playlists } = await supabase
  .from('playlists')
  .select('*')
  .eq('owner_id', userId);

// ⚠️ playlists est de type any[]
```

**Après** :
```typescript
import { Tables } from '@/shared/types/supabase.helpers';

type Playlist = Tables<'playlists'>;

const { data: playlists } = await supabase
  .from('playlists')
  .select('*')
  .eq('owner_id', userId);

// ✅ playlists est de type Playlist[]
```

### Insertions typées

**Avant** :
```typescript
const { data } = await supabase
  .from('playlists')
  .insert({
    name: 'My Playlist',
    owner_id: userId,
    // ⚠️ Aucune vérification des champs requis
  });
```

**Après** :
```typescript
import { Insertable } from '@/shared/types/supabase.helpers';

type NewPlaylist = Insertable<'playlists'>;

const newPlaylist: NewPlaylist = {
  name: 'My Playlist',
  owner_id: userId,
  collaborator_ids: [],
  viewer_ids: [],
  visibility: 'private',
  edit_mode: 'restricted',
  // ✅ TypeScript force tous les champs requis
};

const { data } = await supabase
  .from('playlists')
  .insert(newPlaylist);
```

## Étape 6 : Mettre à jour ESLint config

Une fois tous les services migrés, restaurer les règles strictes dans `eslint.config.js` :

```javascript
rules: {
  '@typescript-eslint/no-unsafe-assignment': 'error',  // warn → error
  '@typescript-eslint/no-unsafe-member-access': 'error',  // warn → error
  // ... etc
}
```

## Étape 7 : Workflow après changement de schéma

**Important** : Les types Supabase générés sont commitées dans Git pour simplifier l'onboarding de l'équipe.

Après chaque modification du schéma Supabase (ajout/suppression de table ou colonne) :

```bash
# 1. Exécuter la migration SQL dans Supabase Dashboard

# 2. Régénérer les types localement (depuis la racine du projet)
make generate-types

# 3. Vérifier les changements
git diff backend/src/shared/types/supabase.generated.ts

# 4. Commiter les types mis à jour
git add backend/src/shared/types/supabase.generated.ts
git commit -m "chore: regenerate Supabase types after schema changes"
```

**Avantage** : Les autres développeurs reçoivent les types à jour automatiquement via `git pull`, sans besoin de configurer Supabase CLI localement.

## Ordre de migration recommandé

1. ✅ **Générer les types** (Étape 1-2)
2. ✅ **Migrer les services auth** (le plus utilisé)
3. **Migrer les services playlists**
4. **Migrer les services profile**
5. **Migrer les services friends**
6. **Migrer les services music-control**
7. **Restaurer les règles ESLint strictes**

## Résultat attendu

Après migration complète :
- **Avant** : 202 warnings ESLint, type safety ~40%
- **Après** : 0 warnings ESLint, type safety ~95%

## Ressources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Generating TypeScript Types](https://supabase.com/docs/guides/api/rest/generating-types)
- [TypeScript Support](https://supabase.com/docs/guides/api/rest/typescript-support)

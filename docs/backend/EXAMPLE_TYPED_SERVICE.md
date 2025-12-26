# Exemple : Service Auth avec Types Supabase

Ce fichier montre comment migrer `auth/services/user.service.ts` vers les types Supabase générés.

## Fichier original (avec warnings)

```typescript
// ❌ 50+ warnings ESLint
import { supabase } from '@/shared/config/supabase';

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    throw new Error('User not found');
  }

  // ⚠️ Warning: Unsafe assignment of an `any` value
  return data;
}

export async function createUser(userData: {
  email: string;
  username: string;
  displayName?: string;
}) {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      email: userData.email,
      username: userData.username,
      display_name: userData.displayName,
      // ⚠️ Pas de vérification des champs manquants (avatar_url, bio, etc.)
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // ⚠️ Warning: Unsafe return of a value of type `any`
  return data;
}
```

## Fichier migré (0 warnings)

```typescript
// ✅ 0 warnings ESLint, 100% type-safe
import { supabase } from '@/shared/config/supabase';
import { Tables, Insertable } from '@/shared/types/supabase.helpers';

// Types extraits du schéma généré
type UserProfile = Tables<'user_profiles'>;
type NewUserProfile = Insertable<'user_profiles'>;

export async function getUserByEmail(email: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('user_profiles')  // ✅ Autocomplété
    .select('*')             // ✅ Colonnes typées
    .eq('email', email)      // ✅ Vérifie que 'email' existe
    .single();

  if (error) {
    throw new Error('User not found');
  }

  // ✅ data est de type UserProfile - TypeScript happy!
  return data;
}

export async function createUser(userData: {
  email: string;
  username: string;
  displayName?: string;
}): Promise<UserProfile> {
  // ✅ TypeScript force tous les champs requis
  const newUser: NewUserProfile = {
    email: userData.email,
    username: userData.username,
    display_name: userData.displayName ?? null,
    avatar_url: null,
    bio: null,
    google_id: null,
    facebook_id: null,
    // created_at et updated_at sont auto-générés par Supabase
  };

  const { data, error } = await supabase
    .from('user_profiles')
    .insert(newUser)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // ✅ data est de type UserProfile - 100% type-safe
  return data;
}

// Bonus : Accès typé aux propriétés
export function formatUserProfile(profile: UserProfile): string {
  // ✅ Autocomplétion pour toutes les propriétés
  const name = profile.display_name ?? profile.username;
  const email = profile.email;  // ✅ TypeScript sait que email existe
  const bio = profile.bio ?? 'No bio';

  return `${name} (${email}) - ${bio}`;
}
```

## Avantages de la migration

### 1. Type Safety à la compilation

**Avant** :
```typescript
const user = await getUserByEmail('test@test.com');
console.log(user.usrname);  // ⚠️ Typo! Runtime error
```

**Après** :
```typescript
const user = await getUserByEmail('test@test.com');
console.log(user.usrname);  // ❌ Compile error: Property 'usrname' does not exist
console.log(user.username); // ✅ OK
```

### 2. Autocomplétion IDE

Tapez `user.` et l'IDE propose automatiquement :
- `id`
- `email`
- `username`
- `display_name`
- `avatar_url`
- `bio`
- `google_id`
- `facebook_id`
- `created_at`
- `updated_at`

### 3. Détection des champs manquants

**Avant** :
```typescript
const newUser = {
  email: 'test@test.com',
  // ⚠️ Oublie de username - erreur au runtime
};
await supabase.from('user_profiles').insert(newUser);
```

**Après** :
```typescript
const newUser: NewUserProfile = {
  email: 'test@test.com',
  // ❌ TypeScript error: Property 'username' is missing
};
```

### 4. Refactoring sûr

Si vous renommez une colonne dans Supabase (ex: `display_name` → `full_name`) :

**Avant** : Erreurs au runtime partout où `display_name` est utilisé

**Après** :
1. Régénérer les types : `npm run generate-types`
2. TypeScript affiche toutes les erreurs de compilation
3. Corriger chaque usage avant de deployer

## Checklist de migration

- [ ] Générer les types : `npm run generate-types`
- [ ] Importer les types helpers
- [ ] Définir les types locaux (`UserProfile`, `NewUserProfile`, etc.)
- [ ] Ajouter les types de retour aux fonctions
- [ ] Typer les paramètres de création/update
- [ ] Vérifier avec `npm run type-check`
- [ ] Vérifier avec `npm run lint` (0 warnings)
- [ ] Tester les endpoints

## Impact sur les warnings ESLint

**user.service.ts** (167 lignes) :
- Avant : 30+ warnings
- Après : 0 warnings

**Gain pour tout le projet** :
- Avant : 202 warnings
- Après migration complète : ~0-10 warnings (non liés à Supabase)

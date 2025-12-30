# Commandes Supabase - Guide Rapide

Ce guide liste toutes les commandes Make disponibles pour travailler avec Supabase.

## 📋 Commandes disponibles

### `make supabase-status`

Vérifie le statut de Supabase CLI et de l'authentification.

```bash
make supabase-status
```

**Affiche** :
- ✓ Version du CLI Supabase installée
- ✓ Statut de l'authentification
- ✓ Liste des projets accessibles

**Exemple de sortie** :
```
=== Supabase CLI Status ===

2.70.5
✓ Supabase CLI installed

  LINKED | ORG ID | REFERENCE ID | NAME       | REGION | CREATED AT
  -------|--------|--------------|------------|--------|-------------
         | ...    | vkhspk...    | zumik | EU     | 2025-11-24

✓ Authenticated
```

---

### `make supabase-login`

Authentification à Supabase CLI (opération unique).

```bash
make supabase-login
```

**Ce qui se passe** :
1. Ouvre le navigateur sur https://supabase.com/dashboard/account/tokens
2. Vous invite à créer/copier un Personal Access Token
3. Vous demande de coller le token dans le terminal

**Note** : Le token est stocké localement, cette commande n'est nécessaire qu'une seule fois par machine.

---

### `make generate-types`

Génère les types TypeScript depuis le schéma Supabase.

```bash
make generate-types
```

**Pré-requis** :
- ✓ Authentifié via `make supabase-login`
- ✓ `SUPABASE_PROJECT_ID` configuré dans `backend/.env`

**Génère** :
- Fichier : `backend/src/shared/types/supabase.generated.ts`
- Taille : ~12KB (dépend du schéma)

**Ce que fait la commande** :
1. Vérifie que `backend/.env` existe
2. Vérifie que `SUPABASE_PROJECT_ID` est configuré
3. Vérifie l'authentification Supabase
4. Génère les types pour le schéma `public`
5. Affiche un message de succès avec instructions

**Après génération** :
```bash
# Vérifier les changements
git diff backend/src/shared/types/supabase.generated.ts

# Commiter les types
git add backend/src/shared/types/supabase.generated.ts
git commit -m "chore: regenerate Supabase types after schema changes"
```

---

## 🔄 Workflow complet

### Première fois (configuration)

```bash
# 1. Vérifier le statut
make supabase-status

# 2. S'authentifier si nécessaire
make supabase-login

# 3. Générer les types
make generate-types

# 4. Commiter les types
git add backend/src/shared/types/supabase.generated.ts
git commit -m "chore: add initial Supabase generated types"
```

### Après changement de schéma

```bash
# 1. Faire les modifications dans Supabase Dashboard (migrations SQL)

# 2. Régénérer les types
make generate-types

# 3. Vérifier et commiter
git diff backend/src/shared/types/supabase.generated.ts
git add backend/src/shared/types/supabase.generated.ts
git commit -m "chore: regenerate Supabase types after schema changes"
```

### Nouveau développeur (onboarding)

```bash
# 1. Cloner le repo
git clone ...
cd zumik

# 2. Installer les dépendances
make install

# 3. S'authentifier à Supabase
make supabase-login

# 4. Les types sont déjà dans le repo !
# Aucune génération nécessaire si le schéma n'a pas changé
```

---

## ❌ Résolution de problèmes

### Erreur : "Not authenticated with Supabase"

**Solution** :
```bash
make supabase-login
```

### Erreur : "SUPABASE_PROJECT_ID not configured"

**Solution** :
```bash
# Ajouter dans backend/.env
echo "SUPABASE_PROJECT_ID=your-project-id" >> backend/.env
```

Trouver votre Project ID dans l'URL du dashboard :
`https://supabase.com/dashboard/project/YOUR_PROJECT_ID`

### Erreur : ".env file not found"

**Solution** :
```bash
# Créer le fichier .env depuis l'exemple
cp backend/.env.example backend/.env
# Puis éditer backend/.env avec vos valeurs
```

### Erreur : "Supabase CLI not installed"

Le CLI devrait être installé automatiquement via npm.

**Solution** :
```bash
cd backend
npm install
```

---

## 📚 Documentation complète

- [SUPABASE_TYPES_MIGRATION.md](SUPABASE_TYPES_MIGRATION.md) - Guide complet de migration
- [EXAMPLE_TYPED_SERVICE.md](EXAMPLE_TYPED_SERVICE.md) - Exemple avant/après
- [TYPESCRIPT_LINT_SOLUTIONS.md](TYPESCRIPT_LINT_SOLUTIONS.md) - Comparaison des solutions

## 🔗 Liens utiles

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Personal Access Tokens](https://supabase.com/dashboard/account/tokens)
- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Type Generation Docs](https://supabase.com/docs/guides/api/rest/generating-types)

# Documentation Music Room

Ce dossier contient toute la documentation technique du projet Music Room.

## Structure

```
docs/
├── README.md                          # Ce fichier
└── backend/                           # Documentation backend
    ├── SUPABASE_COMMANDS.md          # Guide rapide des commandes Supabase
    ├── SUPABASE_TYPES_MIGRATION.md   # Guide de migration vers types Supabase générés
    ├── EXAMPLE_TYPED_SERVICE.md      # Exemple avant/après de migration
    └── TYPESCRIPT_LINT_SOLUTIONS.md  # Comparaison de 3 solutions pour les warnings ESLint
```

## Documentation Backend

### Génération de types Supabase

Le backend utilise des types TypeScript générés automatiquement depuis le schéma Supabase pour une meilleure type-safety.

**Quick Start** :
```bash
# 1. S'authentifier (une seule fois)
make supabase-login

# 2. Générer les types
make generate-types

# 3. Vérifier le statut
make supabase-status
```

**Documentation détaillée** :
- [SUPABASE_COMMANDS.md](backend/SUPABASE_COMMANDS.md) - 📖 Guide rapide des commandes (START HERE)
- [SUPABASE_TYPES_MIGRATION.md](backend/SUPABASE_TYPES_MIGRATION.md) - Guide complet de migration
- [EXAMPLE_TYPED_SERVICE.md](backend/EXAMPLE_TYPED_SERVICE.md) - Exemple concret avec le service auth
- [TYPESCRIPT_LINT_SOLUTIONS.md](backend/TYPESCRIPT_LINT_SOLUTIONS.md) - Comparaison des approches

## Commandes Make

Voir la documentation complète avec :
```bash
make help
```

Section Supabase :
- `make supabase-login` - Authentification Supabase CLI
- `make generate-types` - Génération des types TypeScript
- `make supabase-status` - Vérification du statut

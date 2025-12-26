# Backend Documentation

La documentation du backend se trouve dans le dossier `/docs` à la racine du projet.

## Documentation Supabase

- [📖 Guide de migration Supabase Types](../docs/backend/SUPABASE_TYPES_MIGRATION.md)
- [📝 Exemple de service typé](../docs/backend/EXAMPLE_TYPED_SERVICE.md)
- [🔧 Solutions TypeScript/ESLint](../docs/backend/TYPESCRIPT_LINT_SOLUTIONS.md)

## Commandes utiles

```bash
# Génération de types Supabase
make supabase-login        # Authentification (une fois)
make generate-types        # Générer les types
make supabase-status       # Vérifier le statut

# Développement
make dev                   # Menu interactif
make dev-docker            # Mode Docker
make dev-local             # Mode local

# Qualité du code
make lint                  # Linter
make lint-fix              # Auto-fix
make format                # Prettier
make test                  # Tests
```

Voir toutes les commandes : `make help`

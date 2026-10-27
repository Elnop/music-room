# Scénario : documentation de l'API

**Prouve** : IV.4, *"This API reference documentation must introduce methods, inputs and outputs"*, et IV.3, *"The back-end is the reference"*.

**Prérequis** : backend lancé, http://localhost:3000/api-docs ouvert.

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 1 | Parcourir les groupes (auth, profile, friends, playlists, music-control, queue…) | Chaque route a sa méthode, ses paramètres, son corps et ses réponses, erreurs comprises | ☐ |
| 2 | `POST /api/auth/login` avec `bob@zumik.dev` / `Password123!` | `200`, la réponse contient le jeton d'accès | ☐ |
| 3 | **Authorize** avec ce jeton, puis `GET /api/playlists` | `200` en JSON, les mêmes playlists que dans l'app de Bob | ☐ |
| 4 | `POST /api/playlists` avec un corps vide | `400 VALIDATION_ERROR`, avec `why` et `fix` | ☐ |
| 5 | Créer une playlist depuis Swagger | Elle apparaît dans l'app de Bob : app et API passent par le même backend | ☐ |
| 6 | `cd backend && npx vitest run src/app/openapi-coverage.test.ts` | Passe : aucune route montée n'est absente de la documentation | ☐ |

**À dire** : la documentation est générée à partir des schémas Zod qui valident les requêtes (`*.validators.ts` → `*.openapi.ts`). Le sujet accepte explicitement une référence générée : *"It can be self-generated with Swagger"*.

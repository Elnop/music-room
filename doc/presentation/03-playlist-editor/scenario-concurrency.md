# Scénario : le même titre déplacé par deux personnes

**Prouve** : IV.2.3, *"if several people move different tracks or the same one in a playlist"*.

À deux mains sur deux téléphones, le conflit est difficile à provoquer : le serveur répond en quelques millisecondes. On le provoque donc de façon déterministe avec Swagger UI, puis on montre les tests automatisés.

**Prérequis** : http://localhost:3000/api-docs, un jeton de Bob (`POST /api/auth/login` puis **Authorize**). « Jellyfishing Jams » a l'id `5b0b0000-0000-4000-8000-000000000102`.

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 1 | `GET /api/playlists/{id}` | Les titres avec leur `rank`, et `tracksVersion` (noter `v`) | ☐ |
| 2 | `POST /api/playlists/{id}/tracks/{trackId}/move` sur le 3ᵉ titre, avec `afterRank` = `null` et `expectedVersion` = `v` | `200` : le titre passe en tête et la version augmente | ☐ |
| 3 | Rejouer **la même requête**, toujours avec `expectedVersion` = `v` | `409 TRACK_MOVED_CONCURRENTLY` : c'est ce que reçoit le second déplacement du même titre, fait sur une vue périmée | ☐ |
| 4 | Déplacer **un autre titre** avec `expectedVersion` = `v` (la version périmée) | `200` : un déplacement d'un titre différent passe toujours | ☐ |
| 5 | Un téléphone avait la playlist ouverte pendant ces requêtes | Il affiche l'ordre final sans recharger | ☐ |
| 6 | `make test-db-up`, puis `cd backend && npx vitest run --config vitest.int.config.ts src/features/playlists/services/track-operations.int.test.ts` | Les tests de déplacements, ajouts et retraits concurrents passent | ☐ |

**À dire** :

- **Rangs fractionnaires** : déplacer un titre ne réécrit que sa ligne, donc un déplacement concurrent ne décale jamais la cible d'un autre.
- **Verrou de playlist** dans chaque fonction SQL : les écritures sur une playlist passent une par une, sans interblocage.
- **Invariants** : chaque titre reste présent exactement une fois, aucun déplacement n'est perdu sans que son auteur le sache, et tous les clients convergent.

Le tableau des cas est dans [playlist-concurrency.md](../../features/playlist-concurrency.md#the-two-cases-of-the-subject).

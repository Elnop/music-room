---
tracker_id: "85"
remote: "https://github.com/Elnop/music-room/issues/85"
type: epic
title: "Édition de playlist concurrente sûre (IV.2.3)"
parent: initiative-validation-mandatory
covers: [CAP-5, CAP-3]
after: []
assignee: ""
risk: high
---

# Édition de playlist concurrente sûre (IV.2.3)

## Description

Plusieurs utilisateurs déplacent, ajoutent ou retirent des tracks dans la même playlist en même temps sans jamais la corrompre, et la feature playlist est couverte par des tests. Les capacités sont dans la spec de l'initiative ; ce fichier est l'enveloppe, complétée à l'inception.

## Outcome

Le cas de concurrence cité par le sujet est géré et démontrable ; signal : CAP-5 de la spec.

## Done when

1. Sous réordonnancement, ajout et retrait concurrents, chaque track reste présente une seule fois et aucun déplacement n'est perdu sans que le client le sache (test).
2. Tous les clients convergent vers l'ordre du serveur, et `added_by` garde l'auteur de l'ajout.
3. Le CRUD playlist, `canViewPlaylist`, `canEditPlaylist` et `playlistStore` sont couverts par des tests.
4. Les endpoints modifiés sont documentés dans `playlist.openapi.ts`, et `doc/PLAYLIST_CONCURRENCY.md` décrit le comportement livré.
5. L'epic est mergé dans `develop` et vérifié (type-check, lint et tests au vert).

## Boundaries

Feature playlists (`backend/src/features/playlists/`, notification playlist de `realtime/index.ts`, `playlistStore`, écrans playlists). Les éditions de métadonnées restent en last-write-wins (spec, Assumptions).

## References

- parent — _bmad-output/initiative-validation-mandatory/initiative-validation-mandatory.md
- spec — _bmad-output/initiative-validation-mandatory/spec-mandatory-gaps/spec-mandatory-gaps.md, section Capabilities (CAP-5, CAP-3)
- audit — _bmad-output/audit-subject-v5-3/audit-subject-v5-3.md, preuves
- constraint — `AGENTS.md`, sections Policy et Conventions

## Notes

Decision: une éventuelle migration de cet epic passe après celle de epic-delegation-controle (numérotation, 2026-10-05).
Handoff: `realtime/index.ts` est aussi modifié par epic-delegation-controle ; les entrées qui y touchent attendent l'entrée correspondante de cet epic-là.
- Waits on epic-securite because: le contrôle d'accès aux rooms de playlist sur le socket.
- Decision: le spike 1 passe d'abord car la stratégie de concurrence décide du contrat, de la migration et du service ; tracer bullet ensuite 2 → 3 → 4 → 5 → 6 sur le seul réordonnancement (2026-10-05).
- Decision: les tests de concurrence tournent sur le Postgres d'intégration de 1.10, en local et en CI (choix de l'utilisateur, 2026-10-05).
- Decision: pas de story « Refactor sweep » (choix de l'utilisateur, 2026-10-05).
- Decision: stratégie de concurrence (spike 1) : ordre par rangs fractionnaires (`playlist_tracks.rank` texte `COLLATE "C"`, généré par une fonction SQL du projet) ; chaque opération est une fonction Postgres qui verrouille la playlist (`FOR UPDATE`) ; version `playlists.tracks_version` (bigint, +1 par add/remove/move) et `playlist_tracks.moved_at_version` ; un move `{ trackId, afterRank, expectedVersion }` est refusé en 409 seulement si la même track a bougé ou disparu depuis `expectedVersion` ; add et remove ne sont jamais refusés pour concurrence. Détail : `doc/PLAYLIST_CONCURRENCY.md` (choix de l'utilisateur, 2026-10-06).

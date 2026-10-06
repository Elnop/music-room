---
id: 2
type: story
title: "Contrat d'API d'édition concurrente"
parent: epic-editeur-playlist
covers: [CAP-5]
after: [1]
hitl: false
risk: medium
tracker_id: "87"
remote: "https://github.com/Elnop/music-room/issues/87"
tracker_status: backlog
---

# Contrat d'API d'édition concurrente

## Description

Définit dans playlist.openapi.ts, selon doc/PLAYLIST_CONCURRENCY.md : add, remove et move ({ trackId, afterRank, expectedVersion }, qui remplace reorder), la version tracks_version dans chaque réponse et dans le fetch de playlist, les erreurs 409 TRACK_DUPLICATE, TRACK_NOT_IN_PLAYLIST, TRACK_MOVED_CONCURRENTLY et 404 TRACK_NOT_IN_PLAYLIST, le rank de chaque track et le payload playlist:updated (version et ordre) ; les types dans playlist.types.ts et mobile/src/types/playlist.types.ts.

## Acceptance Criteria

Verify: Les endpoints et le payload apparaissent dans Swagger et dans les deux fichiers de types.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-editeur-playlist/epic-editeur-playlist.md

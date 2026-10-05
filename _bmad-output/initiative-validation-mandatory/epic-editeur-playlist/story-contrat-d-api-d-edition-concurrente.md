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

Définit dans playlist.openapi.ts les requêtes add, remove et reorder avec la version attendue, la réponse 409 et le payload playlist:updated (version et ordre), selon 1, et les types dans playlist.types.ts et mobile/src/types/playlist.types.ts.

## Acceptance Criteria

Verify: Les endpoints et le payload apparaissent dans Swagger et dans les deux fichiers de types.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-editeur-playlist/epic-editeur-playlist.md

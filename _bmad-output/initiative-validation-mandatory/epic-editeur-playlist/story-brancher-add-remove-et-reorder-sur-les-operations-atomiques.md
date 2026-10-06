---
id: 4
type: story
title: "Brancher add, remove et reorder sur les opérations atomiques (backend)"
parent: epic-editeur-playlist
covers: [CAP-5, CAP-3]
after: [2, 3]
hitl: false
risk: high
tracker_id: "89"
remote: "https://github.com/Elnop/music-room/issues/89"
tracker_status: backlog
---

# Brancher add, remove et reorder sur les opérations atomiques (backend)

## Description

Le service playlist-track appelle les fonctions de 3 par RPC (plus de suppression puis réinsertion), traduit leurs refus en 409 et 404 du contrat de 2, et conserve added_by.

## Acceptance Criteria

Verify: Tests d'intégration concurrents : move, ajout et retrait simultanés laissent chaque track une fois et added_by intact ; un move de la même track avec une version périmée renvoie 409 TRACK_MOVED_CONCURRENTLY.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-editeur-playlist/epic-editeur-playlist.md

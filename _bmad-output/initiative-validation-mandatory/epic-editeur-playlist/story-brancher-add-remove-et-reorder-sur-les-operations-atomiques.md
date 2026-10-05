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

Le service playlist-track utilise 3, vérifie la version attendue du contrat de 2, renvoie 409 en conflit et conserve added_by.

## Acceptance Criteria

Verify: Tests d'intégration concurrents : reorder, ajout et retrait simultanés laissent chaque track une fois et added_by intact ; version périmée renvoie 409.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-editeur-playlist/epic-editeur-playlist.md

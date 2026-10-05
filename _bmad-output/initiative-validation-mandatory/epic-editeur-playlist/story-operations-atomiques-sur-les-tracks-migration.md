---
id: 3
type: story
title: "Opérations atomiques sur les tracks (migration)"
parent: epic-editeur-playlist
covers: [CAP-5, CAP-3]
after: [1, 4.1, 1.10]
hitl: true
risk: high
tracker_id: "88"
remote: "https://github.com/Elnop/music-room/issues/88"
tracker_status: backlog
---

# Opérations atomiques sur les tracks (migration)

## Description

Ajoute la migration 016 (après la 015 de 4.1) selon la stratégie retenue en 1, pour que ajout, retrait et réordonnancement se fassent en une transaction ; régénère les types.

## Acceptance Criteria

Verify: Migration appliquée ; un test d'intégration sur le Postgres de 1.10 lance deux opérations concurrentes sans doublon ni trou de position.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-editeur-playlist/epic-editeur-playlist.md

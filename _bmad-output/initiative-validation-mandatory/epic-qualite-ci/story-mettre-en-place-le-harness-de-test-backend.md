---
id: 7
type: story
title: "Mettre en place le harness de test backend"
parent: epic-qualite-ci
covers: [CAP-3]
after: [6]
hitl: false
risk: medium
tracker_id: "55"
remote: "https://github.com/Elnop/music-room/issues/55"
tracker_status: backlog
---

# Mettre en place le harness de test backend

## Description

Installe le framework backend choisi en 6 avec ses helpers de mock, et un premier test réel sur canViewPlaylist et canEditPlaylist (fonctions pures), fichier que epic-editeur-playlist étendra.

## Acceptance Criteria

Verify: `npm test` dans backend/ exécute un test qui passe et échoue si on casse canViewPlaylist.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-qualite-ci/epic-qualite-ci.md

---
id: 6
type: story
title: "Gérer les conflits et converger côté mobile"
parent: epic-editeur-playlist
covers: [CAP-5, CAP-3]
after: [2, 1.8, 6.3]
hitl: false
risk: medium
tracker_id: "91"
remote: "https://github.com/Elnop/music-room/issues/91"
tracker_status: backlog
---

# Gérer les conflits et converger côté mobile

## Description

playlistStore envoie la version attendue, sur 409 recharge et prévient l'utilisateur, applique l'ordre de playlist:updated ; ses tests couvrent tout le store (chargement, CRUD, collaborateurs, conflits).

## Acceptance Criteria

Verify: Tests de playlistStore : 409 déclenche rechargement et message ; playlist:updated remplace l'ordre local ; CRUD et collaborateurs couverts.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-editeur-playlist/epic-editeur-playlist.md

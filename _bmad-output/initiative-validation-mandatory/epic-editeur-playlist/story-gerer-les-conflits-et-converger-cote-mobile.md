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

playlistStore envoie un move avec afterRank et la version affichée, un seul à la fois en reprenant la version de la réponse précédente ; sur 409 recharge et prévient l'utilisateur ; applique playlist:updated de version +1, ignore les versions déjà vues, recharge s'il en manque une ; ses tests couvrent tout le store (chargement, CRUD, collaborateurs, conflits).

## Acceptance Criteria

Verify: Tests de playlistStore : deux moves rapides partent l'un après l'autre avec la version renvoyée ; 409 déclenche rechargement et message ; playlist:updated remplace l'ordre local, une version manquante déclenche un rechargement ; CRUD et collaborateurs couverts.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-editeur-playlist/epic-editeur-playlist.md

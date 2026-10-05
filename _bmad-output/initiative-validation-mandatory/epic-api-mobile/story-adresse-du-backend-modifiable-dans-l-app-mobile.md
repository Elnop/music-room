---
id: 3
type: story
title: "Adresse du backend modifiable dans l'app (mobile)"
parent: epic-api-mobile
covers: [CAP-8, CAP-3]
after: [2.2, 1.8]
hitl: false
risk: medium
tracker_id: "96"
remote: "https://github.com/Elnop/music-room/issues/96"
tracker_status: backlog
---

# Adresse du backend modifiable dans l'app (mobile)

## Description

Ajoute aux réglages et à l'écran d'accueil un champ d'adresse persisté et un seul accès à l'URL à l'exécution, utilisé par api.ts, playlistApi.ts, socketStore, soundcloudStore et PlayerContext (qui passent par api.ts au lieu de fetch), avec reconnexion du socket.

## Acceptance Criteria

Verify: Test : changer l'adresse redirige le prochain appel API et la reconnexion socket ; démo sans rebuild.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-api-mobile/epic-api-mobile.md

---
id: 3
type: story
title: "Contrôler l'accès aux rooms de playlist (backend)"
parent: epic-securite
covers: [CAP-1, CAP-3]
after: [1]
hitl: false
risk: medium
tracker_id: "64"
remote: "https://github.com/Elnop/music-room/issues/64"
tracker_status: backlog
---

# Contrôler l'accès aux rooms de playlist (backend)

## Description

playlist:join vérifie canViewPlaylist avec l'identité de socket.data avant de rejoindre la room et renvoie une erreur sinon.

## Acceptance Criteria

Verify: Test : un non-invité ne reçoit aucun playlist:updated d'une playlist privée ; un invité les reçoit.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-securite/epic-securite.md

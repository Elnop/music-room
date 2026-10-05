---
id: 1
type: story
title: "Authentifier la connexion Socket.io par JWT (backend)"
parent: epic-securite
covers: [CAP-1, CAP-3]
after: [1.7]
hitl: false
risk: high
tracker_id: "62"
remote: "https://github.com/Elnop/music-room/issues/62"
tracker_status: backlog
---

# Authentifier la connexion Socket.io par JWT (backend)

## Description

Définit le contrat de poignée de main (handshake.auth : token, deviceId, deviceName, platform, appVersion) documenté dans realtime, vérifie le token avec verifyToken (session.service.ts) dans un middleware io.use, place l'identité et l'appareil dans socket.data et supprime l'event auth:register. Le socket hérite ainsi de la révocation ajoutée par 3.1.

## Acceptance Criteria

Verify: Tests : connexion sans token, avec token invalide ou expiré refusée ; l'identité de socket.data est celle du token ; auth:register n'est plus écouté.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-securite/epic-securite.md

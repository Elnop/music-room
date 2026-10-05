---
id: 5
type: story
title: "Loguer plateforme, appareil et version des events socket (backend)"
parent: epic-securite
covers: [CAP-1, CAP-3]
after: [1]
hitl: false
risk: low
tracker_id: "66"
remote: "https://github.com/Elnop/music-room/issues/66"
tracker_status: backlog
---

# Loguer plateforme, appareil et version des events socket (backend)

## Description

socket-logger.middleware.ts lit socket.data et ajoute plateforme, appareil et version à chaque event entrant ; les nouveaux events des autres epics passent par ce logger.

## Acceptance Criteria

Verify: Test : un event socket produit une ligne de log contenant plateforme, appareil et version.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-securite/epic-securite.md

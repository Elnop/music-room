---
id: 3
type: story
title: "Service des appareils et enregistrement à la connexion (backend)"
parent: epic-delegation-controle
covers: [CAP-4, CAP-3]
after: [1, 2.4, 2.5]
hitl: false
risk: medium
tracker_id: "80"
remote: "https://github.com/Elnop/music-room/issues/80"
tracker_status: backlog
---

# Service des appareils et enregistrement à la connexion (backend)

## Description

Crée le service des appareils et, à la poignée de main authentifiée de 2.1, crée ou met à jour l'appareil à partir du deviceId de socket.data.

## Acceptance Criteria

Verify: Test : une connexion crée l'appareil, une seconde met à jour sa dernière vue sans doublon.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-delegation-controle/epic-delegation-controle.md

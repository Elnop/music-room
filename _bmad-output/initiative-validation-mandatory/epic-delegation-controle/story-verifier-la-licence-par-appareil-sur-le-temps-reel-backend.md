---
id: 5
type: story
title: "Vérifier la licence par appareil sur le temps réel (backend)"
parent: epic-delegation-controle
covers: [CAP-4, CAP-3]
after: [4]
hitl: false
risk: high
tracker_id: "82"
remote: "https://github.com/Elnop/music-room/issues/82"
tracker_status: backlog
---

# Vérifier la licence par appareil sur le temps réel (backend)

## Description

canControl prend l'appareil ciblé : autorisé si le raccourci global est actif ou si une licence existe ; control:action et listening:subscribe l'utilisent et renvoient control:error sinon.

## Acceptance Criteria

Verify: Test : ami autorisé sur A contrôle A ; sa commande vers B est refusée tant que B n'est pas accordé ou que le raccourci est coupé.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-delegation-controle/epic-delegation-controle.md

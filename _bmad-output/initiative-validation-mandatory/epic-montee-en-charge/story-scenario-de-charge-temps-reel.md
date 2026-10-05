---
id: 3
type: story
title: "Scénario de charge temps réel"
parent: epic-montee-en-charge
covers: [CAP-2]
after: [2, 2.1, 4.5, 5.5]
hitl: false
risk: medium
tracker_id: "105"
remote: "https://github.com/Elnop/music-room/issues/105"
tracker_status: backlog
---

# Scénario de charge temps réel

## Description

Étend `make perf-test` et tests/performance/ avec N clients socket authentifiés réutilisant les fixtures de 2, qui éditent une playlist et envoient des commandes de contrôle, avec un outil justifié si aucun de la liste ne gère Socket.io.

## Acceptance Criteria

Verify: `make perf-test` lance aussi le scénario socket et rapporte connexions réussies et latence des events.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-montee-en-charge/epic-montee-en-charge.md

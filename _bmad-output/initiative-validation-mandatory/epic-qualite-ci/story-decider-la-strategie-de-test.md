---
id: 6
type: story
title: "Décider la stratégie de test"
parent: epic-qualite-ci
covers: [CAP-3]
after: [1]
hitl: true
risk: medium
tracker_id: "54"
remote: "https://github.com/Elnop/music-room/issues/54"
tracker_status: backlog
---

# Décider la stratégie de test

## Description

Choisit avec l'équipe les frameworks backend et mobile et la façon dont les tests atteignent Supabase, Redis et Socket.io : tests unitaires sans secrets, tests d'intégration sur un Postgres local fourni par 10 et en CI. Consigné dans doc/TESTING.md, que tous les epics suivent.

## Acceptance Criteria

Verify: doc/TESTING.md nomme les frameworks, la stratégie par dépendance externe, le Postgres d'intégration et la commande pour lancer un test unique.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-qualite-ci/epic-qualite-ci.md

---
id: 10
type: story
title: "Postgres de test pour les tests d'intégration"
parent: epic-qualite-ci
covers: [CAP-3]
after: [7]
hitl: false
risk: medium
tracker_id: "58"
remote: "https://github.com/Elnop/music-room/issues/58"
tracker_status: backlog
---

# Postgres de test pour les tests d'intégration

## Description

Fournit un Postgres local (docker) avec les migrations du repo appliquées, utilisable par les tests d'intégration backend en local et comme service en CI, selon 6.

## Acceptance Criteria

Verify: Un test d'intégration backend lit une table créée par les migrations, en local et dans le job CI.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-qualite-ci/epic-qualite-ci.md

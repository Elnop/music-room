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

Fournit la stack Supabase locale (`supabase start` : Postgres, PostgREST, Auth) avec les migrations du repo appliquées, derrière `make test-int`, utilisable par les tests d'intégration backend en local et en CI, selon doc/TESTING.md (story 6).

## Acceptance Criteria

Verify: Un test d'intégration backend lit une table créée par les migrations, en local et dans le job CI.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-qualite-ci/epic-qualite-ci.md

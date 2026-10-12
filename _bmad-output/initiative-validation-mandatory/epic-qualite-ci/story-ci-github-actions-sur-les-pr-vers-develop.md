---
id: 11
type: story
title: "CI GitHub Actions sur les PR vers develop"
parent: epic-qualite-ci
covers: [CAP-12]
after: [5, 9, 10]
hitl: false
risk: low
tracker_id: "59"
remote: "https://github.com/Elnop/music-room/issues/59"
tracker_status: backlog
---

# CI GitHub Actions sur les PR vers develop

## Description

Ajoute un workflow qui, sur chaque PR vers develop, installe avec la version de Node de 5 et lance lint, type-check et tests backend et mobile avec le Postgres de 10, en appelant npm directement ; corrige d'abord ce qui ferait échouer develop au départ.

## Acceptance Criteria

Verify: Une PR de test vers develop affiche les jobs lint, type-check et tests au vert ; un test cassé la passe en rouge.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-qualite-ci/epic-qualite-ci.md

---
id: 8
type: story
title: "Mettre en place le harness de test mobile"
parent: epic-qualite-ci
covers: [CAP-3]
after: [6]
hitl: false
risk: medium
tracker_id: "56"
remote: "https://github.com/Elnop/music-room/issues/56"
tracker_status: backlog
---

# Mettre en place le harness de test mobile

## Description

Installe le framework mobile choisi en 6 avec les mocks Expo nécessaires, et un premier test sur utils/formatters.

## Acceptance Criteria

Verify: `npm test` dans mobile/ exécute un test qui passe et échoue si on casse un formatter.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-qualite-ci/epic-qualite-ci.md

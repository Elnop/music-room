---
id: 12
type: story
title: "Supprimer le barrel mobile types/index.ts et l'alias @types"
parent: epic-qualite-ci
covers: [CAP-13]
after: [3, 8]
hitl: false
risk: low
tracker_id: "60"
remote: "https://github.com/Elnop/music-room/issues/60"
tracker_status: backlog
---

# Supprimer le barrel mobile types/index.ts et l'alias @types

## Description

Remplace les imports via @types par des imports du fichier de types source, supprime mobile/src/types/index.ts et l'alias @types de tsconfig.json et babel.config.js (règle AGENTS.md).

## Acceptance Criteria

Verify: mobile/src/types/index.ts et l'alias @types n'existent plus et `npm run type-check` et `npm test` passent dans mobile/.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-qualite-ci/epic-qualite-ci.md

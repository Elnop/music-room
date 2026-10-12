---
id: 9
type: story
title: "Faire lancer les vrais tests par make test"
parent: epic-qualite-ci
covers: [CAP-3]
after: [7, 8]
hitl: false
risk: low
tracker_id: "57"
remote: "https://github.com/Elnop/music-room/issues/57"
tracker_status: backlog
---

# Faire lancer les vrais tests par make test

## Description

La cible test de make/quality.mk lance les tests backend et mobile en appelant npm directement (pas npm_safe, qui masque les échecs), et AGENTS.md ne dit plus qu'il n'y a pas de tests.

## Acceptance Criteria

Verify: `make test` exécute les tests des deux côtés et sort en code non nul si un test échoue ; AGENTS.md décrit la vraie commande.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-qualite-ci/epic-qualite-ci.md

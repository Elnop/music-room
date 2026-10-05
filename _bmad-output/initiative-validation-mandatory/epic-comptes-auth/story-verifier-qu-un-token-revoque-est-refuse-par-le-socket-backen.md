---
id: 3
type: story
title: "Vérifier qu'un token révoqué est refusé par le socket (backend)"
parent: epic-comptes-auth
covers: [CAP-9, CAP-3]
after: [1, 2.1]
hitl: false
risk: low
tracker_id: "71"
remote: "https://github.com/Elnop/music-room/issues/71"
tracker_status: backlog
---

# Vérifier qu'un token révoqué est refusé par le socket (backend)

## Description

Test d'intégration : la poignée de main socket de 2.1 refuse un token révoqué par 1.

## Acceptance Criteria

Verify: Le test de connexion socket avec un token révoqué échoue avec une erreur d'authentification.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-comptes-auth/epic-comptes-auth.md

---
id: 2
type: story
title: "Couper le socket au logout (mobile)"
parent: epic-comptes-auth
covers: [CAP-9, CAP-3]
after: [1, 1.8]
hitl: false
risk: low
tracker_id: "70"
remote: "https://github.com/Elnop/music-room/issues/70"
tracker_status: backlog
---

# Couper le socket au logout (mobile)

## Description

authStore.logout, qui appelle déjà l'API, coupe aussi la connexion socket et nettoie l'état même si l'API échoue.

## Acceptance Criteria

Verify: Test de authStore : logout appelle l'API, déconnecte le socket et vide tokens et état.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-comptes-auth/epic-comptes-auth.md

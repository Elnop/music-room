---
id: 1
type: story
title: "Révoquer la session au logout (backend)"
parent: epic-comptes-auth
covers: [CAP-9, CAP-3]
after: [1.7]
hitl: false
risk: medium
tracker_id: "69"
remote: "https://github.com/Elnop/music-room/issues/69"
tracker_status: backlog
---

# Révoquer la session au logout (backend)

## Description

POST /api/auth/logout ajoute le token à une denylist Redis jusqu'à son expiration et révoque le refresh token (signOut admin Supabase) ; verifyToken (session.service.ts) refuse les tokens de la denylist ; la doc logout de auth.openapi.ts est mise à jour.

## Acceptance Criteria

Verify: Tests : après logout, l'ancien token reçoit 401 et /refresh avec l'ancien refresh token échoue.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-comptes-auth/epic-comptes-auth.md

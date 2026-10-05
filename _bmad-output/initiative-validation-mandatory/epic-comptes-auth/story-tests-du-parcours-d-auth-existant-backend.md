---
id: 7
type: story
title: "Tests du parcours d'auth existant (backend)"
parent: epic-comptes-auth
covers: [CAP-3]
after: [1.7]
hitl: false
risk: low
tracker_id: "75"
remote: "https://github.com/Elnop/music-room/issues/75"
tracker_status: backlog
---

# Tests du parcours d'auth existant (backend)

## Description

Couvre register, login (refus si email non vérifié), verify-email, resend, forgot-password et reset-password.

## Acceptance Criteria

Verify: Les tests passent et échouent si on retire le refus de login non vérifié.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-comptes-auth/epic-comptes-auth.md

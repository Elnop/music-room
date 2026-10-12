---
id: 4
type: story
title: "Tester l'accès à l'écoute et au contrôle (backend)"
parent: epic-securite
covers: [CAP-1, CAP-3]
after: [3]
hitl: false
risk: medium
tracker_id: "65"
remote: "https://github.com/Elnop/music-room/issues/65"
tracker_status: backlog
---

# Tester l'accès à l'écoute et au contrôle (backend)

## Description

Couvre par des tests listening:subscribe et control:action, qui vérifient déjà canControl sur l'identité du socket, et refuse l'abonnement à l'écoute d'un utilisateur que l'abonné n'a pas le droit de voir.

## Acceptance Criteria

Verify: Tests : abonnement à l'écoute d'un non-ami refusé ; control:action au nom d'un autre utilisateur impossible.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-securite/epic-securite.md

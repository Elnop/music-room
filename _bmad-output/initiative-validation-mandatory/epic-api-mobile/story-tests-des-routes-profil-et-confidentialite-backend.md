---
id: 5
type: story
title: "Tests des routes profil et confidentialité (backend)"
parent: epic-api-mobile
covers: [CAP-3]
after: [1.7]
hitl: false
risk: low
tracker_id: "98"
remote: "https://github.com/Elnop/music-room/issues/98"
tracker_status: backlog
---

# Tests des routes profil et confidentialité (backend)

## Description

Couvre GET et PATCH du profil, recherche, confidentialité et préférences musicales, dont le filtrage public, amis et privé d'un profil tiers.

## Acceptance Criteria

Verify: Les tests passent et échouent si un champ friends_only est visible d'un non-ami.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-api-mobile/epic-api-mobile.md

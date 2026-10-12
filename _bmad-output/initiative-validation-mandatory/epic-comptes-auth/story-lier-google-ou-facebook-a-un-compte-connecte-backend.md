---
id: 5
type: story
title: "Lier Google ou Facebook à un compte connecté (backend)"
parent: epic-comptes-auth
covers: [CAP-6, CAP-3]
after: [4]
hitl: false
risk: high
tracker_id: "73"
remote: "https://github.com/Elnop/music-room/issues/73"
tracker_status: backlog
---

# Lier Google ou Facebook à un compte connecté (backend)

## Description

Implémente le contrat de 4 : vérifie le token, enregistre google_id ou facebook_id sur l'utilisateur connecté quel que soit l'email, refuse un id déjà lié ; corrige la connexion OAuth (user.service.ts) pour ouvrir la session du compte trouvé par l'id du réseau et non par l'email du réseau.

## Acceptance Criteria

Verify: Tests : liaison d'un Google à email différent puis login Google sur le même compte ; liaison d'un id déjà pris refusée.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-comptes-auth/epic-comptes-auth.md

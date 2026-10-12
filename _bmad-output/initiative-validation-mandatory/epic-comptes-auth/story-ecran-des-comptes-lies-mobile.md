---
id: 6
type: story
title: "Écran des comptes liés (mobile)"
parent: epic-comptes-auth
covers: [CAP-6, CAP-3]
after: [2, 4, 5]
hitl: false
risk: medium
tracker_id: "74"
remote: "https://github.com/Elnop/music-room/issues/74"
tracker_status: backlog
---

# Écran des comptes liés (mobile)

## Description

Ajoute un écran de réglages qui liste les fournisseurs (GET /providers existant), lance la connexion Google ou Facebook puis appelle la liaison de 4, et délie via authStore.unlinkProvider existant (la dernière méthode reste refusée par le backend).

## Acceptance Criteria

Verify: Test de composant avec API mockée : liste, liaison et déliaison ; démo sur un dev build contre le backend de 5.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-comptes-auth/epic-comptes-auth.md

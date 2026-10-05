---
id: 4
type: story
title: "Contrat d'API de liaison de compte social"
parent: epic-comptes-auth
covers: [CAP-6]
after: [1]
hitl: false
risk: low
tracker_id: "72"
remote: "https://github.com/Elnop/music-room/issues/72"
tracker_status: backlog
---

# Contrat d'API de liaison de compte social

## Description

Définit dans auth.openapi.ts POST /api/auth/providers/{provider}/link (token du réseau en entrée, fournisseurs liés en sortie, erreurs déjà lié à un autre compte et token invalide), que 5 implémente et 6 consomme.

## Acceptance Criteria

Verify: L'endpoint apparaît dans Swagger avec ses schémas d'entrée, de sortie et d'erreur.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-comptes-auth/epic-comptes-auth.md

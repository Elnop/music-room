---
type: epic
title: "Sécurité et temps réel de confiance (IV.6)"
parent: initiative-validation-mandatory
covers: [CAP-1, CAP-10, CAP-3]
after: []
assignee: ""
risk: high
---

# Sécurité et temps réel de confiance (IV.6)

## Description

Le canal temps réel ne fait confiance qu'aux identités authentifiées, chaque utilisateur ne reçoit que ce qu'il a le droit de voir, et l'équipe documente les menaces et leurs protections. Les capacités sont dans la spec de l'initiative ; ce fichier est l'enveloppe, complétée à l'inception.

## Outcome

Personne ne peut agir sur le socket au nom d'un autre ni lire une playlist privée ; signal : CAP-1 et CAP-10 de la spec.

## Done when

1. Un client socket sans token, avec un token invalide ou un id forgé est refusé (tests).
2. Un utilisateur non invité ne reçoit aucune mise à jour d'une playlist privée, et ne peut pas envoyer de commande au nom d'un autre (tests).
3. Chaque nouvel event socket est logué avec plateforme, appareil et version.
4. Un document liste chaque menace avec sa protection ou son risque accepté, et `doc/SECURITY.md` correspond aux Dockerfiles laissés par epic-qualite-ci.
5. L'epic est mergé dans `develop` et vérifié (type-check, lint et tests au vert).

## Boundaries

Authentification et autorisation du socket (`backend/src/realtime/index.ts`, `mobile/src/store/socketStore.ts`), logs socket, modèle de menaces. Il définit le contrat d'authentification du socket que les autres epics adoptent. Ce n'est pas la révocation au logout (epic-comptes-auth). CAP-3 ici : tests du temps réel et de `socketStore`.

## References

- parent — _bmad-output/initiative-validation-mandatory/initiative-validation-mandatory.md
- spec — _bmad-output/initiative-validation-mandatory/spec-mandatory-gaps/spec-mandatory-gaps.md, section Capabilities (CAP-1, CAP-10, CAP-3)
- audit — _bmad-output/audit-subject-v5-3/audit-subject-v5-3.md, preuves
- constraint — `AGENTS.md`, sections Policy et Conventions

## Notes

Handoff: la poignée de main socket appelle `verifyToken` de `backend/src/features/auth/services/session.service.ts` ; la révocation (denylist Redis) y est ajoutée par epic-comptes-auth, donc le socket hérite de la révocation sans changement ici.
Decision: la story « modèle de menaces » attend les entrées des epics comptes, délégation et playlist, pour décrire le système final (2026-10-05).
- Waits on epic-qualite-ci because: le tri des branches, la stratégie de test et le harness.
- Decision: tracer bullet 1 → 2 : l'app se connecte au socket avec son token et l'identité vient du token (2026-10-05).
- Decision: l'event auth:register est supprimé ; l'appareil est envoyé dans la poignée de main (choix de l'utilisateur, 2026-10-05).
- Decision: pas de story « Refactor sweep » (choix de l'utilisateur, 2026-10-05).
- Handoff: la poignée de main appelle verifyToken de `backend/src/features/auth/services/session.service.ts` ; la denylist de révocation y est ajoutée par 3.1, le socket en hérite sans changement ici.
- Handoff: le logger de 5 lit socket.data ; les nouveaux events des autres epics passent par lui.

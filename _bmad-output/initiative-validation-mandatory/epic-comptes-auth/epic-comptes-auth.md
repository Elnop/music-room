---
tracker_id: "68"
remote: "https://github.com/Elnop/music-room/issues/68"
type: epic
title: "Comptes et authentification (IV.1)"
parent: initiative-validation-mandatory
covers: [CAP-6, CAP-9, CAP-3]
after: []
assignee: ""
risk: medium
---

# Comptes et authentification (IV.1)

## Description

Un utilisateur connecté lie et délie son compte Google ou Facebook depuis l'app, la déconnexion termine la session côté serveur, et le parcours d'auth existant est couvert par des tests. Les capacités sont dans la spec de l'initiative ; ce fichier est l'enveloppe, complétée à l'inception.

## Outcome

Les exigences IV.1 sont démontrables de bout en bout ; signal : CAP-6 et CAP-9 de la spec.

## Done when

1. Un utilisateur email/mot de passe lie un compte Google dont l'email diffère, puis se connecte au même compte par les deux méthodes ; délier la dernière méthode est refusé.
2. Une requête HTTP ou une connexion socket avec un token émis avant le logout est refusée.
3. Register, login, vérification email, reset du mot de passe et `authStore` sont couverts par des tests.
4. Les endpoints ajoutés ou modifiés sont documentés dans `auth.openapi.ts`.
5. L'epic est mergé dans `develop` et vérifié (type-check, lint et tests au vert).

## Boundaries

Feature auth (`backend/src/features/auth/`, écrans `mobile/src/screens/auth/`, `authStore`). La révocation se fait dans `verifyToken`, ce qui la propage au socket (epic-securite). Pas les 5 endpoints auth déjà existants mais non documentés (epic-api-mobile, après les entrées openapi de cet epic).

## References

- parent — _bmad-output/initiative-validation-mandatory/initiative-validation-mandatory.md
- spec — _bmad-output/initiative-validation-mandatory/spec-mandatory-gaps/spec-mandatory-gaps.md, section Capabilities (CAP-6, CAP-9, CAP-3)
- audit — _bmad-output/audit-subject-v5-3/audit-subject-v5-3.md, preuves
- constraint — `AGENTS.md`, sections Policy et Conventions

## Notes

Handoff: la denylist Redis de révocation vit dans `verifyToken` de `backend/src/features/auth/services/session.service.ts` ; epic-securite en hérite.
- Waits on epic-qualite-ci because: le tri des branches (dont la branche 28 sur la liaison), la stratégie de test et le harness.
- Decision: tracer bullet 1 → 2 : un logout dans l'app révoque la session côté serveur et coupe le socket (2026-10-05).
- Decision: pas de story « Refactor sweep » (choix de l'utilisateur, 2026-10-05).
- Handoff: la denylist Redis de révocation vit dans verifyToken de `backend/src/features/auth/services/session.service.ts` ; epic-securite en hérite.
- Note: la branche 28 sur la liaison ne contient qu'un commit Makefile ; elle est triée en 1.2.

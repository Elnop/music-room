---
type: initiative
title: "Valider la partie obligatoire du sujet Music Room v5.3"
parent: none
covers: [CAP-1, CAP-2, CAP-3, CAP-4, CAP-5, CAP-6, CAP-7, CAP-8, CAP-9, CAP-10, CAP-11, CAP-12, CAP-13]
after: []
assignee: ""
risk: high
---

# Valider la partie obligatoire du sujet Music Room v5.3

## Description

Fermer chaque écart de l'audit du 2026-10-05 pour que la partie obligatoire du sujet soit parfaite à la soutenance, condition pour que les bonus soient évalués. La spec `spec-mandatory-gaps` porte les capacités, contraintes et non-objectifs ; cette initiative les livre.

## Outcome

Chaque membre de l'équipe présente sa partie du sujet en soutenance, preuves à l'appui ; le signal est celui de la spec : un nouvel audit marque toutes les exigences III.1 à IV.8 comme faites.

## Done when

1. Un nouvel audit du sujet v5.3 marque III.1 à IV.8 comme faits, chacun avec sa preuve (code, test ou document commité).
2. Les 13 capacités CAP-1 à CAP-13 sont mergées dans `develop`, sans fonctionnalité derrière un flag.
3. `make test` et la CI passent sur `develop`.
4. Chaque section du sujet a un porteur capable de la démontrer.

## Boundaries

Un epic par section du sujet, pour que chaque personne porte et présente sa partie ; les stories sont petites et séparées back (`area: backend`) et front (`area: mobile`), avec une story de contrat d'API en premier quand le front dépend du back. Hors périmètre : voir les non-objectifs de la spec (Track Vote, bonus, issue #29). Chemin traceur : un utilisateur authentifié sur le socket édite une playlist et délègue le contrôle à un ami sur un appareil précis.

- Touch point: migrations Supabase (appliquées à la main) — numérotées à la suite de `014_password_reset.sql` ; l'entrée de schéma de epic-editeur-playlist passe après celle de epic-delegation-controle ; chaque migration régénère `supabase.generated.ts` ; owner: l'epic qui ajoute le schéma
- Touch point: `backend/src/shared/config/swagger.schemas.ts` — partagé ; chaque epic documente les endpoints qu'il modifie ; owner: epic-api-mobile pour les 8 endpoints manquants

## References

- spec — _bmad-output/initiative-validation-mandatory/spec-mandatory-gaps/spec-mandatory-gaps.md, sections Capabilities, Constraints, Non-goals
- priorities — _bmad-output/initiative-validation-mandatory/spec-mandatory-gaps/priorities.md
- audit — _bmad-output/audit-subject-v5-3/audit-subject-v5-3.md, preuves par exigence
- constraint — `doc/en.subject.pdf` v5.3, prime sur tout
- constraint — `AGENTS.md`, section Policy (branches, `main` déploie)

## Notes

- Decision: un epic est livré quand il est mergé dans `develop` et vérifié ; `main` est publié par release (choix de l'utilisateur, 2026-10-05).
- Decision: découpage par section du sujet pour que chacun présente sa partie, stories petites séparées back/front (choix de l'utilisateur, 2026-10-05).
- Decision: les porteurs des epics sont choisis plus tard par l'équipe (Elnop, JCluzet, barbiloup, kbagot) (2026-10-05).
- Decision: priorités P0/P1/P2 de `priorities.md` (2026-10-05).
- Assumption: `develop` est publié sur `main` au moins une fois avant la soutenance.
- Open question: machine de référence pour IV.7 ; tranchée dans epic-montee-en-charge.
- Decision: les epics avancent en parallèle, chacun porté par sa personne ; les dépendances sont au niveau des entrées. Ordre volontairement en conflit : 2.6 (modèle de menaces) attend 3.1, 4.5 et 5.5 pour décrire le système final, et 5.6 attend 6.3 (accès unique à l'URL du backend) (2026-10-05).

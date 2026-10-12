---
tracker_id: "93"
remote: "https://github.com/Elnop/music-room/issues/93"
type: epic
title: "API documentée et app mobile testable (IV.4, IV.5, III.1)"
parent: initiative-validation-mandatory
covers: [CAP-7, CAP-8, CAP-11, CAP-3]
after: []
assignee: ""
risk: low
---

# API documentée et app mobile testable (IV.4, IV.5, III.1)

## Description

Chaque endpoint figure dans Swagger, un testeur change l'adresse du backend depuis l'app, l'équipe justifie ses choix techniques, et les features profil, amis, SoundCloud et mail sont couvertes par des tests. Les capacités sont dans la spec de l'initiative ; ce fichier est l'enveloppe, complétée à l'inception.

## Outcome

Les exigences API et application mobile sont démontrables ; signal : CAP-7, CAP-8 et CAP-11 de la spec.

## Done when

1. Les 8 endpoints listés par l'audit apparaissent dans Swagger avec leurs schémas d'entrée et de sortie.
2. Changer l'adresse du backend dans l'app, sans rebuild, envoie le trafic API et socket suivant vers ce backend.
3. Un document justifie la stack backend, la base, REST, JSON et le temps réel face à des alternatives nommées.
4. Les routes profil, confidentialité, amis, SoundCloud et mail, `playerStore`, `soundcloudStore` et les composants qu'aucun autre epic ne modifie sont couverts par des tests.
5. L'epic est mergé dans `develop` et vérifié (type-check, lint et tests au vert).

## Boundaries

Documentation d'API des endpoints existants non documentés, configuration du backend dans l'app, justification des choix, tests des features qu'aucun autre epic ne réécrit. Chaque autre epic documente lui-même les endpoints qu'il modifie.

## References

- parent — _bmad-output/initiative-validation-mandatory/initiative-validation-mandatory.md
- spec — _bmad-output/initiative-validation-mandatory/spec-mandatory-gaps/spec-mandatory-gaps.md, section Capabilities (CAP-7, CAP-8, CAP-11, CAP-3)
- audit — _bmad-output/audit-subject-v5-3/audit-subject-v5-3.md, preuves
- constraint — `AGENTS.md`, sections Policy et Conventions

## Notes

Handoff: les entrées sur `auth.openapi.ts` attendent celles de epic-comptes-auth ; celle sur `playlist.openapi.ts` attend celles de epic-editeur-playlist ; l'adresse du backend dans l'app (`socketStore`, `api.ts`) attend l'entrée mobile socket de epic-securite.
- Waits on epic-qualite-ci because: le tri des branches, la stratégie de test et le harness.
- Decision: tracer bullet 3 : changer l'adresse du backend dans l'app redirige API et socket sans rebuild (2026-10-05).
- Decision: chaque epic documente dans Swagger les endpoints qu'il modifie ; cet epic documente les 8 manquants et ajoute le test qui garde Swagger complet (2026-10-05).
- Decision: pas de story « Refactor sweep » (choix de l'utilisateur, 2026-10-05).
- Assumption: /health est documenté dans swagger.config.ts bien qu'hors de /api.

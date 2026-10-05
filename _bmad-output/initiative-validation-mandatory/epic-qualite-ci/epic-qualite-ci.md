---
tracker_id: "48"
remote: "https://github.com/Elnop/music-room/issues/48"
type: epic
title: "Qualité et intégration continue (IV.8)"
parent: initiative-validation-mandatory
covers: [CAP-3, CAP-12, CAP-13]
after: []
assignee: ""
risk: medium
---

# Qualité et intégration continue (IV.8)

## Description

Le socle sur lequel toute l'équipe travaille : branches non mergées triées, version de Node choisie, stratégie et frameworks de test en place, `make test` réel, CI sur les PR vers `develop`, dépôt nettoyé. Les capacités sont dans la spec de l'initiative ; ce fichier est l'enveloppe, complétée à l'inception.

## Outcome

Toute l'équipe peut tester et faire valider son travail automatiquement ; signal : une PR vers `develop` déclenche lint, type-check et tests (CAP-12).

## Done when

1. Les branches `origin/feature/aggressive-updates`, `origin/28-implement-account-linking-for-social-networks` et `4-implement-email-validation-flow` sont mergées ou supprimées.
2. La version de Node est choisie, les Dockerfiles alignés et la version pinée en CI.
3. `make test` lance au moins un test backend et un test mobile et échoue sur une régression.
4. Une PR vers `develop` exécute lint, type-check et tests, et un échec la marque en rouge.
5. `TODO.md` et `mobile/src/types/index.ts` n'existent plus.
6. L'epic est mergé dans `develop` et vérifié (type-check, lint et tests au vert).

## Boundaries

Socle qualité et outillage : il ne teste pas les features (chaque epic de feature teste la sienne). Il décide pour toute l'initiative la stratégie de test (comment les tests atteignent Supabase, Redis et Socket.io : mocks, stack locale ou fixtures) et les frameworks.

## References

- parent — _bmad-output/initiative-validation-mandatory/initiative-validation-mandatory.md
- spec — _bmad-output/initiative-validation-mandatory/spec-mandatory-gaps/spec-mandatory-gaps.md, section Capabilities (CAP-3, CAP-12, CAP-13)
- audit — _bmad-output/audit-subject-v5-3/audit-subject-v5-3.md, preuves
- constraint — `AGENTS.md`, sections Policy et Conventions

## Notes

Decision: le tri des branches passe avant toute autre story, `aggressive-updates` réécrivant 42 fichiers que les autres epics touchent (2026-10-05).
Decision: la story Node aligne aussi les Dockerfiles et pine la CI (choix de l'utilisateur, 2026-10-05).
Open question: Node 20 ou 22 ; tranché par une story hitl de cet epic.
- Decision: pas de tracer bullet classique pour cet epic de socle ; le chemin le plus fin est 7 → 9 → 11 : un test backend lancé par `make test` puis par la CI (2026-10-05).
- Decision: les trois branches non mergées sont triées en premier, une story chacune, car aggressive-updates réécrit des fichiers que tous les epics touchent (2026-10-05).
- Decision: les tests d'intégration tournent sur un Postgres local et en CI (story 10), notamment pour la concurrence des playlists (choix de l'utilisateur, 2026-10-05).
- Decision: pas de story « Refactor sweep » dans les epics ; chacun nettoie dans sa story (choix de l'utilisateur, 2026-10-05).
- Open question: passer mobile/Dockerfile du tag Chainguard latest-dev à un tag versionné ; tranché dans la story 5.

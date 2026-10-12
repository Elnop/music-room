---
tracker_id: "102"
remote: "https://github.com/Elnop/music-room/issues/102"
type: epic
title: "Capacité de charge mesurée (IV.7)"
parent: initiative-validation-mandatory
covers: [CAP-2]
after: []
assignee: ""
risk: medium
---

# Capacité de charge mesurée (IV.7)

## Description

L'équipe mesure et justifie combien d'utilisateurs simultanés l'API et les deux services supportent, sur un serveur documenté. Les capacités sont dans la spec de l'initiative ; ce fichier est l'enveloppe, complétée à l'inception.

## Outcome

Le nombre max d'utilisateurs est mesuré et cohérent avec la plateforme ; signal : CAP-2 de la spec.

## Done when

1. La machine de référence est choisie et ses specs (CPU, RAM, cloud ou local) documentées.
2. Un test de charge reproductible, avec un outil de la liste du sujet ou un équivalent justifié, se lance depuis le repo.
3. Un document donne la méthode, les résultats et le nombre max d'utilisateurs simultanés pour la délégation et l'éditeur de playlist.
4. L'epic est mergé dans `develop` et vérifié (type-check, lint et tests au vert).

## Boundaries

Mesure de l'API et du temps réel tels qu'ils sont après les epics de feature. Pas d'optimisation de performance, sauf comme story séparée si la mesure le justifie.

## References

- parent — _bmad-output/initiative-validation-mandatory/initiative-validation-mandatory.md
- spec — _bmad-output/initiative-validation-mandatory/spec-mandatory-gaps/spec-mandatory-gaps.md, section Capabilities (CAP-2)
- audit — _bmad-output/audit-subject-v5-3/audit-subject-v5-3.md, preuves
- constraint — `AGENTS.md`, sections Policy et Conventions

## Notes

Open question: machine de référence pour IV.7 ; tranchée par une story hitl de cet epic.
- Waits on epic-securite because: le socket authentifié.
- Waits on epic-comptes-auth because: la révocation (lookup Redis par requête).
- Waits on epic-delegation-controle because: la délégation par appareil.
- Waits on epic-editeur-playlist because: l'édition concurrente.
- Decision: ordre 1 → 2 → 3 → 4 ; tracer bullet : le premier scénario de 2 (login puis lecture de playlist) via `make perf-test` (2026-10-05).
- Decision: pas de story « Refactor sweep », l'epic n'ajoute que des scripts et de la doc (choix de l'utilisateur, 2026-10-05).
- Assumption: le rapport précise que Track Vote n'est pas implémenté, donc pas mesuré ; seules l'API, la délégation et l'éditeur le sont.

---
tracker_id: "77"
remote: "https://github.com/Elnop/music-room/issues/77"
type: epic
title: "Délégation du contrôle musical par appareil (IV.2.2)"
parent: initiative-validation-mandatory
covers: [CAP-4, CAP-3]
after: []
assignee: ""
risk: high
---

# Délégation du contrôle musical par appareil (IV.2.2)

## Description

Un utilisateur accorde ou retire le contrôle de sa musique à un ami appareil par appareil, comme l'exige le sujet, et la délégation est couverte par des tests. Les capacités sont dans la spec de l'initiative ; ce fichier est l'enveloppe, complétée à l'inception.

## Outcome

La licence de délégation est spécifique à chaque appareil ; signal : CAP-4 de la spec.

## Done when

1. Un ami autorisé sur l'appareil A le contrôle, et sa commande vers l'appareil B est refusée tant que B n'est pas accordé (test).
2. Les appareils d'un utilisateur sont persistés et listés dans l'app, avec un réglage d'accès par ami.
3. Les endpoints music-control modifiés sont documentés dans `music-control.openapi.ts`.
4. L'epic est mergé dans `develop` et vérifié (type-check, lint et tests au vert).

## Boundaries

Feature music-control (`backend/src/features/music-control/`, partie contrôle de `realtime/index.ts`, `useMusicControl`, `DeviceListeningCard`). Il ajoute la migration des appareils.

## References

- parent — _bmad-output/initiative-validation-mandatory/initiative-validation-mandatory.md
- spec — _bmad-output/initiative-validation-mandatory/spec-mandatory-gaps/spec-mandatory-gaps.md, section Capabilities (CAP-4, CAP-3)
- audit — _bmad-output/audit-subject-v5-3/audit-subject-v5-3.md, preuves
- constraint — `AGENTS.md`, sections Policy et Conventions

## Notes

Assumption: la licence s'applique aux appareils de celui qui accorde, identifiés par le deviceId déjà persisté par l'app (spec, Assumptions).
- Waits on epic-securite because: le contrat d'authentification du socket et l'identité issue du token.
- Decision: tracer bullet 1 → 3 → 5 : un appareil est enregistré à la connexion et une commande vers lui est autorisée ou refusée selon sa licence (2026-10-05).
- Decision: l'interrupteur global follows.can_control_music est gardé comme raccourci « tous mes appareils », en plus des licences par appareil (choix de l'utilisateur, 2026-10-05).
- Decision: pas de story « Refactor sweep » (choix de l'utilisateur, 2026-10-05).
- Handoff: la migration 015 est à cet epic, la 016 à epic-editeur-playlist.

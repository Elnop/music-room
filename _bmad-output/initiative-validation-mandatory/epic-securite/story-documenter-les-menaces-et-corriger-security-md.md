---
id: 6
type: story
title: "Documenter les menaces et corriger SECURITY.md"
parent: epic-securite
covers: [CAP-10]
after: [4, 5, 1.5, 3.1, 4.5, 5.5]
hitl: false
risk: low
tracker_id: "67"
remote: "https://github.com/Elnop/music-room/issues/67"
tracker_status: backlog
---

# Documenter les menaces et corriger SECURITY.md

## Description

Rédige doc/THREAT_MODEL.md : bruteforce, vol de session, token révoqué alors qu'un socket est déjà connecté, isolation des données, abus du temps réel, accès conservé dans une room après retrait, contrôle par appareil, concurrence ; protection ou risque accepté pour chacun. Aligne doc/SECURITY.md sur les Dockerfiles laissés par 1.5.

## Acceptance Criteria

Verify: Chaque menace renvoie au code ou au test qui la couvre, ou est marquée risque accepté ; SECURITY.md ne contredit aucun Dockerfile.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-securite/epic-securite.md

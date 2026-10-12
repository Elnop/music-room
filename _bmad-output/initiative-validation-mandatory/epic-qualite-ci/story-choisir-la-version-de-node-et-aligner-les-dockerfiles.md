---
id: 5
type: story
title: "Choisir la version de Node et aligner les Dockerfiles"
parent: epic-qualite-ci
covers: [CAP-12]
after: [1]
hitl: true
risk: low
tracker_id: "53"
remote: "https://github.com/Elnop/music-room/issues/53"
tracker_status: backlog
---

# Choisir la version de Node et aligner les Dockerfiles

## Description

Décide Node 20 ou 22 avec l'équipe, aligne backend/Dockerfile, mobile/Dockerfile (en remplaçant le tag Chainguard latest-dev par un tag versionné si l'équipe l'accepte), Dockerfile.android-build et un .nvmrc ; la CI (11) pinera cette version.

## Acceptance Criteria

Verify: Les Dockerfiles et .nvmrc annoncent la même version majeure et `make dev-docker` démarre le backend.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-qualite-ci/epic-qualite-ci.md

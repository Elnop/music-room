---
id: 1
type: story
title: "Trier la branche feature/aggressive-updates"
parent: epic-qualite-ci
covers: [CAP-13]
after: []
hitl: true
risk: high
tracker_id: "49"
remote: "https://github.com/Elnop/music-room/issues/49"
tracker_status: backlog
---

# Trier la branche feature/aggressive-updates

## Description

Décide avec l'équipe de merger ou supprimer origin/feature/aggressive-updates (42 fichiers dont server.ts, config, logger, auth et playlists), avant que les autres epics touchent ces fichiers.

## Acceptance Criteria

Verify: origin/feature/aggressive-updates n'apparaît plus dans `git branch -r --no-merged origin/develop`.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-qualite-ci/epic-qualite-ci.md

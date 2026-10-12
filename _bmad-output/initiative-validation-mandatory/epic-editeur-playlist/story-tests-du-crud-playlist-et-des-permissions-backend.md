---
id: 7
type: story
title: "Tests du CRUD playlist et des permissions (backend)"
parent: epic-editeur-playlist
covers: [CAP-3]
after: [1.7]
hitl: false
risk: low
tracker_id: "92"
remote: "https://github.com/Elnop/music-room/issues/92"
tracker_status: backlog
---

# Tests du CRUD playlist et des permissions (backend)

## Description

Étend le fichier de test de 1.7 : création, lecture, mise à jour, suppression, publiques, collaborateurs, viewers, canViewPlaylist et canEditPlaylist dans les quatre combinaisons visibilité × edit_mode.

## Acceptance Criteria

Verify: Les tests passent et échouent si un viewer peut éditer en mode restricted.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-editeur-playlist/epic-editeur-playlist.md

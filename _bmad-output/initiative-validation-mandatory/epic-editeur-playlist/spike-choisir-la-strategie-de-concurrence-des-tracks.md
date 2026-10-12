---
id: 1
type: spike
title: "Choisir la stratégie de concurrence des tracks"
parent: epic-editeur-playlist
covers: [CAP-5]
after: []
hitl: true
risk: high
tracker_id: "86"
remote: "https://github.com/Elnop/music-room/issues/86"
tracker_status: backlog
---

# Choisir la stratégie de concurrence des tracks

## Description

Retient la stratégie de concurrence des tracks qui satisfait CAP-5 avec Supabase et la documente dans doc/PLAYLIST_CONCURRENCY.md : rangs fractionnaires, fonctions Postgres sous verrou de playlist, version par playlist et par track, 409 seulement sur la même track.

## Acceptance Criteria

Verify: Une ligne Decision dans l'epic nomme la stratégie, le format de version et le comportement en conflit, et doc/PLAYLIST_CONCURRENCY.md la décrit.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-editeur-playlist/epic-editeur-playlist.md

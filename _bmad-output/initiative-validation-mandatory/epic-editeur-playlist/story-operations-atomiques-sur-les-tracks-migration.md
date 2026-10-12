---
id: 3
type: story
title: "Opérations atomiques sur les tracks (migration)"
parent: epic-editeur-playlist
covers: [CAP-5, CAP-3]
after: [1, 4.1, 1.10]
hitl: true
risk: high
tracker_id: "88"
remote: "https://github.com/Elnop/music-room/issues/88"
tracker_status: backlog
---

# Opérations atomiques sur les tracks (migration)

## Description

Ajoute la migration 016 (après la 015 de 4.1) selon doc/PLAYLIST_CONCURRENCY.md : playlist_tracks.rank (texte COLLATE "C", unique par playlist) à la place de position, moved_at_version, playlists.tracks_version, la fonction rank_between écrite dans le projet, et les fonctions add, remove et move qui verrouillent la playlist (FOR UPDATE) et rééquilibrent les rangs au-delà d'un seuil de longueur à fixer ; régénère les types.

## Acceptance Criteria

Verify: Migration appliquée ; tests d'intégration sur le Postgres de 1.10 : moves concurrents de tracks différentes tous appliqués, moves concurrents de la même track dont un seul passe, rangs uniques, added_by inchangé, rééquilibrage après une longue série de moves dans le même intervalle.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-editeur-playlist/epic-editeur-playlist.md

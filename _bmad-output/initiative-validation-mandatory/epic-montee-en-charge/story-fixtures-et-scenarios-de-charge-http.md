---
id: 2
type: story
title: "Fixtures et scénarios de charge HTTP"
parent: epic-montee-en-charge
covers: [CAP-2]
after: [1, 3.1, 5.4]
hitl: false
risk: medium
tracker_id: "104"
remote: "https://github.com/Elnop/music-room/issues/104"
tracker_status: backlog
---

# Fixtures et scénarios de charge HTTP

## Description

Crée les utilisateurs de test directement dans Supabase (amis, playlists, licences), des tokens générés à l'avance, et une configuration de rate limit pour la mesure (désactivée ou IP en liste blanche, notée comme condition) ; ajoute make/perf.mk avec `make perf-test` et tests/performance/, d'abord un scénario login puis lecture de playlist, puis édition de tracks, avec un résumé requêtes par seconde et latences.

## Acceptance Criteria

Verify: `make perf-test` exécute les scénarios HTTP et écrit le résumé dans tests/performance/results/.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-montee-en-charge/epic-montee-en-charge.md

---
id: 1
type: story
title: "Schéma des appareils et des licences par appareil (migration)"
parent: epic-delegation-controle
covers: [CAP-4]
after: []
hitl: true
risk: medium
tracker_id: "78"
remote: "https://github.com/Elnop/music-room/issues/78"
tracker_status: backlog
---

# Schéma des appareils et des licences par appareil (migration)

## Description

Ajoute la migration 015 (la 016 est réservée à epic-editeur-playlist) : appareils d'un utilisateur (deviceId persisté par l'app, nom, plateforme, dernière vue) et licences (appareil du propriétaire, ami autorisé), avec RLS ; follows.can_control_music reste et signifie « tous mes appareils » ; régénère supabase.generated.ts.

## Acceptance Criteria

Verify: Migration appliquée dans Supabase, types régénérés, `npm run type-check` passe.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-delegation-controle/epic-delegation-controle.md

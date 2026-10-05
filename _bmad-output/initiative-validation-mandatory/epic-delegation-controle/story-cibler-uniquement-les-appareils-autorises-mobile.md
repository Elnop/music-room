---
id: 7
type: story
title: "Cibler uniquement les appareils autorisés (mobile)"
parent: epic-delegation-controle
covers: [CAP-4, CAP-3]
after: [5, 6, 2.2]
hitl: false
risk: medium
tracker_id: "84"
remote: "https://github.com/Elnop/music-room/issues/84"
tracker_status: backlog
---

# Cibler uniquement les appareils autorisés (mobile)

## Description

useMusicControl, DeviceListeningCard et UserProfileScreen n'affichent comme contrôlables que les appareils renvoyés par 2 et affichent le refus de 5.

## Acceptance Criteria

Verify: Tests de useMusicControl : appareil non autorisé non contrôlable, control:error affiché.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-delegation-controle/epic-delegation-controle.md

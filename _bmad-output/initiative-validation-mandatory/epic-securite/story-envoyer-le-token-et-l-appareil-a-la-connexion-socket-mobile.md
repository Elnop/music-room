---
id: 2
type: story
title: "Envoyer le token et l'appareil à la connexion socket (mobile)"
parent: epic-securite
covers: [CAP-1, CAP-3]
after: [1, 1.8]
hitl: false
risk: medium
tracker_id: "63"
remote: "https://github.com/Elnop/music-room/issues/63"
tracker_status: backlog
---

# Envoyer le token et l'appareil à la connexion socket (mobile)

## Description

socketStore envoie la poignée de main du contrat de 1, se reconnecte avec le token rafraîchi et gère le refus ; useMusicControl n'émet plus auth:register.

## Acceptance Criteria

Verify: Tests de socketStore : handshake avec token et champs d'appareil ; une erreur d'auth déclenche reconnexion ou déconnexion ; plus aucun emit auth:register.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-securite/epic-securite.md

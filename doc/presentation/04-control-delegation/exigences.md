# IV.2.2 Music Control Delegation

## Ce que dit le sujet

> *"Music control delegation. A license management must be integrated to the service. It must be specific for each device attached to the user's account. The user can choose to give the music control to different friends."*

## Ce qu'on livre

- **Appareils rattachés au compte** : chaque appareil s'enregistre à l'ouverture de sa connexion Socket.io (identifiant stable, nom, plateforme, modèle, version de l'app). On les retrouve dans **Profil › Mes appareils**, où l'on peut les renommer.
- **Licence par appareil** : sous chaque appareil, un interrupteur par ami. L'ami ne contrôle que les appareils sur lesquels il a une licence.
- **Seulement entre amis** : la délégation n'existe qu'entre amis, c'est-à-dire abonnés mutuels.
- **« Contrôle tous mes appareils »** : un raccourci qui donne la main sur tous les appareils, présents et futurs.
- **Retrait immédiat** : retirer la licence, couper le raccourci ou mettre fin à l'amitié retire l'accès tout de suite. L'ami en est prévenu (`permission:changed`).
- **Contrôle à distance** : l'ami voit ce que joue chaque appareil, envoie lecture et pause, et gère la file d'attente du propriétaire. Il peut aussi déplacer la lecture vers un appareil qu'il contrôle, comme Spotify Connect.
- **Règle centralisée** : une seule fonction (`control-access.service.ts`), appelée par les routes HTTP comme par le socket. Une erreur de base de données vaut refus.

## Où regarder

- Backend : `backend/src/features/music-control/`, `backend/src/features/queue/`, `backend/src/realtime/handlers/control.handler.ts`
- Mobile : `mobile/src/features/music-control/myDevices/`, `mobile/src/features/queue/devicePicker/`
- Détail : [control-delegation.md](../../features/control-delegation.md), [queue-and-connect.md](../../features/queue-and-connect.md), M11 de [threat-model.md](../../security/threat-model.md#m11-music-control-of-an-unauthorized-device)

## Scénarios

- [scenario-delegation.md](scenario-delegation.md) : licence sur un appareil, refus sur un autre, retrait
- [scenario-connect.md](scenario-connect.md) : file d'attente partagée, transfert de lecture

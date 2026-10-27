# IV.2.3 Music Playlist Editor

## Ce que dit le sujet

> *"Real time multi-user playlist. Collaborate with your friends or people with the same musical tastes to create playlists in real-time."*

> *"A visibility management (Public/Private) must be implemented to the service: By default, a playlist is public. If it is public, every user have access to the playlist. If it is private, only the invited users can have access to the playlist."*

> *"A license management must be implemented to the service: By default, everyone can edit the playlist. With the right license, the invited users are the only ones who can edit the playlist."*

> *"You should especially care about the management of competition problems: for instance, if several people move different tracks or the same one in a playlist."*

## Ce qu'on livre

- **Temps réel** : ouvrir une playlist rejoint la room Socket.io `playlist:<id>`, et chaque ajout, retrait ou déplacement y est diffusé (`playlist:updated`). Tous les clients finissent sur l'ordre du serveur.
- **Visibilité** : **Publique** par défaut, visible par tous ; **Privée** n'est visible que par les invités.
- **Licence** : modification **Ouverte** par défaut, tout le monde peut modifier ; **Restreinte**, seuls le propriétaire et les éditeurs invités modifient.
- **Concurrence**, le cas cité par le sujet :
  - deux personnes déplacent **des titres différents** : les deux déplacements s'appliquent ;
  - deux personnes déplacent **le même titre** : le premier s'applique, le second reçoit `409` et voit la nouvelle place.

  Le mécanisme : des rangs fractionnaires écrits dans le projet, une fonction Postgres par opération sous un verrou de playlist, et des versions.
- Perdre l'accès (playlist passée en privée, invité retiré) **éjecte de la room** en direct.

## Où regarder

- `backend/src/features/playlists/` (`permissions/playlist.permissions.ts`), `backend/src/realtime/handlers/playlist.handler.ts`
- Mobile : `mobile/src/features/playlists/` (`sharing/`, `utils/playlistSocketRules.ts`)
- Détail : [playlist-editor.md](../../features/playlist-editor.md), [playlist-concurrency.md](../../features/playlist-concurrency.md)

## Scénarios

- [scenario-realtime.md](scenario-realtime.md) : édition à plusieurs en direct
- [scenario-rights.md](scenario-rights.md) : public/privé, ouvert/restreint
- [scenario-concurrency.md](scenario-concurrency.md) : le même titre déplacé deux fois

## Écarts assumés

- **« Friends or people with the same musical tastes »** : on collabore avec ses amis par invitation, et avec n'importe qui sur une playlist publique ouverte (section « Playlists publiques » de l'Accueil). Les préférences musicales sont visibles sur les profils. L'app ne fait pas de rapprochement automatique par goûts.
- **« Original radio stations »** : lancer une playlist la copie dans la file d'attente. Tant que le bloc n'est pas détaché, chaque modification de la playlist s'y répercute en direct : la playlist sert de station que les collaborateurs programment.
- Les **métadonnées** (nom, description, réglages) suivent la règle « la dernière écriture gagne ». La gestion de la concurrence porte sur l'ordre et le contenu des titres, ce que le sujet vise.

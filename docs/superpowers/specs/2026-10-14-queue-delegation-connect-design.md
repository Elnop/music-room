# Queue partagée avec les délégués et lecture à distance façon Spotify Connect

Date : 2026-10-14 · Epic parent : #272 (Queue de lecture) · Remplace #279 et intègre #285

## Objectif

1. Un ami délégué (Music Control Delegation, IV.2.2) gère la queue de lecture du propriétaire comme le propriétaire lui-même.
2. Depuis la modale de lecture, l'utilisateur choisit sur quel appareil la musique joue, parmi ses appareils et ceux de ses amis sur lesquels il a une licence ; la lecture y est transférée et son téléphone devient une télécommande.
3. Le mini-player est toujours visible, pour que la modale (et le choix d'appareil) soit toujours accessible.
4. Le mobile ignore les états de queue périmés (#285).

## Décisions

- **Accès à la queue** : propriétaire, ou ami qui peut contrôler au moins un appareil du propriétaire (`controlAccessService.canControlAnyDevice`). Pas de second système de droits (visibilité, collaborateurs) façon playlist.
- **Actions d'un délégué** : toutes celles du propriétaire (voir, ajouter, retirer, réordonner, jouer un item, suivant / précédent, lancer une playlist).
- **Actions de lecture** (jouer un item, suivant, précédent, lancer une playlist) d'un délégué : elles visent un appareil (`deviceId`), qui exige une licence (`canControlDevice`) et doit être en ligne.
- **Choisir un de mes appareils** : transfert du morceau en cours à la même position ; l'appareil source s'arrête. La queue suit d'elle-même (une queue par utilisateur, partagée par ses appareils).
- **Choisir l'appareil d'un ami** : transfert aussi. Mon morceau en cours et mes morceaux à venir s'insèrent en un bloc juste après le morceau en cours de l'ami, le premier devient courant et reprend à ma position ; ensuite sa queue continue.
- **Architecture** : queue et playlists restent deux features séparées qui suivent les mêmes modèles (verrou + compteur de version, room filtrée par droits). Seules les fonctions de rang (migration 016) sont partagées ; un utilitaire n'est extrait que si le code s'avère identique en l'écrivant.
- **Hors scope** : vote ou ordre par popularité (Music Track Vote, IV.2.1, n'est pas implémenté) ; refonte des cartes d'appareils du profil d'un ami (`DeviceListeningCard`, play/pause inchangés).

## Backend

### Version de la queue (#285)

- Migration `024` : `play_queues.version bigint NOT NULL DEFAULT 0`.
- `queue_lock` augmente la version en verrouillant la ligne (`UPDATE … SET version = version + 1 … RETURNING current_item_id` à la place du `SELECT … FOR UPDATE`). Toute mutation prend ce verrou, y compris les `queue_sync_*` (#278) ; une mutation qui échoue est annulée avec sa version.
- `updated_at` ne convient pas : `now()` est l'heure de début de la transaction, pas de son commit.
- `queue_state` renvoie `version` (0 sans queue) et `ownerId`. `QueueState` gagne `version: number` et `ownerId: string` (backend `queue.types.ts`, Zod de `queue-rpc.ts`, `queue.openapi.ts`, mobile `types/queue.types.ts`).

### Accès à la queue d'un autre

- Routes `/api/users/:userId/queue/*`, identiques à `/api/queue/*`, même controller ; le service prend `(actorId, ownerId, …)` et les fonctions SQL travaillent sur `ownerId`.
- `queue/permissions/queue.permissions.ts` :
  - voir, ajouter, retirer, réordonner : propriétaire ou `canControlAnyDevice(actor, owner)` ;
  - jouer un item, suivant, précédent, lancer une playlist : body `deviceId` (obligatoire pour un délégué, optionnel pour le propriétaire) ; `canControlDevice(actor, owner, deviceId)` et appareil en ligne, sinon 409 `DEVICE_OFFLINE`, vérifiés avant toute mutation ;
  - refus : 403 `QUEUE_ACCESS_DENIED`.
- Lancer une playlist : la visibilité de la playlist est vérifiée pour l'acteur.
- Sans `deviceId`, l'appareil appelant joue lui-même (comportement actuel). Avec `deviceId`, le serveur envoie `control:command play-item` à cet appareil.
- `controlAccessService` autorise le propriétaire sur ses propres appareils (aujourd'hui `controllerId === ownerId` répond « aucun accès »).

### Transfert : `POST /api/queue/transfer`

Body : `{ targetUserId, targetDeviceId, sourceDeviceId, positionMs, playing }`, avec `playing` = `{ queueItemId }` (item de ma queue) ou `{ track }` (son joué hors queue, depuis une liste).

- Cible = un de mes appareils : la queue ne change pas ; le serveur envoie `play-item` (ou `play-track`) à la cible avec `positionMs`.
- Cible = appareil d'un ami (licence requise, appareil en ligne) : nouvelle fonction `queue_insert_block(owner, track_ids[])`, sous `queue_lock`, insère mon morceau et mes morceaux à venir en un bloc juste après le morceau courant de l'ami, en fait le morceau courant, avec `source_playlist_id` à null (la synchro playlist → queue de #278 l'ignore). Puis `play-item` vers la cible.
- Si `sourceDeviceId` n'est pas l'appareil appelant, le serveur envoie `pause` à la source ; sinon l'appelant s'arrête lui-même.
- Erreurs : 403 sans licence, 409 `DEVICE_OFFLINE`, 404 item inconnu ; aucune mutation dans ces cas.

### Appareils contrôlables : `GET /api/music-control/controllable-devices`

Mes appareils et ceux des amis sur lesquels j'ai une licence (ou l'interrupteur « tous mes appareils »), groupés par propriétaire, avec leur état en ligne.

### Logs et documentation

Les logs `Queue updated` et de transfert notent l'acteur, le propriétaire et l'appareil ciblé (IV.6). Chaque nouvelle route a son entrée OpenAPI.

## Temps réel

- **`queue:updated`** : émis à `user:<owner>` et à `listening:<owner>` (room des délégués, gardée par `canControlAnyDevice`). Payload `QueueState` avec `ownerId` et `version`. Un délégué révoqué quitte déjà cette room (`music-control-access.ts`).
- **`listening:update`** : gagne `positionMs`. Émis à chaque play, pause, seek et changement de morceau, sous le throttle existant.
- **`control:command`** (serveur → appareil) :
  - `{ action: 'play' | 'pause', fromUserId }` (inchangé) ;
  - `{ action: 'play-item', fromUserId, item: QueueItem, positionMs, version }` ;
  - `{ action: 'play-track', fromUserId, track, positionMs }`.
  Les nouveaux ordres ne sont émis que par le serveur après les contrôles HTTP. `control:action` (client) reste limité à `play` / `pause`, désormais permis au propriétaire sur ses appareils.
- **`control:revoked`** (serveur → délégué) : émis quand une révocation lui retire son dernier appareil contrôlable du propriétaire, au moment où il quitte `listening:<owner>`.

## Mobile

### Appareil actif

- `store/connectStore.ts` : `target` = `{ kind: 'local' }` ou `{ kind: 'remote', ownerId, deviceId }` ; `local` au démarrage et à la déconnexion.
- `hooks/useNowPlaying.ts` : interface unique pour le mini-player et la modale.
  - local : `playerStore` et audio du téléphone ;
  - remote : `listening:status` de l'appareil ciblé (morceau, lecture, progression estimée depuis `positionMs` et `updatedAt`) ; play/pause par `control:action`, suivant / précédent / jouer un item par les routes queue avec `deviceId`.

### Queue de plusieurs propriétaires

- `queueStore` garde `{ [ownerId]: { state, version } }` ; `applyState` ignore un état dont la version n'est pas strictement supérieure à celle du même propriétaire.
- Ma queue reste chargée en permanence (`useQueueSync`). Celle d'un ami est chargée au passage en télécommande sur un de ses appareils et oubliée en le quittant.
- `QueueModal` affiche la queue du propriétaire de l'appareil actif, avec les mêmes gestes.

### Mini-player toujours visible

- Plus de `return null` : sans morceau, « Rien en lecture » ; un tap ouvre la modale.
- En télécommande : ligne « Sur *Tablette* » ou « Sur *Tablette de Léa* » sous le titre.
- Sa hauteur est toujours réservée (bouton Play flottant de #277, bas des listes).

### Choix d'appareil

- `components/player/DevicePickerSheet.tsx`, ouvert par un bouton de `PlayerModal`. Sections « Ce téléphone », « Mes appareils », « Appareils de mes amis » ; hors ligne grisé ; appareil actif marqué.
- Choisir un appareil appelle `POST /api/queue/transfer`. En cas de succès : arrêt de l'audio local, `target` sur l'appareil, abonnement à `listening:<owner>`. Choisir « Ce téléphone » transfère vers soi (l'appareil distant se met en pause, le téléphone reprend à sa position).

### Réception d'ordres (`useMusicControl`)

- `play-item` / `play-track` : jouer à `positionMs`, appliquer l'item à la queue ; si le téléphone était en télécommande, `target` repasse à `local`.
- `control:revoked` ou disparition de l'appareil ciblé du `listening:status` : `target` à `local`, avec un message.
- L'enchaînement automatique reste fait par l'appareil qui joue.

## Tests

- Vitest d'intégration : chaque mutation augmente la version, une mutation refusée ne la change pas ; droits délégué / non-délégué sur chaque route ; `DEVICE_OFFLINE` sans mutation ; `queue_insert_block` (position, courant, bloc non synchronisé) ; transfert vers mon appareil et vers celui d'un ami ; `queue:updated` reçu par un délégué et pas par un non-délégué ; `play-item` reçu par le seul appareil ciblé ; `control:revoked` à la révocation ; `controllable-devices`.
- jest-expo : `queueStore` (état plus ancien ignoré par HTTP et par socket, par propriétaire ; deux ajouts dont les réponses arrivent inversées) ; `connectStore` et `useNowPlaying` (local / remote) ; `MiniPlayer` (vide, « Sur … ») ; `DevicePickerSheet` (sections, hors ligne, transfert) ; réception de `play-item` et `control:revoked`.
- `npm run lint`, `npm run type-check` des deux côtés ; appels via Swagger UI.

## Découpage en tickets

Sous l'epic #272, dans cet ordre :

1. **#285** Version de la queue (backend + `queueStore`, encore mono-propriétaire).
2. **Accès délégué à la queue** (backend) : routes `/api/users/:userId/queue/*`, permissions, `deviceId` et `play-item`, `queue:updated` vers `listening:<owner>`, propriétaire autorisé sur ses appareils, `control:revoked`. Reprend #279, qui est fermé au profit de ce ticket.
3. **Transfert et appareils contrôlables** (backend) : `POST /api/queue/transfer`, `queue_insert_block`, `play-track`, `positionMs` dans `listening:update`, `GET /api/music-control/controllable-devices`.
4. **Mini-player toujours visible** (mobile).
5. **Appareil actif et télécommande** (mobile) : `connectStore`, `useNowPlaying`, `queueStore` multi-propriétaire, `QueueModal` d'un ami, réception des ordres.
6. **Choix d'appareil** (mobile) : `DevicePickerSheet` et transfert.

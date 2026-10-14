# #295 Transfert de lecture et appareils contrôlables : implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Le backend transfère ce que je joue vers un autre appareil (le mien ou celui d'un ami licencié), liste les appareils que je peux choisir, et chaque appareil publie sa position de lecture.

**Architecture:**
- **Transfert** : `POST /api/queue/transfer`, dans un service dédié, `queue/services/queue-transfer.service.ts`.
  - Vers mon appareil : un simple ordre (`play-item` ou `play-track`).
  - Vers l'appareil d'un ami : la nouvelle fonction SQL `queue_insert_block` insère mon morceau et ma suite en tête de sa queue, puis un ordre `play-item` part vers son appareil.
  - Un ordre `pause` part vers l'appareil source distant, quand il y en a un.
- **Ordres vers les appareils** : `realtime.sendQueuePlay` devient `sendDeviceCommand`, qui accepte les trois ordres serveur → appareil.
- **Appareils contrôlables** : `GET /api/music-control/controllable-devices` regroupe mes appareils et ceux de mes amis, avec leur état en ligne.
- **Position de lecture** : `listening:update` gagne `positionMs`. Le mobile la lit via un lecteur de position enregistré dans `playerStore` par `PlayerProvider`, et la renvoie après chaque seek.

**Tech Stack:** PostgreSQL (Supabase local), Express/TypeScript, Zod, Socket.io, Vitest ; Zustand et jest-expo côté mobile.

**Spec:** `docs/superpowers/specs/2026-10-14-queue-delegation-connect-design.md` (Backend › Transfert ; Appareils contrôlables ; Temps réel › listening:update). Ticket : #295.

## Écarts assumés par rapport à la spec

1. **`sourceDeviceId` devient `source?: { userId, deviceId }`.** Le backend ne connaît pas l'appareil qui appelle : une requête HTTP ne porte pas son `deviceId`. Le client envoie donc `source` seulement quand l'appareil qui joue est distant, qu'il soit à moi ou à un ami. Le serveur lui envoie alors `pause`, après avoir vérifié que l'acteur contrôle cet appareil.
2. **`playing.queueItemId` désigne un item de ma propre queue.** Pour transférer ce que joue l'appareil d'un ami vers un autre appareil (par exemple revenir sur « Ce téléphone »), le client envoie `playing: { track }`.
3. **La réponse est `{ ownerId, deviceId, queue }`.** `queue` vaut la nouvelle queue de l'ami quand elle a changé, et `null` sinon.
4. **`positionMs` reste optionnel dans `listening:update`.** Les clients plus anciens ne l'envoient pas, et le statut porte alors `positionMs: null`.

## Global Constraints

- Branche `295-transfer-playback` depuis `develop` (déjà créée), PR vers `develop`. Jamais de commit sur `main`.
- Conventional Commits ; chaque message finit par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Backend : imports `@/features/...`, `@/shared/...`, `@/realtime/...` avec `.js` ; pas de barrel ; pas de `any` ; toute entrée validée par Zod ; routes sous `authMiddleware` ; toute route a son entrée OpenAPI ; service < ~150 lignes.
- Migration créée avec `cd backend && make migrate-create name=queue_transfer` → `backend/migrations/025_queue_transfer.sql`, SQL écrit **avant** `make supabase-up` (sinon la migration vide est appliquée). Types régénérés par `make generate-types`, jamais à la main. Les tests d'intégration tournent sur la base de test : `cd backend && sh scripts/test-db.sh up` applique la migration.
- Codes d'erreur : 403 `QUEUE_ACCESS_DENIED`, 409 `DEVICE_OFFLINE`, 404 `QUEUE_ITEM_NOT_FOUND`. Aucun refus ne modifie une queue.
- Ordres serveur → appareil sur `control:command` :
  - `{ action: 'play-item', fromUserId, item: QueueItem, positionMs, version }` ;
  - `{ action: 'play-track', fromUserId, track: QueueTrack, positionMs }` ;
  - `{ action: 'pause', fromUserId }`.
- Un bloc transféré a `source_playlist_id` à null, ce qui le met hors de portée de la synchro de #278.
- Mobile : appels HTTP via `mobile/src/services/api.ts` ; un changement de réponse backend est reflété dans `mobile/src/types/`.
- Hors scope : interface de choix d'appareil (#298), mode télécommande et réception des ordres (#297).

## Review Focus

1. Transfert vers un ami sans licence ou hors ligne : 403/409, **aucune** queue modifiée, aucun ordre envoyé (pin Task 3).
2. `queueItemId` qui n'est pas dans ma queue (celui d'un autre) : 404, rien de modifié (pin Task 3).
3. `source` désignant un appareil que l'acteur ne contrôle pas : 403 avant toute modification (pin Task 3).
4. `controllable-devices` ne montre jamais l'appareil d'un ami sans licence ni interrupteur, ni un non-ami (pin Task 4).
5. Un client ancien sans `positionMs` reste accepté par `listening:update` (pin Task 1).

---

### Task 1: Ordres vers les appareils et position dans le statut d'écoute (backend)

**Files:**
- Modify: `backend/src/features/music-control/music-control.types.ts`
- Modify: `backend/src/realtime/index.ts` (`sendQueuePlay` → `sendDeviceCommand`, `applyListeningUpdate`)
- Modify: `backend/src/realtime/music-control-access.ts` (`listeningUpdateSchema`, message d'erreur)
- Modify: `backend/src/features/queue/utils/queue-play-command.ts` et tous les appelants/tests de `sendQueuePlay` (`grep -rn sendQueuePlay backend/src`)
- Test: `backend/src/realtime/music-control-access.test.ts`, `backend/src/realtime/queue-updated.int.test.ts`, `backend/src/realtime/music-control-access.int.test.ts`

**Interfaces:**
- Produces:
  - `QueueTrackCommand = { action: 'play-track'; fromUserId: string; track: QueueTrack; positionMs: number }`
  - `DevicePauseCommand = { action: 'pause'; fromUserId: string }`
  - `DeviceCommand = QueuePlayCommand | QueueTrackCommand | DevicePauseCommand`
  - `realtime.sendDeviceCommand(ownerId: string, deviceId: string, command: DeviceCommand): boolean` (remplace `sendQueuePlay`, même comportement)
  - `ListeningStatus.positionMs: number | null`; `listening:update` accepte `positionMs?: number` (entier ≥ 0, ≤ 86 400 000)

- [ ] **Step 1: Tests qui échouent**

`music-control-access.test.ts` (tests unitaires du schéma) :

```ts
describe('listeningUpdateSchema positionMs (#295)', () => {
	const base = { track: null, isPlaying: true };

	it('accepts a payload without positionMs (older clients)', () => {
		expect(listeningUpdateSchema.parse(base)).toEqual(base);
	});

	it('accepts a whole, non-negative position', () => {
		expect(listeningUpdateSchema.parse({ ...base, positionMs: 61_500 }).positionMs).toBe(61_500);
	});

	it('rejects a negative, fractional or absurd position', () => {
		for (const positionMs of [-1, 1.5, 86_400_001]) {
			expect(listeningUpdateSchema.safeParse({ ...base, positionMs }).success).toBe(false);
		}
	});
});
```

`queue-updated.int.test.ts` : renommer le test `sendQueuePlay` en `sendDeviceCommand` et ajouter, dans le même `describe`, l'envoi d'un `play-track` et d'un `pause` à un seul appareil :

```ts
	it('sends play-track and pause commands to the one device named', async () => {
		const deviceId = `dev-${randomUUID()}`;
		const target = await connect(owner, deviceId);
		const commands: unknown[] = [];
		target.on('control:command', c => commands.push(c));
		const track = { trackUri: 'https://soundcloud.com/a/b', title: 'B', artist: 'A', album: null, albumArt: null, durationMs: 1000 };
		const playTrack = { action: 'play-track' as const, fromUserId: other.id, track, positionMs: 1200 };
		const pause = { action: 'pause' as const, fromUserId: other.id };
		expect(realtime.sendDeviceCommand(owner.id, deviceId, playTrack)).toBe(true);
		expect(realtime.sendDeviceCommand(owner.id, deviceId, pause)).toBe(true);
		await settle();
		expect(commands).toEqual([playTrack, pause]);
	});
```

`music-control-access.int.test.ts` : un test qui publie `listening:update` avec `positionMs: 42_000` et vérifie que l'abonné reçoit `positionMs: 42_000` dans `listening:status`, puis sans `positionMs` et vérifie `positionMs: null`. Utiliser l'aide existante qui publie un statut (`publishAliceStatus` ou équivalent, autour de la ligne 125) en l'étendant d'un paramètre optionnel.

Run: `cd backend && npx vitest run src/realtime/music-control-access.test.ts` puis `npx vitest run --config vitest.int.config.ts src/realtime` — Expected: FAIL.

- [ ] **Step 2: Implémenter**

`music-control.types.ts` : ajouter `QueueTrackCommand`, `DevicePauseCommand`, `DeviceCommand` (importer `QueueTrack` en `import type`), et `positionMs: number | null;` dans `ListeningStatus` avec la doc « Playback position when the status was sent, in ms; null from older clients (#295). »

`music-control-access.ts` : dans `listeningUpdateSchema`, ajouter `positionMs: z.number().int().min(0).max(86_400_000).optional(),` ; adapter le `satisfies` (le type cible devient `Pick<ListeningStatus, 'track' | 'isPlaying'> & { positionMs?: number }`) ; compléter `INVALID_LISTENING_UPDATE_PAYLOAD.message` par `, positionMs? (ms)`.

`realtime/index.ts` : `applyListeningUpdate` pose `positionMs: data.positionMs ?? null` dans le statut ; renommer `sendQueuePlay` en `sendDeviceCommand(ownerId, deviceId, command: DeviceCommand)`, sa doc « Send one control command to one of ownerId's devices (#294, #295)… », et son log garde `action: 'command_sent'` en ajoutant `command: command.action` (retirer `itemId`, qui n'existe que pour `play-item`).

Mettre à jour `queue-play-command.ts` et tous les tests qui espionnent `sendQueuePlay` (dont `queue-delegation.int.test.ts`).

Run: les commandes du Step 1, puis `npm test && npm run type-check && npm run lint` — Expected: PASS.

- [ ] **Step 3: Commit** — `feat(backend): device commands for transfer and playback position in listening status`

---

### Task 2: Fonctions SQL du transfert

**Files:**
- Create: `backend/migrations/025_queue_transfer.sql`
- Modify (généré): `backend/src/shared/types/supabase.generated.ts`
- Modify: `backend/src/features/queue/utils/queue-rpc.ts`
- Test: Create `backend/src/features/queue/services/queue-transfer-sql.int.test.ts`

**Interfaces:**
- Produces (SQL, `service_role` seulement) :
  - `queue_track_ids_from(p_user uuid, p_item_id uuid) RETURNS uuid[]` — le `track_id` de l'item puis ceux des items suivants, dans l'ordre des rangs ; `QUEUE_ITEM_NOT_FOUND` si l'item n'est pas à `p_user`.
  - `queue_track_ids_upcoming(p_user uuid) RETURNS uuid[]` — les `track_id` des items après le courant (tous si aucun courant), dans l'ordre ; tableau vide sans queue.
  - `queue_insert_block(p_user uuid, p_track_ids uuid[]) RETURNS jsonb` — sous `queue_lock`, insère les morceaux en un bloc (`block_id` neuf, `source_playlist_id` null, `block_detached` false) juste après le courant (en tête sans courant), fait du premier le courant, renvoie `queue_state`. `QUEUE_BLOCK_EMPTY` si le tableau est vide.
- Produces (TS, `queue-rpc.ts`) :
  - `trackIdsFromRpc(userId: string, itemId: string): Promise<string[]>`
  - `upcomingTrackIdsRpc(userId: string): Promise<string[]>`
  - `insertBlockRpc(userId: string, trackIds: string[]): Promise<QueueState>`
  - `QUEUE_BLOCK_EMPTY` mappé en 409 dans `ERRORS`.

- [ ] **Step 1: Créer le fichier de migration** : `cd backend && make migrate-create name=queue_transfer` (ne pas lancer `make supabase-up` avant d'avoir écrit le SQL).

- [ ] **Step 2: Tests d'intégration qui échouent**

`queue-transfer-sql.int.test.ts` (reprendre `createUser`, `dto` et la mise en place de `queue.service.int.test.ts:21-40`, sans factoriser ; `QueueService` avec la signature `(actorId, ownerId, …)` de #294) :

```ts
describe('queue_track_ids_from / queue_track_ids_upcoming', () => {
	it('returns the item and the following ones, in queue order', async () => {
		const ids = await addItems(3); // a, b, c
		const state = await queue.getQueue(userId, userId);
		const trackIds = await trackIdsFromRpc(userId, ids[1]);
		expect(trackIds).toHaveLength(2);
		const tracks = await trackIdsOf(state.items.slice(1)); // helper: select id from tracks where track_uri in …
		expect(trackIds).toEqual(tracks);
	});

	it("refuses another user's item with 404 QUEUE_ITEM_NOT_FOUND", async () => {
		const other = await createUser();
		const [foreign] = await addItems(1, other);
		await expect(trackIdsFromRpc(userId, foreign)).rejects.toMatchObject({ statusCode: 404 });
	});

	it('returns the items after the current one, or all without one, or none', async () => {
		expect(await upcomingTrackIdsRpc(userId)).toEqual([]);
		const ids = await addItems(3);
		expect(await upcomingTrackIdsRpc(userId)).toHaveLength(3);
		await queue.playItem(userId, userId, ids[0]);
		expect(await upcomingTrackIdsRpc(userId)).toHaveLength(2);
	});
});

describe('queue_insert_block', () => {
	it('inserts the tracks as one block right after the current item and plays the first', async () => {
		const ids = await addItems(2); // x, y
		await queue.playItem(userId, userId, ids[0]); // x current, y upcoming
		const before = await queue.getQueue(userId, userId);
		const block = await trackIdsOf((await addItemsTo(otherUser, 2)).items); // two tracks from elsewhere
		const state = await insertBlockRpc(userId, block);
		const order = state.items.map(i => i.id);
		expect(order[0]).toBe(ids[0]);
		expect(order.at(-1)).toBe(ids[1]);
		const inserted = state.items.slice(1, 3);
		expect(state.currentItemId).toBe(inserted[0].id);
		expect(new Set(inserted.map(i => i.blockId)).size).toBe(1);
		expect(inserted.every(i => i.sourcePlaylistId === null && !i.blockDetached)).toBe(true);
		expect(state.version).toBeGreaterThan(before.version);
	});

	it('puts the block first when nothing is current', async () => {
		const ids = await addItems(1);
		const state = await insertBlockRpc(userId, await trackIdsOf((await queue.getQueue(userId, userId)).items));
		expect(state.items[0].id).not.toBe(ids[0]);
		expect(state.currentItemId).toBe(state.items[0].id);
	});

	it('refuses an empty block and changes nothing', async () => {
		await addItems(1);
		const before = await queue.getQueue(userId, userId);
		await expect(insertBlockRpc(userId, [])).rejects.toMatchObject({ code: 'QUEUE_BLOCK_EMPTY' });
		expect(await queue.getQueue(userId, userId)).toEqual(before);
	});
});
```

Écrire les aides `trackIdsOf(items)` (requête `tracks` par `track_uri`, en conservant l'ordre des items) et `addItemsTo(user, n)` dans le fichier. Remplacer les noms provisoires (`otherUser`) par des variables réelles créées dans `beforeAll`.

Run: `cd backend && npx vitest run --config vitest.int.config.ts src/features/queue/services/queue-transfer-sql.int.test.ts` — Expected: FAIL (fonctions absentes).

- [ ] **Step 3: Écrire la migration**

`025_queue_transfer.sql` (en-tête dans le style de 022 ; reprendre la boucle d'insertion et la règle de rebalance de `queue_play_playlist`, migration 022, en itérant sur `unnest(p_track_ids) WITH ORDINALITY ORDER BY ordinality`) :

```sql
-- =====================================================
-- 025: queue_transfer
-- Transfer of playback to a friend's device (#295): the tracks the sender
-- plays (their current track, then what follows in their queue) become a new
-- block right after the friend's current item, and the block's first item
-- becomes current. The block has no source playlist, so the playlist sync of
-- migration 023 never touches it. The caller checks the device license.
-- =====================================================

CREATE OR REPLACE FUNCTION public.queue_track_ids_from(p_user uuid, p_item_id uuid)
RETURNS uuid[]
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  from_rank text COLLATE "C";
BEGIN
  SELECT rank INTO from_rank FROM public.play_queue_items WHERE id = p_item_id AND user_id = p_user;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'QUEUE_ITEM_NOT_FOUND';
  END IF;
  RETURN ARRAY(
    SELECT track_id FROM public.play_queue_items
    WHERE user_id = p_user AND rank >= from_rank
    ORDER BY rank COLLATE "C"
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.queue_track_ids_upcoming(p_user uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
AS $$
  SELECT ARRAY(
    SELECT i.track_id FROM public.play_queue_items i
    WHERE i.user_id = p_user
      AND i.rank > coalesce(public.queue_current_rank(p_user), '')
    ORDER BY i.rank COLLATE "C"
  );
$$;
```

Vérifier dans 023 que `queue_current_rank` renvoie null sans courant ; avec `coalesce(…, '')`, tout rang est `> ''`. Puis `queue_insert_block(p_user uuid, p_track_ids uuid[]) RETURNS jsonb` : `RAISE EXCEPTION 'QUEUE_BLOCK_EMPTY'` si `coalesce(array_length(p_track_ids, 1), 0) = 0` (avant `queue_lock`, pour ne rien modifier) ; ensuite le corps de `queue_play_playlist` sans la partie playlist, `source_playlist_id` à null. Finir par les `REVOKE … FROM PUBLIC, anon, authenticated` et `GRANT … TO service_role` des trois fonctions, comme en 022.

Appliquer : `make supabase-up` (racine), `make generate-types`, `cd backend && sh scripts/test-db.sh up`.

- [ ] **Step 4: RPC TypeScript**

`queue-rpc.ts` : ajouter `QUEUE_BLOCK_EMPTY: { status: 409, message: 'Nothing to transfer' }` à `ERRORS`, et trois fonctions. Les deux lectures de `uuid[]` passent par un schéma `z.array(z.uuid())` et `toAppError` comme `call` ; si `call` ne s'y prête pas (il parse un `QueueState`), écrire une petite fonction `callIds(operation, request)` à côté, sur le même modèle.

Run: le test du Step 2, puis `npm run type-check` — Expected: PASS.

- [ ] **Step 5: Commit** — `feat(backend): SQL functions to transfer playback as a queue block`

---

### Task 3: `POST /api/queue/transfer`

**Files:**
- Create: `backend/src/features/queue/services/queue-transfer.service.ts`
- Modify: `backend/src/features/queue/queue.validators.ts` (+ test), `queue.types.ts`, `queue.controller.ts`, `queue.routes.ts`, `queue.openapi.ts`
- Test: Create `backend/src/features/queue/services/queue-transfer.int.test.ts`

**Interfaces:**
- Consumes: Task 1 (`sendDeviceCommand`, `DeviceCommand` types), Task 2 (RPCs), #294 (`resolvePlaybackDevice`, `controlAccessService.canControlDevice`, `realtime.notifyQueueUpdate`, `upsertTrack`).
- Produces:
  - Body `transferSchema` : `{ targetUserId: uuid, targetDeviceId: string(1..128), positionMs: int ≥ 0 ≤ 86 400 000, playing: { queueItemId: uuid } | { track: addQueueItemSchema }, source?: { userId: uuid, deviceId: string(1..128) } }`.
  - `TransferResult = { ownerId: string; deviceId: string; queue: QueueState | null }` (dans `queue.types.ts`).
  - `queueTransferService.transfer(actorId: string, input: TransferInput): Promise<TransferResult>`.

Règles, dans cet ordre, toutes **avant** la moindre modification :
1. `resolvePlaybackDevice(actorId, targetUserId, targetDeviceId)` : licence (ou propriétaire) et appareil en ligne, sinon 403 ou 409.
2. Si `source` est fourni, `controlAccessService.canControlDevice(actorId, source.userId, source.deviceId)`, sinon 403 `QUEUE_ACCESS_DENIED`. Une source hors ligne n'est pas une erreur, l'ordre `pause` est simplement perdu.
3. Si `playing.queueItemId` est fourni, l'item doit être dans **ma** queue, sinon 404 `QUEUE_ITEM_NOT_FOUND`.

Puis :
- **Cible = moi (`targetUserId === actorId`).** Rien ne change dans ma queue. L'ordre envoyé dépend de `playing` :
  - `{ queueItemId }` → `play-item` avec cet item (lu dans ma queue), `positionMs` et `version` de ma queue ;
  - `{ track }` → `play-track` avec le morceau normalisé en `QueueTrack` (`album ?? null`, `albumArt ?? null`).
  - Résultat : `queue: null`.
- **Cible = un ami.** On calcule les morceaux à insérer :
  - `{ queueItemId }` → `trackIdsFromRpc(actorId, queueItemId)` ;
  - `{ track }` → `[ (await upsertTrack({ ...track, previewUrl: undefined })).id, ...(await upcomingTrackIdsRpc(actorId)) ]`.
  
  Ensuite :
  - `insertBlockRpc(targetUserId, trackIds)` ;
  - `realtime.notifyQueueUpdate(targetUserId, state)` ;
  - `play-item` vers la cible, avec l'item courant de `state`, `positionMs` et `state.version`.
  
  Résultat : `queue: state`.
- **Source fournie.** Le serveur envoie `pause` à la source, après l'ordre de lecture.
- **Journal.** On écrit `Queue transfer` avec l'acteur, la cible, la source et le nombre de morceaux. Un ordre non délivré donne un `logger.warn`, comme `queue-play-command.ts`.

- [ ] **Step 1: Validateur et tests unitaires** — `transferSchema` dans `queue.validators.ts` (union `z.union([z.object({ queueItemId: z.uuid() }), z.object({ track: addQueueItemSchema })])` pour `playing`) ; tests dans `queue.validators.test.ts` : accepte les deux formes de `playing`, avec et sans `source` ; refuse `positionMs` négatif, `playing` vide, `targetUserId` non uuid. FAIL puis PASS.

- [ ] **Step 2: Tests d'intégration qui échouent**

`queue-transfer.int.test.ts` : même mise en place que `queue-delegation.int.test.ts` (copier `createUser`, `dto`, `befriend`, `license`, le `Set` `online` et les espions sur `realtime` — espionner `sendDeviceCommand` et `notifyQueueUpdate`). Cas :

```ts
describe('transfer to one of my devices', () => {
	it('sends play-item at my position and leaves my queue unchanged', async () => {
		online.add(`${me}:tablet`);
		const added = await queue.addItem(me, me, dto());
		await queue.playItem(me, me, added.items[0].id);
		const before = await queue.getQueue(me, me);
		const result = await transfer.transfer(me, {
			targetUserId: me, targetDeviceId: 'tablet', positionMs: 30_000,
			playing: { queueItemId: before.currentItemId! },
		});
		expect(result).toEqual({ ownerId: me, deviceId: 'tablet', queue: null });
		expect(sendDeviceCommand).toHaveBeenCalledWith(me, 'tablet', {
			action: 'play-item', fromUserId: me, item: before.items[0], positionMs: 30_000, version: before.version,
		});
		expect(await queue.getQueue(me, me)).toEqual(before);
	});

	it('sends play-track for a track played outside the queue', async () => { /* playing: { track: dto() } → play-track with album: null, albumArt: null */ });

	it('pauses the remote source after the play command', async () => {
		/* source: { userId: me, deviceId: 'phone' } → calls in order: play-item to tablet, then pause to phone */
	});
});

describe('transfer to a friend device', () => {
	it('puts my track and what follows first in the friend queue and plays it there', async () => {
		/* me: queue a,b,c with b current; friend: queue x current, y upcoming; license me on friend's 'tv' online.
		   transfer(me, { targetUserId: friend, targetDeviceId: 'tv', positionMs: 5000, playing: { queueItemId: b } })
		   → friend queue = x, b', c', y ; current = b' ; result.queue equals that state ; notifyQueueUpdate(friend, state) ;
		   play-item to friend:tv with b' and positionMs 5000 ; my own queue unchanged */
	});

	it('uses the played track then my upcoming items when playing outside the queue', async () => { /* playing: { track } */ });

	it('refuses without a license (403) or offline (409), changing no queue and sending nothing', async () => { /* both queues toEqual before; sendDeviceCommand not called */ });

	it("refuses an item that is not in my queue with 404, changing nothing", async () => { /* friend's item id */ });

	it('refuses a source device I do not control with 403, before any change', async () => { /* source: { userId: stranger, deviceId: 'x' } */ });
});
```

Les blocs `/* … */` décrivent l'entrée et les assertions exactes à écrire ; les écrire en entier sur le modèle du premier test (états `before` comparés avec `toEqual`, appels vérifiés avec `toHaveBeenCalledWith` et `mock.invocationCallOrder` pour l'ordre play puis pause).

Run: `npx vitest run --config vitest.int.config.ts src/features/queue/services/queue-transfer.int.test.ts` — FAIL.

- [ ] **Step 3: Service** — `queue-transfer.service.ts`, une classe `QueueTransferService` avec `transfer(actorId, input)` suivant les règles ci-dessus, en méthodes privées courtes (`checkSource`, `commandForMe`, `insertForFriend`). Rester sous ~150 lignes. Exporter `queueTransferService`.

- [ ] **Step 4: Controller, route, OpenAPI**
  - `queue.controller.ts` : `transfer(req, res, next)` parse `transferSchema` et répond `{ success: true, data: TransferResult, meta }` (même forme que `sendState`, via une petite fonction `sendData`).
  - `queue.routes.ts` : `router.post('/transfer', …)`. Le router est aussi monté sous `/api/users/:userId/queue` : le handler répond 404 `NOT_FOUND` quand `req.params.userId` est présent (le transfert part toujours de l'appelant), avec un test dans le fichier d'intégration qui appelle le controller avec `params.userId` (ou, plus simple, retirer la route du montage délégué en la plaçant sur un router séparé `queue-transfer.routes.ts` monté à `/api/queue/transfer` ; choisir l'option la plus simple et la justifier dans le rapport).
  - `queue.openapi.ts` : `POST /api/queue/transfer` avec `TransferRequest`, `TransferResult`, réponses 200/400/403/404/409, et la description des ordres envoyés (`play-item`, `play-track`, `pause`). L'opération ne doit pas apparaître dans les miroirs `/api/users/{userId}/queue`.

- [ ] **Step 5: Vérifier** — `npx vitest run --config vitest.int.config.ts src/features/queue src/realtime && npm test && npm run type-check && npm run lint` — PASS.

- [ ] **Step 6: Commit** — `feat(backend): transfer playback to my or a friend's device`

---

### Task 4: `GET /api/music-control/controllable-devices`

**Files:**
- Create: `backend/src/features/music-control/services/controllable-devices.service.ts`
- Modify: `music-control.types.ts`, `music-control.controller.ts`, `music-control.routes.ts`, `music-control.openapi.ts`
- Test: Create `backend/src/features/music-control/services/controllable-devices.int.test.ts`

**Interfaces:**
- Produces:

```ts
/** GET /api/music-control/controllable-devices (#295) */
export interface DevicePickerOwner {
	ownerId: string;
	username: string;
	isSelf: boolean;
	devices: Array<ControllableDevice & { online: boolean }>;
}
export interface DevicePickerResponse {
	owners: DevicePickerOwner[]; // me first, then friends with at least one device, by username
}
```

Règles :
- **Moi** : tous mes appareils (`listOwnerDevices(me)`), `access: 'all-devices'`.
- **Chaque ami mutuel** (`FriendsService.getMutualFriends(me)`) : `deviceLicenseService.listControllable(me, friendId)`. Un ami sans appareil contrôlable est omis.
- **`online`** : `realtime.isDeviceOnline(ownerId, deviceId)`. L'import de `realtime` est paresseux (`await import('@/realtime/index.js')`), comme `friends/utils/listening-access.ts`, pour éviter le cycle realtime → music-control.
- **Mon `username`** : lu dans `user_profiles`.

- [ ] **Step 1: Tests d'intégration qui échouent** — cas :
  - mes appareils d'abord, avec `isSelf: true` ;
  - un ami avec l'interrupteur → tous ses appareils ;
  - un ami avec une seule licence → ce seul appareil ;
  - un ami sans licence ni interrupteur → absent ;
  - un non-ami qui m'a licencié (follow à sens unique) → absent ;
  - `online` reflète `isDeviceOnline` (espion sur `realtime`).
  
  Mise en place copiée de `queue-delegation.int.test.ts`.
- [ ] **Step 2: Service, controller, route `router.get('/controllable-devices', …)`** (à déclarer avant toute route paramétrée qui pourrait la masquer), OpenAPI avec l'exemple de réponse. PASS.
- [ ] **Step 3: Vérifier** — `npx vitest run --config vitest.int.config.ts src/features/music-control && npm test && npm run type-check && npm run lint`.
- [ ] **Step 4: Commit** — `feat(backend): list the devices I can play on`

---

### Task 5: Le mobile publie sa position de lecture

**Files:**
- Modify: `mobile/src/store/playerStore.ts` (lecteur de position, compteur de seek)
- Modify: `mobile/src/contexts/PlayerContext.tsx` (enregistre le lecteur de position)
- Modify: `mobile/src/components/player/PlayerModal.tsx` (`handleSeek` et le seek à 0 de `handlePrevious` signalent le seek)
- Modify: `mobile/src/hooks/useMusicControl.ts` (`emitStatus` envoie `positionMs`, réagit au compteur de seek), `ListeningStatus` mobile (`positionMs: number | null`)
- Modify: `mobile/src/types/` : les types de réponse de `controllable-devices` et de `transfer` (`DevicePickerResponse`, `TransferResult`, body `TransferRequest`) pour #297/#298
- Test: `mobile/src/hooks/useMusicControl.test.ts`, `mobile/src/store/playerStore.test.ts`

**Interfaces:**
- Produces (playerStore) :
  - `setPositionReader(reader: (() => number) | null): void` — `PlayerProvider` y enregistre `() => player.currentTime * 1000` et le retire au démontage.
  - `readPositionMs(): number | null` — `null` sans lecteur.
  - `seekCount: number` et `markSeek(): void`.
- `listening:update` envoie `{ track, isPlaying, positionMs }` avec `positionMs = Math.round(readPositionMs() ?? 0)`.

- [ ] **Step 1: Tests qui échouent**
  - `playerStore.test.ts` : `readPositionMs()` vaut `null` sans lecteur et la valeur du lecteur sinon ; `markSeek()` augmente `seekCount`.
  - `useMusicControl.test.ts` : le test existant attend désormais `{ track: null, isPlaying: true, positionMs: 0 }`. Un nouveau test enregistre un lecteur qui renvoie `12_345.6` et vérifie `positionMs: 12_346`. Un autre vérifie qu'un `markSeek()` déclenche un nouvel envoi avec la nouvelle position (avancer les timers de 200 ms).
- [ ] **Step 2: Implémenter.**
  - `PlayerContext.tsx` : `useEffect` qui enregistre le lecteur de position quand `player` change, et le retire au démontage.
  - `useMusicControl.ts` : ajouter `seekCount` aux dépendances de l'effet qui envoie le statut.
  - Types mobiles : miroir exact des types backend des Tasks 1, 3 et 4.
- [ ] **Step 3: Vérifier** — `cd mobile && npm test && npm run type-check && npm run lint`.
- [ ] **Step 4: Commit** — `feat(mobile): publish the playback position in the listening status`

---

### Task 6: Vérification et PR

- [ ] `make test` à la racine ; `cd backend && npm run test:int`.
- [ ] Swagger UI : `POST /api/queue/transfer` et `GET /api/music-control/controllable-devices` documentés ; `transfer` absent des miroirs délégués.
- [ ] PR vers `develop`, `--assignee @me`, corps : résumé, écarts assumés (section en tête de ce plan), « Mobile : #297, #298 », note de déploiement « appliquer `025_queue_transfer.sql` sur le Supabase hébergé avant le backend », attribution Claude Code.
- [ ] CI verte (relancer un job en cas d'erreur Docker Hub `toomanyrequests`) → merge dans `develop` → fermer #295 à la main.

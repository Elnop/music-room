# #294 Un délégué gère la queue du propriétaire : implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un ami qui contrôle au moins un appareil du propriétaire gère sa queue comme lui, et ses actions de lecture (jouer un item, suivant, précédent, lancer une playlist) font jouer un appareil licencié du propriétaire.

**Architecture:** Le même router queue est monté sur `/api/queue` (propriétaire = appelant) et `/api/users/:userId/queue` (propriétaire = `:userId`). Le service prend `(actorId, ownerId, …)` ; `queue/permissions/queue.permissions.ts` décide qui peut gérer la queue et sur quel appareil jouer. Le temps réel gagne trois choses : `queue:updated` part aussi vers `listening:<owner>`, un ordre `control:command play-item` vers l'appareil ciblé, et `control:revoked` quand un délégué perd son dernier appareil.

**Tech Stack:** Express/TypeScript, Zod, Socket.io, Supabase (Postgres local), Vitest (unit + intégration).

**Spec:** `docs/superpowers/specs/2026-10-14-queue-delegation-connect-design.md` (Backend › Accès à la queue d'un autre ; Temps réel). Ticket : #294.

## Global Constraints

- Branche `294-delegate-queue-access` depuis `develop` (déjà créée), PR vers `develop`. Jamais de commit sur `main`.
- Conventional Commits ; chaque message finit par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Imports backend via `@/features/...`, `@/shared/...` ou `@/realtime/...`, avec extension `.js`. Pas de barrel `index.ts`. Pas de `any`. Toute entrée validée par Zod.
- Routes protégées par `authMiddleware`. Toute nouvelle route a son entrée OpenAPI.
- Un service reste sous ~150 lignes.
- Codes d'erreur exacts : 403 `QUEUE_ACCESS_DENIED`, 409 `DEVICE_OFFLINE`, 400 `DEVICE_ID_REQUIRED`.
- Événements exacts : `queue:updated` (payload `QueueState` inchangé), `control:command` avec `{ action: 'play-item', fromUserId, item: QueueItem, positionMs: 0, version }`, `control:revoked` avec `{ ownerId }`.
- Les routes `/api/queue/*` existantes gardent leur comportement pour le propriétaire sans `deviceId`.
- Hors scope : mobile (#297), transfert et `play-track` (#295), tout vote ou classement par popularité.

## Review Focus

1. Un refus (403, 409, 400) arrive **avant** toute mutation : queue et version inchangées (pin en Task 3).
2. Le propriétaire qui passe le `deviceId` d'un appareil qui n'est pas à lui (ou d'un autre utilisateur) est refusé : la clé en ligne est `<owner>:<deviceId>` (pin en Task 1).
3. Un propriétaire abonné à son propre `listening:<owner>` ne reçoit `queue:updated` qu'une fois (pin en Task 2).
4. Un ex-ami (unfollow) ou un délégué révoqué ne peut plus lire la queue : 403 sur GET (pin en Task 3).
5. Lancer une playlist privée que le délégué ne peut pas voir, même si le propriétaire la voit : 403 `PLAYLIST_ACCESS_DENIED` (pin en Task 3).

---

### Task 1: Règles d'accès

**Files:**
- Modify: `backend/src/features/music-control/services/control-access.service.ts` (`getAccess`)
- Modify: `backend/src/features/music-control/services/control-access.service.test.ts`
- Modify: `backend/src/realtime/index.ts` (méthode `isDeviceOnline`)
- Create: `backend/src/features/queue/permissions/queue.permissions.ts`
- Test: `backend/src/features/queue/permissions/queue.permissions.test.ts`

**Interfaces:**
- Produces:
  - `controlAccessService.getAccess(ownerId, ownerId)` → `{ isFriend: false, allDevices: true, licensedDeviceIds: [] }` ; donc `canControlDevice(owner, owner, d)` et `canControlAnyDevice(owner, owner)` valent `true`.
  - `realtime.isDeviceOnline(userId: string, deviceId: string): boolean`.
  - `assertCanManageQueue(actorId: string, ownerId: string): Promise<void>` — lève `AppError(403, …, 'QUEUE_ACCESS_DENIED')`.
  - `resolvePlaybackDevice(actorId: string, ownerId: string, deviceId: string | undefined): Promise<string | null>` — renvoie le `deviceId` à faire jouer, ou `null` quand l'appelant joue lui-même (propriétaire sans `deviceId`) ; lève 400 `DEVICE_ID_REQUIRED` (délégué sans `deviceId`), 403 `QUEUE_ACCESS_DENIED` (pas de licence sur cet appareil), 409 `DEVICE_OFFLINE` (appareil non connecté).

- [ ] **Step 1: Test du propriétaire sur ses appareils**

Dans `control-access.service.test.ts`, ajouter dans le `describe('ControlAccessService')` :

```ts
it('gives the owner every one of their own devices, without any query', async () => {
	const access = await service.getAccess('owner', 'owner');
	expect(access).toEqual({ isFriend: false, allDevices: true, licensedDeviceIds: [] });
	expect(from).not.toHaveBeenCalled();
	expect(await service.canControlDevice('owner', 'owner', 'any-device')).toBe(true);
	expect(await service.canControlAnyDevice('owner', 'owner')).toBe(true);
});
```

Si un test existant attend `NO_ACCESS` pour `controllerId === ownerId`, le remplacer par celui-ci. Si `from` n'est pas remis à zéro entre les tests, ajouter `from.mockClear()` dans le `beforeEach` existant.

Run: `cd backend && npx vitest run src/features/music-control/services/control-access.service.test.ts`
Expected: FAIL (`allDevices: false`).

- [ ] **Step 2: Implémenter**

Dans `control-access.service.ts` :

```ts
/** The owner controls every one of their own devices (#294). */
const SELF_ACCESS: ControlAccess = { isFriend: false, allDevices: true, licensedDeviceIds: [] };
```

et dans `getAccess`, remplacer `if (controllerId === ownerId) return NO_ACCESS;` par `if (controllerId === ownerId) return SELF_ACCESS;`. Mettre à jour la doc de classe : « …or the controller is the owner (#294), who controls all of their devices. »

Run: le même test. Expected: PASS. Puis `npx vitest run src/features/music-control` pour vérifier qu'aucun autre test ne dépendait de l'ancien refus ; s'il en existe un, le mettre à jour dans le même esprit et le citer dans le rapport.

- [ ] **Step 3: `isDeviceOnline`**

Dans `backend/src/realtime/index.ts`, à côté de `getUserListeningStatus` :

```ts
	/** Whether a device of userId has a connected socket (#294). */
	isDeviceOnline(userId: string, deviceId: string): boolean {
		return this.deviceToSocket.has(`${userId}:${deviceId}`);
	}
```

- [ ] **Step 4: Tests des permissions (échouent)**

`backend/src/features/queue/permissions/queue.permissions.test.ts` :

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	assertCanManageQueue,
	resolvePlaybackDevice,
} from '@/features/queue/permissions/queue.permissions.js';

const { canControlAnyDevice, canControlDevice, isDeviceOnline } = vi.hoisted(() => ({
	canControlAnyDevice: vi.fn(),
	canControlDevice: vi.fn(),
	isDeviceOnline: vi.fn(),
}));

vi.mock('@/features/music-control/services/control-access.service.js', () => ({
	controlAccessService: { canControlAnyDevice, canControlDevice },
}));

vi.mock('@/realtime/index.js', () => ({
	realtime: { isDeviceOnline },
}));

beforeEach(() => {
	vi.clearAllMocks();
	canControlAnyDevice.mockResolvedValue(false);
	canControlDevice.mockResolvedValue(false);
	isDeviceOnline.mockReturnValue(true);
});

describe('assertCanManageQueue', () => {
	it('lets the owner manage their queue without any lookup', async () => {
		await expect(assertCanManageQueue('owner', 'owner')).resolves.toBeUndefined();
		expect(canControlAnyDevice).not.toHaveBeenCalled();
	});

	it('lets a friend who controls at least one device manage the queue', async () => {
		canControlAnyDevice.mockResolvedValue(true);
		await expect(assertCanManageQueue('friend', 'owner')).resolves.toBeUndefined();
		expect(canControlAnyDevice).toHaveBeenCalledWith('friend', 'owner');
	});

	it('refuses anyone else with 403 QUEUE_ACCESS_DENIED', async () => {
		await expect(assertCanManageQueue('stranger', 'owner')).rejects.toMatchObject({
			statusCode: 403,
			code: 'QUEUE_ACCESS_DENIED',
		});
	});
});

describe('resolvePlaybackDevice', () => {
	it('lets the owner play on the calling device when no deviceId is sent', async () => {
		await expect(resolvePlaybackDevice('owner', 'owner', undefined)).resolves.toBeNull();
	});

	it('requires a deviceId from a delegate', async () => {
		canControlAnyDevice.mockResolvedValue(true);
		await expect(resolvePlaybackDevice('friend', 'owner', undefined)).rejects.toMatchObject({
			statusCode: 400,
			code: 'DEVICE_ID_REQUIRED',
		});
	});

	it('returns a licensed, online device of the owner', async () => {
		canControlDevice.mockResolvedValue(true);
		await expect(resolvePlaybackDevice('friend', 'owner', 'tv')).resolves.toBe('tv');
		expect(canControlDevice).toHaveBeenCalledWith('friend', 'owner', 'tv');
		expect(isDeviceOnline).toHaveBeenCalledWith('owner', 'tv');
	});

	it('refuses a device the actor holds no license on with 403', async () => {
		await expect(resolvePlaybackDevice('friend', 'owner', 'tv')).rejects.toMatchObject({
			statusCode: 403,
			code: 'QUEUE_ACCESS_DENIED',
		});
		expect(isDeviceOnline).not.toHaveBeenCalled();
	});

	it('refuses an offline device with 409 DEVICE_OFFLINE', async () => {
		canControlDevice.mockResolvedValue(true);
		isDeviceOnline.mockReturnValue(false);
		await expect(resolvePlaybackDevice('owner', 'owner', 'tablet')).rejects.toMatchObject({
			statusCode: 409,
			code: 'DEVICE_OFFLINE',
		});
	});

	it("checks the device under the owner's id, so another user's device is offline", async () => {
		canControlDevice.mockResolvedValue(true);
		isDeviceOnline.mockImplementation((userId: string) => userId === 'someone-else');
		await expect(resolvePlaybackDevice('owner', 'owner', 'their-device')).rejects.toMatchObject({
			code: 'DEVICE_OFFLINE',
		});
	});
});
```

Run: `npx vitest run src/features/queue/permissions` — Expected: FAIL (module absent).

- [ ] **Step 5: Implémenter les permissions**

`backend/src/features/queue/permissions/queue.permissions.ts` :

```ts
import { controlAccessService } from '@/features/music-control/services/control-access.service.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { realtime } from '@/realtime/index.js';

/**
 * Who may act on a play queue (#294, subject IV.2.2). The owner, and any friend
 * who may control at least one of the owner's devices (control-access.service.ts),
 * manage the whole queue. An action that changes what plays targets a device:
 * the actor needs control of that device, and it must be online, checked before
 * the queue changes.
 */

const accessDenied = () =>
	new AppError(403, "Not authorized to manage this user's queue", 'QUEUE_ACCESS_DENIED');

/** Throws 403 QUEUE_ACCESS_DENIED unless actorId may manage ownerId's queue. */
export async function assertCanManageQueue(actorId: string, ownerId: string): Promise<void> {
	if (actorId === ownerId) return;
	if (!(await controlAccessService.canControlAnyDevice(actorId, ownerId))) throw accessDenied();
}

/**
 * The owner's device that must play after a playback action, or null when the
 * owner acts from the device that plays (no deviceId). A delegate must name a
 * device it controls; the device must be online.
 */
export async function resolvePlaybackDevice(
	actorId: string,
	ownerId: string,
	deviceId: string | undefined
): Promise<string | null> {
	if (deviceId === undefined) {
		if (actorId === ownerId) return null;
		throw new AppError(400, 'A delegate must name the device to play on', 'DEVICE_ID_REQUIRED');
	}
	if (!(await controlAccessService.canControlDevice(actorId, ownerId, deviceId))) {
		throw accessDenied();
	}
	if (!realtime.isDeviceOnline(ownerId, deviceId)) {
		throw new AppError(409, 'Target device is not online', 'DEVICE_OFFLINE');
	}
	return deviceId;
}
```

Si l'import de `@/realtime/index.js` crée un cycle au chargement (le module realtime importe la queue), le remplacer par un import paresseux comme `friends/utils/listening-access.ts` (`const { realtime } = await import('@/realtime/index.js')`) et adapter le mock du test.

Run: `npx vitest run src/features/queue/permissions src/features/music-control` — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/features/music-control/services backend/src/realtime/index.ts backend/src/features/queue/permissions
git commit -m "feat(backend): queue access rules for delegates and owners' own devices

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Temps réel — queue des délégués, ordre de lecture, révocation

**Files:**
- Modify: `backend/src/realtime/index.ts` (`notifyQueueUpdate`, nouvelle `sendQueuePlay`)
- Modify: `backend/src/realtime/music-control-access.ts` (`leaveListeningRoom` émet `control:revoked`, doc du module)
- Modify: `backend/src/features/music-control/music-control.types.ts` (types des payloads)
- Test: `backend/src/realtime/queue-updated.int.test.ts`, `backend/src/realtime/music-control-access.int.test.ts`

**Interfaces:**
- Consumes: Task 1 (`getAccess` du propriétaire).
- Produces:
  - `QueuePlayCommand` (dans `music-control.types.ts`) : `{ action: 'play-item'; fromUserId: string; item: QueueItem; positionMs: number; version: number }`.
  - `ControlRevokedPayload` : `{ ownerId: string }`.
  - `realtime.sendQueuePlay(ownerId: string, deviceId: string, command: QueuePlayCommand): boolean` — `false` si l'appareil n'a plus de socket.
  - `realtime.notifyQueueUpdate(userId, state)` émet à `user:<id>` et `listening:<id>` en un seul `emit` (un socket dans les deux rooms le reçoit une fois).
  - `leaveListeningRoom(io, controllerId, ownerId)` émet aussi `control:revoked { ownerId }` à `user:<controllerId>`.

- [ ] **Step 1: Types**

Dans `music-control.types.ts` :

```ts
import type { QueueItem } from '@/features/queue/queue.types.js';

/**
 * control:command sent by the server to the owner's device chosen by a
 * playback action on the queue (#294): play `item` from `positionMs`.
 */
export interface QueuePlayCommand {
	action: 'play-item';
	fromUserId: string;
	item: QueueItem;
	positionMs: number;
	/** Version of the queue state that made `item` current. */
	version: number;
}

/** control:revoked: the receiver no longer controls any of ownerId's devices. */
export interface ControlRevokedPayload {
	ownerId: string;
}
```

Si `socket-auth.ts` type les événements serveur → client (`ServerToClientEvents` ou équivalent), y ajouter `'control:command'` (union avec le payload play/pause existant) et `'control:revoked'`.

- [ ] **Step 2: Tests d'intégration (échouent)**

Dans `queue-updated.int.test.ts`, ajouter un `describe` qui réutilise `createUser`, `connect`, `record`, `settle` du fichier :

```ts
describe('queue:updated for delegates', () => {
	// owner, other, phone, tablet, otherSocket come from the outer setup.
	async function befriend(controllerId: string, ownerId: string, allDevices: boolean) {
		await supabaseAdmin.from('follows').delete().in('follower_id', [controllerId, ownerId]);
		const { error } = await supabaseAdmin.from('follows').insert([
			{ follower_id: controllerId, following_id: ownerId, can_control_music: allDevices },
			{ follower_id: ownerId, following_id: controllerId },
		]);
		if (error) throw error;
	}

	function subscribe(socket: ClientSocket, ownerId: string) {
		return new Promise<void>((resolve, reject) => {
			socket.once('listening:status', () => resolve());
			socket.once('listening:error', reject);
			socket.emit('listening:subscribe', ownerId);
		});
	}

	afterEach(async () => {
		await supabaseAdmin.from('follows').delete().in('follower_id', [owner.id, other.id]);
	});

	it('reaches a subscribed delegate', async () => {
		await befriend(other.id, owner.id, true);
		await subscribe(otherSocket, owner.id);
		const received = record(otherSocket);
		const state = await queue.addItem(owner.id, dto());
		await settle();
		expect(received).toEqual([state]);
	});

	it('reaches a subscribed owner device once', async () => {
		await subscribe(phone, owner.id);
		const received = record(phone);
		const state = await queue.addItem(owner.id, dto());
		await settle();
		expect(received).toEqual([state]);
	});

	it('stops reaching a delegate whose access was revoked, who gets control:revoked', async () => {
		await befriend(other.id, owner.id, true);
		await subscribe(otherSocket, owner.id);
		const revoked = new Promise(resolve => otherSocket.once('control:revoked', resolve));
		await supabaseAdmin
			.from('follows')
			.update({ can_control_music: false })
			.eq('follower_id', other.id)
			.eq('following_id', owner.id);
		await realtime.revalidateListeningAccess(other.id, owner.id);
		expect(await revoked).toEqual({ ownerId: owner.id });
		const received = record(otherSocket);
		await queue.addItem(owner.id, dto());
		await settle();
		expect(received).toEqual([]);
	});
});
```

Dans ce `describe` toujours, le test de `sendQueuePlay` :

```ts
	it('sends a play-item command to the one device named', async () => {
		const deviceId = `dev-${randomUUID()}`;
		const target = await connect(owner, deviceId);
		const commands: unknown[] = [];
		target.on('control:command', c => commands.push(c));
		const phoneCommands: unknown[] = [];
		phone.on('control:command', c => phoneCommands.push(c));
		const state = await queue.addItem(owner.id, dto());
		const command = {
			action: 'play-item' as const,
			fromUserId: other.id,
			item: state.items[0],
			positionMs: 0,
			version: state.version,
		};
		expect(realtime.sendQueuePlay(owner.id, deviceId, command)).toBe(true);
		expect(realtime.sendQueuePlay(owner.id, 'offline-device', command)).toBe(false);
		await settle();
		expect(commands).toEqual([command]);
		expect(phoneCommands).toEqual([]);
	});
```

`connect` du fichier ne prend pas de `deviceId` : lui ajouter un second paramètre optionnel `deviceId = \`dev-${randomUUID()}\`` comme dans `music-control-access.int.test.ts:78`. Si `queue = new QueueService()` est déclaré dans le `describe` externe, ces tests y ont accès ; sinon déplacer le nouveau `describe` à l'intérieur. Les signatures du service changent en Task 3 : ici, `queue.addItem(owner.id, dto())` reste l'appel actuel.

Dans `music-control-access.int.test.ts`, ajouter un test qui montre que le propriétaire peut envoyer `control:action` à un autre de ses appareils :

```ts
it("lets the owner pause another of their own devices", async () => {
	const deviceA = `dev-${randomUUID()}`;
	const tv = await connect(alice, deviceA);
	const phone = await connect(alice);
	const command = new Promise(resolve => tv.once('control:command', resolve));
	const outcome = new Promise(resolve => phone.once('control:success', resolve));
	phone.emit('control:action', { targetUserId: alice.id, targetDeviceId: deviceA, action: 'pause' });
	await outcome;
	expect(await command).toMatchObject({ action: 'pause', fromUserId: alice.id });
});
```

(adapter les noms `alice`/`connect` à ceux du fichier ; le placer dans le `describe` qui gère le contrôle par appareil).

Run: si la base de test ne tourne pas, `cd backend && sh scripts/test-db.sh up` ; puis `cd backend && npx vitest run --config vitest.int.config.ts src/realtime/queue-updated.int.test.ts src/realtime/music-control-access.int.test.ts`
Expected: FAIL (délégué non atteint, `sendQueuePlay` absent, pas de `control:revoked`). Le test du propriétaire passe déjà grâce à la Task 1 : c'est attendu.

- [ ] **Step 3: Implémenter**

`realtime/index.ts`, `notifyQueueUpdate` :

```ts
	/**
	 * Send a user's whole play queue after any change to it (#273): to all of
	 * their devices (`user:<id>`) and to the delegates watching them
	 * (`listening:<id>`, #294). One emit, so a socket in both rooms gets it once.
	 */
	notifyQueueUpdate(userId: string, state: QueueState): void {
		// … garde le bloc `if (!this.io)` existant
		const rooms = [`user:${userId}`, listeningRoom(userId)];
		this.io.to(rooms).emit('queue:updated', state);

		socketLogger.broadcast('queue_updated', {
			userId,
			items: state.items.length,
			version: state.version,
			room: rooms.join(','),
			action: 'broadcasted',
		});
	}

	/**
	 * Tell one of ownerId's devices to play a queue item (#294). False when the
	 * device has no socket any more.
	 */
	sendQueuePlay(ownerId: string, deviceId: string, command: QueuePlayCommand): boolean {
		const socketId = this.deviceToSocket.get(`${ownerId}:${deviceId}`);
		if (!socketId || !this.io) return false;
		this.io.to(socketId).emit('control:command', command);
		socketLogger.broadcast('queue_play_command', {
			ownerId,
			deviceId,
			fromUserId: command.fromUserId,
			itemId: command.item.id,
			action: 'command_sent',
		});
		return true;
	}
```

`music-control-access.ts`, `leaveListeningRoom` : juste après `socketsLeave(room)`,

```ts
		const payload: ControlRevokedPayload = { ownerId };
		io.to(`user:${controllerId}`).emit('control:revoked', payload);
```

et dans le commentaire d'en-tête du module, ajouter : « When access shrinks to no device, the controller also gets `control:revoked { ownerId }` (#294). »

Run: les deux fichiers d'intégration. Expected: PASS. Puis `npx vitest run --config vitest.int.config.ts src/realtime` pour vérifier les autres tests socket.

- [ ] **Step 4: Commit**

```bash
git add backend/src/realtime backend/src/features/music-control/music-control.types.ts
git commit -m "feat(backend): queue updates for delegates, play-item command and control:revoked

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Service, routes et OpenAPI

**Files:**
- Modify: `backend/src/features/queue/services/queue.service.ts`
- Modify: `backend/src/features/queue/queue.controller.ts`
- Modify: `backend/src/features/queue/queue.routes.ts`
- Modify: `backend/src/features/queue/queue.validators.ts` (+ `queue.validators.test.ts`)
- Modify: `backend/src/shared/config/routes.ts`
- Modify: `backend/src/features/queue/queue.openapi.ts`
- Test: `backend/src/features/queue/services/queue.service.int.test.ts`, `queue-sync.int.test.ts`, `backend/src/realtime/queue-updated.int.test.ts` (appels adaptés) ; Create: `backend/src/features/queue/services/queue-delegation.int.test.ts`

**Interfaces:**
- Consumes: Task 1 (`assertCanManageQueue`, `resolvePlaybackDevice`), Task 2 (`realtime.sendQueuePlay`, `QueuePlayCommand`).
- Produces (service, `QueueService`) :
  - `getQueue(actorId, ownerId)`, `addItem(actorId, ownerId, track)`, `removeItem(actorId, ownerId, itemId)`, `moveItem(actorId, ownerId, itemId, afterItemId)`.
  - `playItem(actorId, ownerId, itemId, deviceId?)`, `step(actorId, ownerId, direction, deviceId?)`, `playPlaylist(actorId, ownerId, playlistId, deviceId?)`.
  - HTTP : les mêmes routes sous `/api/queue` et `/api/users/:userId/queue` ; `deviceId` optionnel dans le body JSON de `POST …/items/:itemId/play`, `…/next`, `…/previous`, `…/playlists/:playlistId/play`.

- [ ] **Step 1: Validateur du body de lecture**

`queue.validators.ts` :

```ts
/** Path segment of /api/users/:userId/queue routes. */
export const queueOwnerParamsSchema = z.object({
	userId: z.uuid('Invalid user ID format').optional(),
});

/**
 * Body of the playback routes (play an item, next, previous, play a playlist):
 * the owner's device that must play; a delegate must send it (#294).
 */
export const queuePlaybackSchema = z
	.object({ deviceId: z.string().min(1).max(128).optional() })
	.optional()
	.transform(body => body ?? {});
```

`queue.validators.test.ts` : ajouter

```ts
describe('queuePlaybackSchema', () => {
	it('accepts no body, an empty body, or a deviceId', () => {
		expect(queuePlaybackSchema.parse(undefined)).toEqual({});
		expect(queuePlaybackSchema.parse({})).toEqual({});
		expect(queuePlaybackSchema.parse({ deviceId: 'tv' })).toEqual({ deviceId: 'tv' });
	});

	it('rejects an empty or oversized deviceId', () => {
		expect(() => queuePlaybackSchema.parse({ deviceId: '' })).toThrow();
		expect(() => queuePlaybackSchema.parse({ deviceId: 'x'.repeat(129) })).toThrow();
	});
});

describe('queueOwnerParamsSchema', () => {
	it('accepts a missing userId (own queue) or a uuid', () => {
		expect(queueOwnerParamsSchema.parse({})).toEqual({});
		const id = '0b0e7b4e-0000-4000-8000-000000000000';
		expect(queueOwnerParamsSchema.parse({ userId: id })).toEqual({ userId: id });
	});

	it('rejects a non-uuid userId', () => {
		expect(() => queueOwnerParamsSchema.parse({ userId: 'nope' })).toThrow();
	});
});
```

Run: `npx vitest run src/features/queue/queue.validators.test.ts` — FAIL, puis implémenter, puis PASS.

- [ ] **Step 2: Tests d'intégration de la délégation (échouent)**

`backend/src/features/queue/services/queue-delegation.int.test.ts`. Mise en place (copier `createUser`, `dto` depuis `queue.service.int.test.ts:21-40` ; ne pas factoriser) :

```ts
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { QueueService } from '@/features/queue/services/queue.service.js';
import { PlaylistService } from '@/features/playlists/playlist.service.js';
import { realtime } from '@/realtime/index.js';

// #294: a friend who controls at least one device of the owner manages the
// owner's queue; playback actions target a device the friend controls, online.
// No Socket.io server runs here: device presence and commands are stubbed on
// the realtime singleton.

const queue = new QueueService();
// createUser, dto: copied from queue.service.int.test.ts
let owner: string;
let friend: string;
let stranger: string;

const online = new Set<string>();
const sendQueuePlay = vi.spyOn(realtime, 'sendQueuePlay').mockReturnValue(true);
vi.spyOn(realtime, 'isDeviceOnline').mockImplementation(
	(userId, deviceId) => online.has(`${userId}:${deviceId}`)
);

async function befriend(allDevices: boolean) {
	const { error } = await supabaseAdmin.from('follows').insert([
		{ follower_id: friend, following_id: owner, can_control_music: allDevices },
		{ follower_id: owner, following_id: friend },
	]);
	if (error) throw error;
}

async function license(deviceId: string) {
	await supabaseAdmin
		.from('devices')
		.upsert({ user_id: owner, device_id: deviceId, device_name: 'TV', platform: 'android', model: 'X' });
	const { error } = await supabaseAdmin
		.from('device_control_licenses')
		.insert({ owner_id: owner, device_id: deviceId, grantee_id: friend });
	if (error) throw error;
}
```

Avant d'écrire `license`, lire `backend/migrations/015_*.sql` (ou le fichier qui crée `devices` et `device_control_licenses`) et `music-control-access.int.test.ts:164-170` pour les colonnes exactes de `devices` et la contrainte qui lie une licence à un appareil existant ; ajuster l'`upsert` en conséquence.

```ts
beforeAll(async () => {
	[owner, friend, stranger] = await Promise.all([createUser(), createUser(), createUser()]);
});

beforeEach(async () => {
	online.clear();
	sendQueuePlay.mockClear();
	await supabaseAdmin.from('follows').delete().in('follower_id', [owner, friend, stranger]);
	await supabaseAdmin.from('play_queues').delete().eq('user_id', owner); // cascades to items
});

afterAll(async () => {
	for (const id of [owner, friend, stranger]) await supabaseAdmin.auth.admin.deleteUser(id);
	vi.restoreAllMocks();
});

describe('managing the queue of another user', () => {
	it('lets a delegate read, add, move and remove in the owner queue', async () => {
		await befriend(true);
		const a = await queue.addItem(friend, owner, dto());
		const b = await queue.addItem(friend, owner, dto());
		expect(b.ownerId).toBe(owner);
		const [first, second] = b.items.map(i => i.id);
		const moved = await queue.moveItem(friend, owner, second, null);
		expect(moved.items[0].id).toBe(second);
		const removed = await queue.removeItem(friend, owner, first);
		expect(removed.items.map(i => i.id)).toEqual([second]);
		expect((await queue.getQueue(friend, owner)).version).toBe(removed.version);
		expect(a.version).toBeLessThan(removed.version);
	});

	it('refuses a stranger with 403 and changes nothing', async () => {
		await queue.addItem(owner, owner, dto());
		const before = await queue.getQueue(owner, owner);
		await expect(queue.getQueue(stranger, owner)).rejects.toMatchObject({ code: 'QUEUE_ACCESS_DENIED' });
		await expect(queue.addItem(stranger, owner, dto())).rejects.toMatchObject({ statusCode: 403 });
		await expect(queue.removeItem(stranger, owner, before.items[0].id)).rejects.toMatchObject({ statusCode: 403 });
		expect(await queue.getQueue(owner, owner)).toEqual(before);
	});

	it('refuses a friend without any device control (switch off, no license)', async () => {
		await befriend(false);
		await expect(queue.getQueue(friend, owner)).rejects.toMatchObject({ code: 'QUEUE_ACCESS_DENIED' });
	});

	it('refuses a former friend after an unfollow', async () => {
		await befriend(true);
		await supabaseAdmin.from('follows').delete().eq('follower_id', owner).eq('following_id', friend);
		await expect(queue.getQueue(friend, owner)).rejects.toMatchObject({ statusCode: 403 });
	});
});

describe('playback by a delegate', () => {
	it('plays next on a licensed online device and sends it the new current item', async () => {
		await befriend(false);
		await license('tv');
		online.add(`${owner}:tv`);
		await queue.addItem(owner, owner, dto());
		await queue.addItem(owner, owner, dto());
		const state = await queue.step(friend, owner, 'next', 'tv');
		expect(sendQueuePlay).toHaveBeenCalledWith(owner, 'tv', {
			action: 'play-item',
			fromUserId: friend,
			item: state.items.find(i => i.id === state.currentItemId),
			positionMs: 0,
			version: state.version,
		});
	});

	it('requires a deviceId from a delegate, before any change', async () => {
		await befriend(true);
		await queue.addItem(owner, owner, dto());
		const before = await queue.getQueue(owner, owner);
		await expect(queue.step(friend, owner, 'next')).rejects.toMatchObject({
			statusCode: 400,
			code: 'DEVICE_ID_REQUIRED',
		});
		expect(await queue.getQueue(owner, owner)).toEqual(before);
	});

	it('refuses an unlicensed device with 403 and an offline one with 409, before any change', async () => {
		await befriend(false);
		await license('tv');
		await queue.addItem(owner, owner, dto());
		const before = await queue.getQueue(owner, owner);
		const itemId = before.items[0].id;
		await expect(queue.playItem(friend, owner, itemId, 'radio')).rejects.toMatchObject({ statusCode: 403 });
		await expect(queue.playItem(friend, owner, itemId, 'tv')).rejects.toMatchObject({
			statusCode: 409,
			code: 'DEVICE_OFFLINE',
		});
		expect(await queue.getQueue(owner, owner)).toEqual(before);
		expect(sendQueuePlay).not.toHaveBeenCalled();
	});

	it("checks the playlist's visibility for the delegate, not the owner", async () => {
		await befriend(true);
		online.add(`${owner}:tv`);
		const playlist = await new PlaylistService().createPlaylist(owner, {
			name: 'Private',
			visibility: 'private',
		});
		await expect(queue.playPlaylist(friend, owner, playlist.id, 'tv')).rejects.toMatchObject({
			code: 'PLAYLIST_ACCESS_DENIED',
		});
	});

	it('lets the owner play on another of their own devices', async () => {
		online.add(`${owner}:tablet`);
		const added = await queue.addItem(owner, owner, dto());
		await queue.playItem(owner, owner, added.items[0].id, 'tablet');
		expect(sendQueuePlay).toHaveBeenCalledWith(
			owner,
			'tablet',
			expect.objectContaining({ action: 'play-item', fromUserId: owner })
		);
	});

	it('sends no command when the owner plays from the calling device', async () => {
		const added = await queue.addItem(owner, owner, dto());
		await queue.playItem(owner, owner, added.items[0].id);
		expect(sendQueuePlay).not.toHaveBeenCalled();
	});
});
```

Vérifier dans `queue.service.int.test.ts:342-380` comment ce fichier crée une playlist (`PlaylistService.createPlaylist` et ses champs exacts) et reprendre la même forme.

Run: `cd backend && npx vitest run --config vitest.int.config.ts src/features/queue/services/queue-delegation.int.test.ts`
Expected: FAIL (signatures du service).

- [ ] **Step 3: Service**

`queue.service.ts` : chaque méthode prend `actorId, ownerId` ; lecture et gestion passent par `assertCanManageQueue` ; les actions de lecture résolvent l'appareil **avant** la mutation, puis envoient l'ordre après `publish`.

```ts
import {
	assertCanManageQueue,
	resolvePlaybackDevice,
} from '@/features/queue/permissions/queue.permissions.js';
import type { QueuePlayCommand } from '@/features/music-control/music-control.types.js';

export class QueueService {
	async getQueue(actorId: string, ownerId: string): Promise<QueueState> {
		await assertCanManageQueue(actorId, ownerId);
		return getQueueRpc(ownerId);
	}

	async addItem(actorId: string, ownerId: string, track: TrackUpsertInput): Promise<QueueState> {
		await assertCanManageQueue(actorId, ownerId);
		// previewUrl is a stream URL: never persisted from a queue add.
		const trackRow = await upsertTrack({ ...track, previewUrl: undefined });
		return this.publish(actorId, ownerId, 'add', await addQueueItemRpc(ownerId, trackRow.id));
	}

	async removeItem(actorId: string, ownerId: string, itemId: string): Promise<QueueState> {
		await assertCanManageQueue(actorId, ownerId);
		return this.publish(actorId, ownerId, 'remove', await removeQueueItemRpc(ownerId, itemId));
	}

	async moveItem(
		actorId: string,
		ownerId: string,
		itemId: string,
		afterItemId: string | null
	): Promise<QueueState> {
		await assertCanManageQueue(actorId, ownerId);
		return this.publish(
			actorId,
			ownerId,
			'move',
			await moveQueueItemRpc(ownerId, itemId, afterItemId)
		);
	}

	async playItem(actorId: string, ownerId: string, itemId: string, deviceId?: string) {
		const device = await this.playbackDevice(actorId, ownerId, deviceId);
		const state = await playQueueItemRpc(ownerId, itemId);
		return this.play(actorId, ownerId, 'play', state, device);
	}

	/** Copies the playlist's tracks into the queue as a new block right after the current item and plays its first item (#277). */
	async playPlaylist(actorId: string, ownerId: string, playlistId: string, deviceId?: string) {
		const device = await this.playbackDevice(actorId, ownerId, deviceId);
		// The actor chooses the playlist: its visibility is checked for them (#294).
		const playlist = await getPlaylistForPermissionCheck(playlistId);
		if (!canViewPlaylist(playlist, actorId)) {
			throw new AppError(403, 'Access denied', 'PLAYLIST_ACCESS_DENIED');
		}
		const state = await playPlaylistRpc(ownerId, playlistId);
		return this.play(actorId, ownerId, 'play-playlist', state, device);
	}

	async step(actorId: string, ownerId: string, direction: QueueStepDirection, deviceId?: string) {
		const device = await this.playbackDevice(actorId, ownerId, deviceId);
		const state = await stepQueueRpc(ownerId, direction);
		return this.play(actorId, ownerId, direction, state, device);
	}

	/** Access to the queue, then the device that must play: both before any change. */
	private async playbackDevice(actorId: string, ownerId: string, deviceId: string | undefined) {
		await assertCanManageQueue(actorId, ownerId);
		return resolvePlaybackDevice(actorId, ownerId, deviceId);
	}

	/** Publishes the state, then tells the target device to play its current item. */
	private play(
		actorId: string,
		ownerId: string,
		operation: string,
		state: QueueState,
		deviceId: string | null
	): QueueState {
		this.publish(actorId, ownerId, operation, state);
		const item = state.items.find(i => i.id === state.currentItemId);
		if (deviceId && item) {
			const command: QueuePlayCommand = {
				action: 'play-item',
				fromUserId: actorId,
				item,
				positionMs: 0,
				version: state.version,
			};
			if (!realtime.sendQueuePlay(ownerId, deviceId, command)) {
				logger.warn('Queue play command not delivered: device went offline', {
					ownerId,
					deviceId,
					actorId,
				});
			}
		}
		return state;
	}

	private publish(actorId: string, ownerId: string, operation: string, state: QueueState): QueueState {
		logger.info('Queue updated', {
			actorId,
			ownerId,
			operation,
			items: state.items.length,
			currentItemId: state.currentItemId,
			version: state.version,
		});
		realtime.notifyQueueUpdate(ownerId, state);
		return state;
	}
}
```

Ajouter les types de retour explicites `Promise<QueueState>` sur `playItem`, `playPlaylist` et `step`. Mettre à jour la doc de classe : « The play queue of ownerId, read or changed by its owner or a delegate (#294)… ». Si le fichier dépasse ~150 lignes, sortir `play` dans `queue/utils/queue-play-command.ts` (fonction `sendPlayCommand(actorId, ownerId, deviceId, state)`) et le dire dans le rapport.

Adapter les appels existants (`queue.addItem(userId, …)` → `queue.addItem(userId, userId, …)`, etc.) dans `queue.service.int.test.ts`, `queue-sync.int.test.ts`, `src/realtime/queue-updated.int.test.ts` et tout autre appelant (`grep -rn "queueService\.\|queue\.\(addItem\|getQueue\|removeItem\|moveItem\|playItem\|playPlaylist\|step\)(" backend/src`). `queue-sync.service.ts` appelle `getQueueRpc` directement : ne pas le changer.

- [ ] **Step 4: Controller, routes, montage**

`queue.controller.ts` :

```ts
const actorOf = (req: Request) => (req as AuthenticatedRequest).user.id;

/** The queue owner: `:userId` on /api/users/:userId/queue, else the caller. */
const ownerOf = (req: Request) => queueOwnerParamsSchema.parse(req.params).userId ?? actorOf(req);
```

Chaque handler appelle le service avec `(actorOf(req), ownerOf(req), …)`. Les handlers `playItem`, `playPlaylist` et `step` lisent `const { deviceId } = queuePlaybackSchema.parse(req.body);` et le passent en dernier argument. Le commentaire de classe devient « Play queue controller: every route answers the full queue state of its owner, the caller or `:userId` (#294). »

`queue.routes.ts` : `const router = Router({ mergeParams: true });` et le commentaire « All routes require authentication; they act on the caller's queue, or on `:userId`'s when mounted under /api/users/:userId/queue (#294). »

`routes.ts` : après l'entrée `/api/queue`,

```ts
	{
		path: '/api/users/:userId/queue',
		router: queueRoutes,
		description: "A friend's play queue, for a delegate who controls one of their devices",
	},
```

Vérifier que le montage accepte un chemin paramétré (lire comment `routes.ts` monte ses entrées) ; si une liste de routes est affichée au démarrage ou testée, l'adapter.

- [ ] **Step 5: OpenAPI**

`queue.openapi.ts` :
- un paramètre `ownerIdParam` (`in: 'path', name: 'userId', format: uuid`, « Id of the queue owner; you must control at least one of their devices »),
- pour chaque chemin `/api/queue…`, un chemin miroir `/api/users/{userId}/queue…` avec `ownerIdParam` et une réponse 403 `QUEUE_ACCESS_DENIED` (générer les miroirs par une fonction qui copie l'objet d'opération, pas par copier-coller),
- un `requestBody` optionnel `QueuePlaybackRequest` (`{ deviceId?: string }`, « Device of the owner that must play; required from a delegate ») sur play item, next, previous, play playlist,
- les réponses 400 `DEVICE_ID_REQUIRED`, 403 `QUEUE_ACCESS_DENIED` et 409 `DEVICE_OFFLINE` sur ces quatre routes, via `errorResponse`,
- l'en-tête du fichier : `queue:updated` va aussi à `listening:<owner>`, et une action de lecture avec `deviceId` envoie `control:command play-item` à cet appareil.

- [ ] **Step 6: Vérifier**

Run: `cd backend && npx vitest run --config vitest.int.config.ts src/features/queue src/realtime && npm test && npm run type-check && npm run lint`
Expected: PASS, sortie sans bruit.

- [ ] **Step 7: Commit**

```bash
git add backend/src
git commit -m "feat(backend): delegates manage the owner's queue and play on a chosen device

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Vérification et PR

- [ ] **Step 1:** `make test` à la racine, puis `cd backend && npm run test:int`. Expected: PASS.
- [ ] **Step 2:** Swagger UI (http://localhost:3000/api-docs, `make dev-docker`) : les routes `/api/users/{userId}/queue…` apparaissent, avec le body `deviceId` et les codes 400/403/409.
- [ ] **Step 3:** PR :

```bash
git push -u origin 294-delegate-queue-access
gh pr create --base develop --assignee @me --title "feat: delegates manage the owner's play queue (#294)" --body "$(cat <<'EOF'
Closes #294

- Same queue routes under `/api/users/:userId/queue`: the owner, or a friend who controls at least one of their devices, manages the queue (403 `QUEUE_ACCESS_DENIED` otherwise).
- Playback actions (play item, next, previous, play playlist) take an optional `deviceId`: required from a delegate (400 `DEVICE_ID_REQUIRED`), checked against the device license (403) and presence (409 `DEVICE_OFFLINE`) before the queue changes; the device then gets `control:command { action: 'play-item', item, positionMs, version }`.
- The owner controls their own devices (`control:action` play/pause between them, `deviceId` on queue playback).
- `queue:updated` also goes to `listening:<owner>`; a delegate losing their last device gets `control:revoked { ownerId }`.
- The playlist's visibility is checked for the actor who plays it.

Mobile side: #297. Spec: `docs/superpowers/specs/2026-10-14-queue-delegation-connect-design.md`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4:** CI verte → merge dans `develop`, puis fermer #294 à la main (`Closes` ne ferme pas sur `develop`).

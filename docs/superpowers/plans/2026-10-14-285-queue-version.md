# #285 Version de la queue : implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chaque état de queue porte une version croissante, et le mobile ignore un état plus ancien que celui qu'il affiche.

**Architecture:** Une colonne `play_queues.version`, augmentée par un trigger `BEFORE UPDATE` sur `play_queues`. Toute mutation qui change la queue met déjà à jour cette ligne (`updated_at` ou `current_item_id`), sous `queue_lock`, alors qu'une synchro playlist qui ne change rien n'y touche pas. `queue_state` renvoie `version` et `ownerId`, et `queueStore.applyState` ignore tout état dont la version est inférieure ou égale à la sienne.

**Tech Stack:** PostgreSQL (Supabase local), Express/TypeScript, Zod, Vitest (intégration), Zustand, jest-expo.

**Spec:** `docs/superpowers/specs/2026-10-14-queue-delegation-connect-design.md`, section « Version de la queue (#285) » et ticket 1 du découpage.

## Global Constraints

- Branche `285-queue-version` depuis `develop`, PR vers `develop` avec `Closes #285`. Jamais de commit sur `main`.
- Conventional Commits ; chaque message finit par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Migration créée avec `cd backend && make migrate-create name=queue_version` → `backend/migrations/024_queue_version.sql`.
- Ne jamais éditer `backend/src/shared/types/supabase.generated.ts` à la main : `make generate-types`.
- Imports backend via `@/features/...` avec extension `.js`. Pas de barrel `index.ts`. Pas de `any`.
- Une réponse backend modifiée est reflétée dans `mobile/src/types/`.
- Le mobile garde son comportement actuel en dehors du filtrage : un `queue:updated` ne touche jamais l'audio.

## Review Focus

1. Une synchro playlist → queue (#278) qui ne change rien ne doit pas augmenter la version (tests « leaves … alone » de `queue-sync.int.test.ts`, pin ajouté en Task 1).
2. Une mutation refusée (`QUEUE_END`, 404, 409) ne change pas la version (pin en Task 1).
3. Un utilisateur sans queue reçoit `version: 0`, et le store vide (`version: null`) l'accepte ; le premier ajout donne 1 (pins en Task 1 et Task 2).
4. L'écho socket de sa propre réponse HTTP (même version) est ignoré sans réécrire le store (pin en Task 2).
5. Une réponse de suivant / précédent périmée joue quand même l'item demandé par cet appareil, mais le store reste sur l'état plus récent (pin en Task 2).

---

### Task 1: Version côté backend

**Files:**
- Create: `backend/migrations/024_queue_version.sql`
- Modify (généré): `backend/src/shared/types/supabase.generated.ts`
- Modify: `backend/src/features/queue/queue.types.ts` (`QueueState`)
- Modify: `backend/src/features/queue/utils/queue-rpc.ts:10-29` (schéma Zod)
- Modify: `backend/src/features/queue/services/queue.service.ts:64-73` (log)
- Modify: `backend/src/features/queue/queue.openapi.ts:284-293` (schéma `QueueState`, et l'exemple `{ currentItemId: null, items: [] }` ligne 68)
- Test: `backend/src/features/queue/services/queue.service.int.test.ts`, `backend/src/features/queue/services/queue-sync.int.test.ts`

**Interfaces:**
- Produces: `QueueState = { ownerId: string; version: number; currentItemId: string | null; items: QueueItem[] }`, renvoyé par tous les endpoints queue et par `queue:updated`.

- [ ] **Step 1: Créer la branche et le fichier de migration**

La branche `272-connect-spec` (créée depuis `develop`, avec la spec et ce plan) est renommée : la PR de #285 embarque la spec.

```bash
git branch -m 272-connect-spec 285-queue-version
cd backend && make migrate-create name=queue_version
```

Expected: `backend/migrations/024_queue_version.sql` créé.

- [ ] **Step 2: Écrire les tests d'intégration qui échouent**

Dans `queue.service.int.test.ts`, corriger les états littéraux et ajouter un `describe` :

```ts
// ligne 43, dans addItems
let state: QueueState = { ownerId: user, version: 0, currentItemId: null, items: [] };

// ligne 97
expect(await queue.getQueue(userId)).toEqual({
	ownerId: userId,
	version: 0,
	currentItemId: null,
	items: [],
});

// ligne 179
expect(await queue.removeItem(userId, c)).toMatchObject({ currentItemId: null, items: [] });
```

```ts
describe('version', () => {
	it('starts at 0 without a queue and grows by one with each add', async () => {
		expect((await queue.getQueue(userId)).version).toBe(0);
		expect((await queue.addItem(userId, dto())).version).toBe(1);
		expect((await queue.addItem(userId, dto())).version).toBe(2);
	});

	it('grows with every mutation', async () => {
		const [a, b, c] = await addItems(3);
		let version = (await queue.getQueue(userId)).version;
		const steps: Array<() => Promise<QueueState>> = [
			() => queue.playItem(userId, a),
			() => queue.step(userId, 'next'),
			() => queue.step(userId, 'previous'),
			() => queue.moveItem(userId, c, null),
			() => queue.removeItem(userId, b),
		];
		for (const step of steps) {
			const next = (await step()).version;
			expect(next).toBeGreaterThan(version);
			version = next;
		}
	});

	it('keeps the version when a mutation is refused', async () => {
		await addItems(1);
		const before = await queue.getQueue(userId);
		await expect(queue.step(userId, 'previous')).rejects.toMatchObject({ code: 'QUEUE_START' });
		await expect(queue.removeItem(userId, randomUUID())).rejects.toMatchObject({ statusCode: 404 });
		expect(await queue.getQueue(userId)).toEqual(before);
	});

	it('gives each of two concurrent adds its own version', async () => {
		const [first, second] = await Promise.all([
			queue.addItem(userId, dto()),
			queue.addItem(userId, dto()),
		]);
		expect(new Set([first.version, second.version]).size).toBe(2);
		const last = first.version > second.version ? first : second;
		expect(last.items).toHaveLength(2);
	});

	it('carries the owner id', async () => {
		expect((await queue.addItem(userId, dto())).ownerId).toBe(userId);
	});
});
```

Dans `queue-sync.int.test.ts`, les tests « leaves a finished block alone » (lignes 172-195) comparent déjà `getQueue` avant et après avec `toEqual` : avec `version` dans l'état, ils vérifient désormais aussi qu'une synchro sans effet ne change pas la version. Ajouter dans le `describe('add')` :

```ts
it('bumps the version of a queue it changes', async () => {
	const playlist = await createPlaylist(2);
	await queue.playPlaylist(userId, playlist.id);
	const before = await queue.getQueue(userId);

	await addTrack(playlist.id);

	expect((await queue.getQueue(userId)).version).toBeGreaterThan(before.version);
});
```

- [ ] **Step 3: Vérifier que les tests échouent**

Run: `make supabase-up` (racine), puis `cd backend && npx vitest run --config vitest.int.config.ts src/features/queue`
Expected: FAIL, `version` et `ownerId` sont absents (le schéma Zod les retire, ou `toEqual` voit une différence).

- [ ] **Step 4: Écrire la migration**

`backend/migrations/024_queue_version.sql` :

```sql
-- =====================================================
-- 024: queue_version
-- Versions the play queue so clients can drop stale states (#285). Every
-- write that changes a queue updates its play_queues row under queue_lock
-- (updated_at or current_item_id), so a BEFORE UPDATE trigger counts them.
-- A playlist sync that changes nothing leaves the row, and the version, alone.
-- updated_at cannot serve: now() is the transaction start, not its commit.
-- =====================================================

ALTER TABLE public.play_queues ADD COLUMN version bigint NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.play_queues.version IS 'Incremented by every write that changes the queue';

CREATE OR REPLACE FUNCTION public.queue_bump_version()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.version := OLD.version + 1;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bump_play_queues_version
  BEFORE UPDATE ON public.play_queues
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_bump_version();

REVOKE EXECUTE ON FUNCTION public.queue_bump_version() FROM PUBLIC, anon, authenticated;

-- The full queue: { ownerId, version, currentItemId, items }, items in rank
-- order. A user who never queued anything has no row: version 0.
CREATE OR REPLACE FUNCTION public.queue_state(p_user uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'ownerId', p_user,
    'version', coalesce((SELECT version FROM public.play_queues WHERE user_id = p_user), 0),
    'currentItemId', (SELECT current_item_id FROM public.play_queues WHERE user_id = p_user),
    'items', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', i.id,
        'rank', i.rank,
        'track', jsonb_build_object(
          'trackUri', t.track_uri,
          'title', t.title,
          'artist', t.artist,
          'album', t.album,
          'albumArt', t.album_art,
          'durationMs', t.duration_ms
        ),
        'sourcePlaylistId', i.source_playlist_id,
        'blockId', i.block_id,
        'blockDetached', i.block_detached
      ) ORDER BY i.rank)
      FROM public.play_queue_items i
      JOIN public.tracks t ON t.id = i.track_id
      WHERE i.user_id = p_user
    ), '[]'::jsonb)
  );
$$;
```

Appliquer puis régénérer les types :

```bash
make supabase-up
make generate-types
```

Expected: `play_queues.Row` gagne `version: number` dans `supabase.generated.ts`.

- [ ] **Step 5: Types, Zod, log et OpenAPI**

`queue.types.ts`, dans `QueueState` :

```ts
export interface QueueState {
	/** The user whose queue this is. */
	ownerId: string;
	/** Grows with every change of the queue; a client drops a state not newer than its own (#285). */
	version: number;
	currentItemId: string | null;
	items: QueueItem[];
}
```

`queue-rpc.ts`, au début de `queueStateSchema` :

```ts
const queueStateSchema: z.ZodType<QueueState> = z.object({
	ownerId: z.uuid(),
	version: z.number().int().nonnegative(),
	currentItemId: z.uuid().nullable(),
	// … items inchangé
```

`queue.service.ts`, dans `publish`, ajouter `version: state.version,` au log `Queue updated`.

`queue.openapi.ts`, schéma `QueueState` :

```ts
QueueState: {
	type: 'object',
	required: ['ownerId', 'version', 'currentItemId', 'items'],
	description:
		'Items in rank order. Items before the current one are history, those after it upcoming; with `currentItemId` null every item is upcoming. `version` grows with every change: a client drops a state whose version is not above the one it holds. Also the payload of the `queue:updated` socket event.',
	properties: {
		ownerId: { type: 'string', format: 'uuid' },
		version: { type: 'integer', minimum: 0, example: 12 },
		currentItemId: { type: 'string', format: 'uuid', nullable: true },
		items: { type: 'array', items: { $ref: '#/components/schemas/QueueItem' } },
	},
},
```

et la description ligne 68 : ``'Returns `{ ownerId, version: 0, currentItemId: null, items: [] }` when you never queued anything.'``

- [ ] **Step 6: Vérifier que les tests passent**

Run: `cd backend && npx vitest run --config vitest.int.config.ts src/features/queue src/realtime/queue-updated.int.test.ts && npm test && npm run type-check && npm run lint`
Expected: PASS partout.

- [ ] **Step 7: Commit**

```bash
git add backend/migrations/024_queue_version.sql backend/src/shared/types/supabase.generated.ts backend/src/features/queue
git commit -m "feat(backend): version the play queue state

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Le mobile ignore les états périmés

**Files:**
- Modify: `mobile/src/types/queue.types.ts` (`QueueState`)
- Modify: `mobile/src/store/queueStore.ts` (état `version`, `applyState`, `initialState`)
- Test: `mobile/src/store/queueStore.test.ts`, `mobile/src/components/player/QueueModal.test.tsx`, `mobile/src/components/playlist/PlayPlaylistButton.test.tsx`

**Interfaces:**
- Consumes: `QueueState` de Task 1 (`ownerId`, `version`).
- Produces: `useQueueStore` expose `version: number | null` (`null` avant le premier état et après `reset`) ; `applyState(state)` ne fait rien si `version !== null && state.version <= version`.

- [ ] **Step 1: Type mobile**

`mobile/src/types/queue.types.ts`, même champs que le backend :

```ts
export interface QueueState {
	/** The user whose queue this is. */
	ownerId: string;
	/** Grows with every change of the queue; the store drops a state not newer than its own (#285). */
	version: number;
	currentItemId: string | null;
	items: QueueItem[];
}
```

- [ ] **Step 2: Mettre à jour les fixtures des tests**

`queueStore.test.ts` : une version croissante par état construit, pour que les tests existants, qui appliquent leurs états dans l'ordre où ils les construisent, restent valides :

```ts
let nextVersion = 0;

const queue = (currentItemId: string | null, ids = ['a', 'b', 'c']): QueueState => ({
	ownerId: 'owner',
	version: ++nextVersion,
	currentItemId,
	items: ids.map(item),
});
```

Même ajout (`ownerId: 'owner', version: ++nextVersion,`) dans `withBlock` (ligne 451).

`QueueModal.test.tsx` : `setQueue` reçoit un état sans version et en donne une croissante.

```ts
let nextVersion = 0;
const setQueue = (state: Pick<QueueState, 'currentItemId' | 'items'>) =>
	useQueueStore.getState().applyState({ ownerId: 'owner', version: ++nextVersion, ...state });
```

`PlayPlaylistButton.test.tsx:55` utilise `setState` partiel : rien à changer.

Run: `cd mobile && npx jest src/store/queueStore.test.ts src/components/player src/components/playlist`
Expected: PASS (le store n'a pas encore de garde). Si un test existant construit un état avant un autre mais l'applique après, réordonner ses constructions pour qu'elles suivent l'ordre d'application.

- [ ] **Step 3: Écrire les tests qui échouent**

Dans `queueStore.test.ts`, ajouter :

```ts
const deferred = <T,>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>(r => {
		resolve = r;
	});
	return { promise, resolve };
};

describe('queueStore versions (#285)', () => {
	it('accepts version 0 into an empty store', () => {
		store().applyState({ ownerId: 'owner', version: 0, currentItemId: null, items: [] });
		expect(store().loaded).toBe(true);
		expect(store().version).toBe(0);
	});

	it('ignores a socket state older than the one it holds', () => {
		const older = queue('a');
		const newer = queue('b');
		store().applyState(newer);
		store().applyState(older);
		expect(store().currentItemId).toBe('b');
		expect(store().version).toBe(newer.version);
	});

	it('ignores the echo of a state it already holds', () => {
		const state = queue('a');
		store().applyState(state);
		const items = store().items;
		store().applyState({ ...state, items: [] });
		expect(store().items).toBe(items);
	});

	it('ignores a load answer older than a queue:updated received meanwhile', async () => {
		const answer = deferred<QueueState>();
		api.getQueue.mockReturnValueOnce(answer.promise);
		const stale = queue('a');
		const fresh = queue('b');
		const loading = store().load();
		store().applyState(fresh);
		answer.resolve(stale);
		await loading;
		expect(store().currentItemId).toBe('b');
	});

	it('ends on the state holding both of two adds whose answers arrive in reverse', async () => {
		const first = deferred<QueueState>();
		const second = deferred<QueueState>();
		api.addItem.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
		const withA = queue(null, ['a']);
		const withAB = queue(null, ['a', 'b']);
		const addA = store().addItem(body('a'));
		const addB = store().addItem(body('b'));
		second.resolve(withAB);
		await addB;
		first.resolve(withA);
		await addA;
		expect(store().items.map(i => i.id)).toEqual(['a', 'b']);
	});

	it('plays the item of a stale step answer but keeps the newer state', async () => {
		const answer = deferred<QueueStepResult>();
		api.next.mockReturnValueOnce(answer.promise);
		const stepped = queue('b');
		const newer = queue('c');
		const stepping = store().next();
		store().applyState(newer);
		answer.resolve({ ok: true, state: stepped });
		await stepping;
		expect(store().currentItemId).toBe('c');
		expect(player().queueItemId).toBe('b');
	});

	it('reset forgets the version', () => {
		store().applyState(queue('a'));
		store().reset();
		expect(store().version).toBeNull();
		store().applyState({ ownerId: 'owner', version: 0, currentItemId: null, items: [] });
		expect(store().loaded).toBe(true);
	});
});
```

Ajouter `QueueStepResult` à l'import de `@/types/queue.types`, et ce helper près de `item` (`AddQueueItemBody` n'accepte pas `album: null`) :

```ts
const body = (id: string) => {
	const { trackUri, title, artist, durationMs } = item(id).track;
	return { trackUri, title, artist, durationMs };
};
```

- [ ] **Step 4: Vérifier que les tests échouent**

Run: `cd mobile && npx jest src/store/queueStore.test.ts -t "versions"`
Expected: FAIL, `store().version` est `undefined` et l'état ancien remplace le récent.

- [ ] **Step 5: Implémenter la garde**

`queueStore.ts` :

```ts
interface QueueStoreState extends Omit<QueueState, 'ownerId' | 'version'> {
	/** Version of the state held; null before the first one and after reset. */
	version: number | null;
	/** True once the server queue was read at least once. */
	loaded: boolean;
	// … reste inchangé
```

```ts
const initialState: Omit<QueueState, 'ownerId' | 'version'> & {
	version: number | null;
	loaded: boolean;
} = {
	currentItemId: null,
	items: [],
	version: null,
	loaded: false,
};
```

```ts
		applyState: state => {
			// Answers and queue:updated events can arrive out of commit order (#285).
			const { version } = get();
			if (version !== null && state.version <= version) return;
			set({
				currentItemId: state.currentItemId,
				items: state.items,
				version: state.version,
				loaded: true,
			});
		},
```

Mettre à jour la doc du store (bloc au-dessus de `useQueueStore`) : « `queue:updated` and every action replace it whole, unless they carry a version not above the one held (#285). »

`selectHasNext`, `selectHasPrevious` et `selectPlaysPlaylist` prennent un `QueueState` : changer leur paramètre en `Pick<QueueState, 'currentItemId' | 'items'>` (et `currentIndex`, `currentItem` de même) pour qu'ils acceptent l'état du store.

- [ ] **Step 6: Vérifier que les tests passent**

Run: `cd mobile && npm test && npm run type-check && npm run lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add mobile/src/types/queue.types.ts mobile/src/store/queueStore.ts mobile/src/store/queueStore.test.ts mobile/src/components/player/QueueModal.test.tsx
git commit -m "feat(mobile): drop queue states older than the one shown

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Vérification et PR

- [ ] **Step 1: Suite complète**

Run: `make test`, puis `cd backend && npm run test:int`
Expected: PASS.

- [ ] **Step 2: Swagger**

Avec `make dev-docker`, appeler `GET /api/queue` puis `POST /api/queue/items` dans Swagger UI (http://localhost:3000/api-docs) : la réponse porte `ownerId` et une `version` qui passe de n à n+1.

- [ ] **Step 3: PR**

```bash
git push -u origin 285-queue-version
gh pr create --base develop --assignee @me --title "feat: version the play queue state (#285)" --body "$(cat <<'EOF'
Closes #285

- `play_queues.version`, bumped by a BEFORE UPDATE trigger: every write that changes a queue updates its row under `queue_lock`, a no-op playlist sync does not.
- `QueueState` carries `ownerId` and `version` (backend, OpenAPI, mobile types).
- `queueStore.applyState` drops a state whose version is not above the one held: late HTTP answers, out-of-order `queue:updated`, a reconnect load overtaken by an event.

Spec: `docs/superpowers/specs/2026-10-14-queue-delegation-connect-design.md` (ticket 1 of 6).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Quand la CI est verte, merger dans `develop`.

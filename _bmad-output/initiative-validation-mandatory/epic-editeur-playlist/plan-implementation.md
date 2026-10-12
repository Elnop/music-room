# Concurrence des playlists — plan d'implémentation

> **Pour les agents :** sous-skill requis : `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans`, tâche par tâche. Les étapes utilisent des cases `- [ ]`.

**But :** add, remove et move de tracks restent cohérents quand plusieurs personnes modifient la même playlist (sujet IV.2.3, CAP-5).

**Architecture :** l'ordre des tracks est une clé texte fractionnaire (`playlist_tracks.rank`, `COLLATE "C"`) générée en SQL. Chaque opération est une fonction Postgres appelée en RPC, qui verrouille la ligne `playlists` (`FOR UPDATE`) puis incrémente `playlists.tracks_version`. Un move envoie `afterRank` et `expectedVersion`, et n'est refusé que si la même track a bougé depuis cette version. Le backend diffuse chaque opération avec sa version ; les clients appliquent les événements dans l'ordre des versions et rechargent s'ils en manquent un.

**Stack :** Express/TypeScript, supabase-js (PostgREST), Postgres (plpgsql), Socket.io, Zod, Vitest (unitaire + intégration sur la stack Supabase locale), Expo React Native, Zustand, jest-expo.

**Spec :** `doc/PLAYLIST_CONCURRENCY.md` (PR #132). Tickets : #87 → #91, epic #85.

## Contraintes globales

- `doc/en.subject.pdf` v5.3 prime sur tout autre document.
- Une branche par issue, nommée `<numéro>-<slug>`, PR vers `develop`, Conventional Commits ; jamais de commit sur `main`.
- Imports backend via `@/features/...` ou `@/shared/...`, toujours avec l'extension `.js`. Pas de barrel `index.ts`.
- Toute entrée de requête validée par un schéma Zod ; pas de `any`.
- Un nouvel endpoint sans son entrée OpenAPI dans `playlist.openapi.ts` n'est pas fini.
- Un service backend reste sous ~150 lignes ; on le découpe plutôt que de le faire grossir.
- Tout changement de forme de réponse backend est répercuté dans `mobile/src/types/`.
- Les appels HTTP mobiles passent par `mobile/src/services/api.ts` (en-têtes `X-Platform`, `X-Device-Model`, `X-App-Version`) ; jamais de `fetch` direct pour un nouvel appel.
- Ne jamais éditer `backend/src/shared/types/supabase.generated.ts` à la main : `make generate-types`.
- Les migrations s'appliquent à la main dans le dashboard Supabase ; `make test-int` les applique à la stack locale.
- Une librairie ne doit pas faire le travail demandé : la génération des rangs est du code du projet.

## Points de vigilance

Cas que la spec implique et qu'un utilisateur rencontrera ; chacun est épinglé par un test dans la tâche indiquée.

1. **Rééquilibrage pendant qu'un client a de vieux rangs en mémoire** : son prochain move doit être refusé (`409 PLAYLIST_REBALANCED`) et non placé n'importe où. Test en tâche 4.
2. **Deux moves rapides du même utilisateur** : le second part avec la version renvoyée par le premier, pas de 409 contre soi-même. Test en tâche 7.
3. **Déplacer en tête (`afterRank = null`) et en queue (`afterRank` = dernier rang)** : la track arrive bien au bord. Test en tâche 4.
4. **Retrait concurrent d'un move de la même track** : le move reçoit `409 TRACK_NOT_IN_PLAYLIST` et la track ne réapparaît pas. Test en tâche 4.
5. **Appel direct des fonctions RPC avec la clé anon** (elles sont exposées par PostgREST) : refusé. Test en tâche 4.

## Écart avec la spec, à valider

Le rééquilibrage (spec, section « Order ») change les rangs de toute la playlist. Un client qui a gardé les anciens rangs enverrait un `afterRank` qui ne correspond plus à rien. Le plan ajoute :

- `playlists.ranks_rebalanced_at_version` (bigint), mis à jour par le rééquilibrage ;
- un refus `409 PLAYLIST_REBALANCED` quand `expectedVersion < ranks_rebalanced_at_version` ;
- `rebalanced: true` dans la diffusion, qui fait recharger les clients.

La tâche 9 reporte ces trois points dans `doc/PLAYLIST_CONCURRENCY.md`.

## Carte des fichiers

| Fichier | Rôle | Tâches |
|---|---|---|
| `backend/migrations/016_playlist_track_ranks.sql` | rangs, versions, fonctions RPC, droits | 3, 4 |
| `backend/src/features/playlists/playlist.validators.ts` | `rankSchema`, `moveTrackSchema` | 1 |
| `backend/src/features/playlists/playlist.validators.test.ts` | tests des schémas | 1 |
| `backend/src/features/playlists/playlist.types.ts` | DTO et réponses (`TrackInPlaylistResponse`, résultats d'opération) | 1, 5 |
| `backend/src/features/playlists/playlist.openapi.ts` | contrat HTTP | 1, 5 |
| `backend/src/features/playlists/services/track-ranks.int.test.ts` | tests SQL des rangs | 3 |
| `backend/src/features/playlists/services/track-operations.int.test.ts` | tests de concurrence | 4 |
| `backend/src/features/playlists/utils/track-rpc.ts` | appel des RPC, parsing Zod, erreurs → `AppError` | 5 |
| `backend/src/features/playlists/utils/track-rpc.test.ts` | tests unitaires du mapping | 5 |
| `backend/src/features/playlists/services/playlist-track.service.ts` | add, remove, move | 5 |
| `backend/src/features/playlists/playlist.service.ts` | lecture ordonnée par `rank`, `tracksVersion` | 5 |
| `backend/src/features/playlists/utils/playlist.helpers.ts` | suppression de `reindexPositions` | 5 |
| `backend/src/features/playlists/playlist.controller.ts`, `playlist.routes.ts` | endpoint move, réponses | 5 |
| `backend/src/realtime/index.ts` | payload `playlist:updated` versionné | 6 |
| `backend/src/realtime/playlist-updated.int.test.ts` | deux clients reçoivent le même événement | 6 |
| `mobile/src/types/track.types.ts`, `playlist.types.ts` | miroir des types | 2 |
| `mobile/src/services/api.ts` | export de `apiRequest` | 7 |
| `mobile/src/api/playlistApi.ts` | add, remove, move via `apiRequest` | 7 |
| `mobile/src/store/playlistSync.ts` | fonctions pures : tri, application d'un événement | 7 |
| `mobile/src/store/playlistSync.test.ts` | tests | 7 |
| `mobile/src/store/playlistStore.ts` | `moveTrack` en file, versions, 409 | 7 |
| `mobile/src/store/playlistStore.test.ts` | tests | 7 |
| `mobile/src/hooks/usePlaylistSocket.ts` | passe les événements au store | 7 |
| `mobile/src/components/common/SwipeableTrackItem.tsx` | boutons monter / descendre | 8 |
| `mobile/src/screens/playlists/PlaylistDetailScreen.tsx` | calcul de `afterRank` | 8 |
| `doc/PLAYLIST_CONCURRENCY.md` | rééquilibrage côté client, payload final | 9 |

## Ordre et dépendances

```
Tâche 1 (#87 back) ─┐
Tâche 2 (#87 mobile)│
Tâche 3 (#88 rangs) ─→ Tâche 4 (#88 opérations) ─→ Tâche 5 (#89) ─→ Tâche 6 (#90) ─→ Tâche 7 (#91) ─→ Tâche 8 (#91 UI) ─→ Tâche 9
```

Les tâches 1, 2 et 3 peuvent partir en parallèle. La migration 016 passe après la 015 de #78 (Decision de l'epic) : si la 015 n'est pas encore mergée, on garde le numéro 016 et on applique la 015 d'abord.

---

### Tâche 1 : contrat backend (#87)

**Fichiers :**
- Modifier : `backend/src/features/playlists/playlist.validators.ts`
- Modifier : `backend/src/features/playlists/playlist.types.ts`
- Modifier : `backend/src/features/playlists/playlist.openapi.ts`
- Créer : `backend/src/features/playlists/playlist.validators.test.ts`

**Interfaces :**
- Produit : `rankSchema`, `moveTrackSchema`, `MoveTrackInput` ; les types `TrackInPlaylistResponse`, `AddTrackResult`, `RemoveTrackResult`, `MoveTrackResult`, `PlaylistUpdatedPayload` ; `PlaylistWithTracksResponse.tracksVersion`.
- Les anciens types (`TrackWithPositionResponse`, `ReorderTracksDTO`, `reorderTracksSchema`) restent jusqu'à la tâche 5 pour que le code compile.

- [ ] **Étape 1 : écrire le test qui échoue**

`backend/src/features/playlists/playlist.validators.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { moveTrackSchema, rankSchema } from '@/features/playlists/playlist.validators.js';

describe('rankSchema', () => {
	it.each(['V', 'a1', 'zz1', '0V'])('accepts %s', rank => {
		expect(rankSchema.safeParse(rank).success).toBe(true);
	});

	it.each(['', 'V0', 'a-b', 'é', 'x'.repeat(129)])('rejects %s', rank => {
		expect(rankSchema.safeParse(rank).success).toBe(false);
	});
});

describe('moveTrackSchema', () => {
	it('accepts a move to the top', () => {
		expect(moveTrackSchema.parse({ afterRank: null, expectedVersion: 0 })).toEqual({
			afterRank: null,
			expectedVersion: 0,
		});
	});

	it('requires expectedVersion', () => {
		expect(moveTrackSchema.safeParse({ afterRank: 'V' }).success).toBe(false);
	});

	it('rejects a negative or fractional version', () => {
		expect(moveTrackSchema.safeParse({ afterRank: 'V', expectedVersion: -1 }).success).toBe(false);
		expect(moveTrackSchema.safeParse({ afterRank: 'V', expectedVersion: 1.5 }).success).toBe(false);
	});
});
```

- [ ] **Étape 2 : vérifier qu'il échoue**

Lancer : `cd backend && npx vitest run src/features/playlists/playlist.validators.test.ts`
Attendu : échec, `rankSchema` n'est pas exporté.

- [ ] **Étape 3 : ajouter les schémas**

Dans `playlist.validators.ts`, après `reorderTracksSchema` :

```ts
// A rank is a base-62 fraction that never ends with '0' (doc/PLAYLIST_CONCURRENCY.md).
export const rankSchema = z
	.string()
	.max(128)
	.regex(/^[0-9A-Za-z]*[1-9A-Za-z]$/, 'Invalid rank');

export const moveTrackSchema = z.object({
	afterRank: rankSchema.nullable(),
	expectedVersion: z.number().int().nonnegative(),
});
```

et avec les autres types inférés :

```ts
export type MoveTrackInput = z.infer<typeof moveTrackSchema>;
```

- [ ] **Étape 4 : vérifier que le test passe**

Lancer : `cd backend && npx vitest run src/features/playlists/playlist.validators.test.ts`
Attendu : PASS.

- [ ] **Étape 5 : ajouter les types de réponse**

Dans `playlist.types.ts`, après `TrackWithPositionResponse` :

```ts
export interface TrackInPlaylistResponse extends TrackResponse {
	rank: string;
	addedBy: string | null;
	addedAt: string;
}

export interface AddTrackResult {
	track: TrackInPlaylistResponse;
	tracksVersion: number;
	rebalanced: boolean;
}

export interface RemoveTrackResult {
	tracksVersion: number;
}

export interface MoveTrackResult {
	trackId: string;
	rank: string;
	tracksVersion: number;
	rebalanced: boolean;
}

interface PlaylistUpdateBase {
	playlistId: string;
	tracksVersion: number;
	/** Every rank of the playlist changed: clients reload it. */
	rebalanced: boolean;
}

export type PlaylistUpdatedPayload = PlaylistUpdateBase &
	(
		| { event: 'track_added'; track: TrackInPlaylistResponse }
		| { event: 'track_removed'; trackId: string }
		| { event: 'track_moved'; trackId: string; rank: string }
	);
```

et dans `PlaylistWithTracksResponse`, ajouter `tracksVersion: number;`. Le temps de la tâche 5, renseigner `tracksVersion: 0` là où `getPlaylistById` construit la réponse, pour que `npm run type-check` passe.

- [ ] **Étape 6 : documenter le contrat dans OpenAPI**

Dans `playlistSchemas` (`playlist.openapi.ts`), ajouter :

```ts
	MoveTrackRequest: {
		type: 'object',
		required: ['afterRank', 'expectedVersion'],
		properties: {
			afterRank: {
				type: 'string',
				nullable: true,
				pattern: '^[0-9A-Za-z]*[1-9A-Za-z]$',
				maxLength: 128,
				description:
					'Rank of the track the moved track is dropped after, as the client displayed it; null for the top of the list.',
				example: 'h',
			},
			expectedVersion: {
				type: 'integer',
				minimum: 0,
				description: 'tracksVersion the client was displaying when the user moved the track.',
				example: 10,
			},
		},
	},

	AddTrackResult: {
		type: 'object',
		properties: {
			track: { $ref: '#/components/schemas/PlaylistTrack' },
			tracksVersion: { type: 'integer', example: 11 },
			rebalanced: { type: 'boolean', description: 'Every rank of the playlist changed' },
		},
	},

	RemoveTrackResult: {
		type: 'object',
		properties: { tracksVersion: { type: 'integer', example: 12 } },
	},

	MoveTrackResult: {
		type: 'object',
		properties: {
			trackId: { type: 'string', format: 'uuid' },
			rank: { type: 'string', example: 'l' },
			tracksVersion: { type: 'integer', example: 11 },
			rebalanced: { type: 'boolean', description: 'Every rank of the playlist changed' },
		},
	},
```

Dans `PlaylistTrack`, ajouter à côté de `position` (supprimé en tâche 5) :

```ts
			rank: {
				type: 'string',
				description: 'Sort key: tracks are ordered by rank, compared byte by byte',
				example: 'h',
			},
			addedAt: { type: 'string', format: 'date-time' },
```

Dans `PlaylistDetail.properties`, ajouter :

```ts
			tracksVersion: {
				type: 'integer',
				description: 'Incremented by every add, remove and move; sent back as expectedVersion',
				example: 10,
			},
```

Dans `playlistPaths`, ajouter après `'/api/playlists/{id}/tracks/{trackId}'` :

```ts
	'/api/playlists/{id}/tracks/{trackId}/move': {
		post: {
			tags: ['Tracks'],
			summary: 'Move a track',
			description:
				'Places the track right after afterRank. Refused with 409 only when this same track moved or was removed since expectedVersion, or when the playlist ranks were rebalanced since then. See doc/PLAYLIST_CONCURRENCY.md.',
			operationId: 'moveTrack',
			security: [{ bearerAuth: [] }],
			parameters: [
				{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Playlist ID' },
				{ in: 'path', name: 'trackId', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Track ID to move' },
			],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/MoveTrackRequest' },
						example: { afterRank: 'h', expectedVersion: 10 },
					},
				},
			},
			responses: {
				'200': {
					description: 'Track moved',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{ type: 'object', properties: { data: { $ref: '#/components/schemas/MoveTrackResult' } } },
								],
							},
						},
					},
				},
				'400': { $ref: '#/components/responses/ValidationError' },
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'403': { $ref: '#/components/responses/ForbiddenError' },
				'404': { $ref: '#/components/responses/NotFoundError' },
				'409': {
					description:
						'TRACK_MOVED_CONCURRENTLY: the track moved since expectedVersion. TRACK_NOT_IN_PLAYLIST: it was removed. PLAYLIST_REBALANCED: every rank changed. The client reloads the playlist.',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
							example: {
								success: false,
								error: { code: 'TRACK_MOVED_CONCURRENTLY', message: 'Track was moved by someone else' },
							},
						},
					},
				},
			},
		},
	},
```

Dans la réponse `201` de `POST /api/playlists/{id}/tracks`, remplacer `data: { $ref: '#/components/schemas/PlaylistTrack' }` par `data: { $ref: '#/components/schemas/AddTrackResult' }` et ajouter :

```ts
				'409': {
					description: 'TRACK_DUPLICATE: the track is already in the playlist',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
							example: { success: false, error: { code: 'TRACK_DUPLICATE', message: 'Track already in playlist' } },
						},
					},
				},
```

Dans la réponse `200` de `DELETE /api/playlists/{id}/tracks/{trackId}`, remplacer l'objet `data` par `data: { $ref: '#/components/schemas/RemoveTrackResult' }`.

- [ ] **Étape 7 : vérifier**

Lancer : `cd backend && npm run type-check && npm run lint && npm test`
Attendu : tout vert. Puis `make dev-docker` et ouvrir http://localhost:3000/api-docs : `moveTrack` et les nouveaux schémas s'affichent.

- [ ] **Étape 8 : commit**

```bash
git add backend/src/features/playlists/playlist.validators.ts backend/src/features/playlists/playlist.validators.test.ts backend/src/features/playlists/playlist.types.ts backend/src/features/playlists/playlist.openapi.ts
git commit -m "feat(playlists): define the concurrent track edit contract"
```

---

### Tâche 2 : contrat mobile (#87)

**Fichiers :**
- Modifier : `mobile/src/types/track.types.ts`
- Modifier : `mobile/src/types/playlist.types.ts`

**Interfaces :**
- Consomme : les formes de la tâche 1.
- Produit : `TrackInPlaylist`, `AddTrackResult`, `RemoveTrackResult`, `MoveTrackResult`, `PlaylistUpdatedEvent`, `PlaylistWithTracks.tracksVersion`. `TrackWithPosition` reste jusqu'à la tâche 7.

- [ ] **Étape 1 : ajouter les types**

Dans `track.types.ts`, après `TrackWithPosition` :

```ts
export interface TrackInPlaylist extends Track {
	/** Sort key: compare with < on strings (byte order, same as the server's COLLATE "C"). */
	rank: string;
	addedBy: string | null;
	addedAt: string;
}
```

Dans `playlist.types.ts` (importer `TrackInPlaylist` depuis `@/types/track.types`) :

```ts
export interface AddTrackResult {
	track: TrackInPlaylist;
	tracksVersion: number;
	rebalanced: boolean;
}

export interface RemoveTrackResult {
	tracksVersion: number;
}

export interface MoveTrackResult {
	trackId: string;
	rank: string;
	tracksVersion: number;
	rebalanced: boolean;
}

interface PlaylistUpdateBase {
	playlistId: string;
	tracksVersion: number;
	rebalanced: boolean;
}

export type PlaylistUpdatedEvent = PlaylistUpdateBase &
	(
		| { event: 'track_added'; track: TrackInPlaylist }
		| { event: 'track_removed'; trackId: string }
		| { event: 'track_moved'; trackId: string; rank: string }
	);
```

et `tracksVersion: number;` dans `PlaylistWithTracks`.

- [ ] **Étape 2 : vérifier**

Lancer : `cd mobile && npm run type-check && npm run lint`
Attendu : vert. Si un objet `PlaylistWithTracks` construit à la main (tests, mocks) casse, lui ajouter `tracksVersion: 0`.

- [ ] **Étape 3 : commit**

```bash
git add mobile/src/types/track.types.ts mobile/src/types/playlist.types.ts
git commit -m "feat(mobile): mirror the concurrent track edit contract"
```

---

### Tâche 3 : fonctions de rang (#88)

**Fichiers :**
- Créer : `backend/migrations/016_playlist_track_ranks.sql` (première partie)
- Créer : `backend/src/features/playlists/services/track-ranks.int.test.ts`

**Interfaces :**
- Produit (SQL, schéma `public`) :
  - `rank_between(p_a text, p_b text) → text` : une clé strictement entre `p_a` et `p_b` ; `NULL` = début ou fin ; erreur si `p_a >= p_b`.
  - `rank_after(p_a text) → text` : une clé après `p_a`, qui s'allonge lentement (pour les ajouts en fin) ; `NULL` → `'V'`.
  - `rank_spaced(p_index bigint, p_count bigint) → text` : la `p_index`-ième de `p_count` clés également espacées (1 ≤ index ≤ count).
- Les trois fonctions sont `IMMUTABLE` et réservées au rôle `service_role`.

Le numéro 016 est écrit à la main : `make migrate-create` produit un nom horodaté, alors que les migrations existantes sont numérotées `NNN_`.

- [ ] **Étape 1 : écrire le test qui échoue**

`backend/src/features/playlists/services/track-ranks.int.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';

// SQL rank functions from migration 016, against the local Supabase stack.
// Called by name: the generated types only know these functions after `make generate-types`.
async function call(fn: string, args: Record<string, unknown>): Promise<string> {
	const { data, error } = await supabaseAdmin.rpc(fn as never, args as never);
	if (error) throw new Error(error.message);
	return data as string;
}

const between = (a: string | null, b: string | null) => call('rank_between', { p_a: a, p_b: b });
const after = (a: string | null) => call('rank_after', { p_a: a });
const spaced = (index: number, count: number) => call('rank_spaced', { p_index: index, p_count: count });

const VALID = /^[0-9A-Za-z]*[1-9A-Za-z]$/;
const below = (a: string, b: string) => a < b; // byte order, as COLLATE "C"

describe('rank_between (migration 016)', () => {
	it.each([
		[null, null],
		[null, 'V'],
		['V', null],
		['h', 'p'],
		['V', 'W'],
		['V', 'V1'],
		['z', null],
		['0V', '1'],
	])('returns a valid key strictly between %s and %s', async (a, b) => {
		const key = await between(a, b);
		expect(key).toMatch(VALID);
		if (a !== null) expect(below(a, key)).toBe(true);
		if (b !== null) expect(below(key, b)).toBe(true);
	});

	it('refuses bounds in the wrong order', async () => {
		await expect(between('p', 'h')).rejects.toThrow();
		await expect(between('h', 'h')).rejects.toThrow();
	});

	it('keeps keys short when inserting 200 times into the same gap', async () => {
		let low = 'V';
		const high = 'W';
		for (let i = 0; i < 200; i++) {
			const key = await between(low, high);
			expect(below(low, key) && below(key, high)).toBe(true);
			low = key;
		}
		expect(low.length).toBeLessThanOrEqual(40);
	});
});

describe('rank_after (migration 016)', () => {
	it('starts at V and grows by one character per 61 appends', async () => {
		let key = await after(null);
		expect(key).toBe('V');
		for (let i = 0; i < 1000; i++) {
			const next = await after(key);
			expect(next).toMatch(VALID);
			expect(below(key, next)).toBe(true);
			key = next;
		}
		expect(key.length).toBeLessThanOrEqual(20);
	});
});

describe('rank_spaced (migration 016)', () => {
	it('returns increasing distinct keys', async () => {
		for (const count of [1, 2, 61, 62, 500]) {
			let previous = '';
			for (const index of [1, 2, Math.ceil(count / 2), count]) {
				if (index > count) continue;
				const key = await spaced(index, count);
				expect(key).toMatch(VALID);
				if (previous && index > 1) expect(below(previous, key)).toBe(true);
				previous = key;
			}
		}
	});
});
```

- [ ] **Étape 2 : vérifier qu'il échoue**

Lancer : `make test-int`
Attendu : échec, `Could not find the function public.rank_between`.

- [ ] **Étape 3 : écrire les fonctions**

`backend/migrations/016_playlist_track_ranks.sql` :

```sql
-- =====================================================
-- 016: fractional ranks and versions for playlist tracks
-- Design: doc/PLAYLIST_CONCURRENCY.md
-- =====================================================

-- Rank keys are base-62 fractions in (0, 1), written with the digits below in
-- byte order (0-9 < A-Z < a-z), so COLLATE "C" sorts them numerically.
-- A key never ends with '0': then every key has exactly one spelling.

CREATE OR REPLACE FUNCTION public.rank_between(p_a text, p_b text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  digits CONSTANT text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  a text := coalesce(p_a, '');
  b text := p_b;
  prefix text := '';
  n int;
  da int;
  db int;
BEGIN
  IF b IS NOT NULL AND a COLLATE "C" >= b COLLATE "C" THEN
    RAISE EXCEPTION 'rank_between: % is not below %', a, b;
  END IF;

  LOOP
    IF b IS NOT NULL THEN
      -- Skip the common prefix, reading a missing digit of a as '0'.
      n := 0;
      WHILE n < length(b)
        AND coalesce(nullif(substr(a, n + 1, 1), ''), '0') = substr(b, n + 1, 1) LOOP
        n := n + 1;
      END LOOP;
      prefix := prefix || left(b, n);
      a := substr(a, n + 1);
      b := substr(b, n + 1);
    END IF;

    da := CASE WHEN a = '' THEN 0 ELSE strpos(digits, left(a, 1)) - 1 END;
    db := CASE WHEN b IS NULL THEN 62 ELSE strpos(digits, left(b, 1)) - 1 END;

    IF db - da > 1 THEN
      RETURN prefix || substr(digits, (da + db) / 2 + 1, 1);
    END IF;

    -- Consecutive digits: b's first digit alone fits when b has more digits.
    IF b IS NOT NULL AND length(b) > 1 THEN
      RETURN prefix || left(b, 1);
    END IF;

    -- Otherwise keep a's digit and look for room after it.
    prefix := prefix || substr(digits, da + 1, 1);
    a := substr(a, 2);
    b := NULL;
  END LOOP;
END;
$$;

-- Key after p_a for appends: increments the last digit, so keys grow by one
-- character every 61 appends instead of every few.
CREATE OR REPLACE FUNCTION public.rank_after(p_a text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  digits CONSTANT text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  last_digit int;
BEGIN
  IF p_a IS NULL OR p_a = '' THEN
    RETURN 'V';
  END IF;
  last_digit := strpos(digits, right(p_a, 1)) - 1;
  IF last_digit < 61 THEN
    RETURN left(p_a, length(p_a) - 1) || substr(digits, last_digit + 2, 1);
  END IF;
  RETURN p_a || '1';
END;
$$;

-- The p_index-th (1-based) of p_count evenly spaced keys, all of the same
-- width before trailing zeros are dropped.
CREATE OR REPLACE FUNCTION public.rank_spaced(p_index bigint, p_count bigint)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  digits CONSTANT text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  width int := 1;
  value numeric;
  key text := '';
BEGIN
  IF p_index < 1 OR p_index > p_count THEN
    RAISE EXCEPTION 'rank_spaced: index % out of 1..%', p_index, p_count;
  END IF;
  WHILE power(62::numeric, width) < p_count + 1 LOOP
    width := width + 1;
  END LOOP;
  value := floor(p_index * power(62::numeric, width) / (p_count + 1));
  FOR i IN 1..width LOOP
    key := substr(digits, (value % 62)::int + 1, 1) || key;
    value := floor(value / 62);
  END LOOP;
  RETURN rtrim(key, '0');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rank_between(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rank_after(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rank_spaced(bigint, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rank_between(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.rank_after(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.rank_spaced(bigint, bigint) TO service_role;
```

- [ ] **Étape 4 : vérifier que le test passe**

Lancer : `make test-int`
Attendu : PASS sur `track-ranks.int.test.ts`.

- [ ] **Étape 5 : appliquer la migration et régénérer les types**

Appliquer le contenu de `016_playlist_track_ranks.sql` dans le SQL editor du dashboard Supabase (projet de dev), puis lancer `make generate-types`. Vérifier : `cd backend && npm run type-check && npm run lint`.

- [ ] **Étape 6 : commit**

```bash
git add backend/migrations/016_playlist_track_ranks.sql backend/src/features/playlists/services/track-ranks.int.test.ts backend/src/shared/types/supabase.generated.ts
git commit -m "feat(playlists): add fractional rank functions"
```

---

### Tâche 4 : schéma et opérations atomiques (#88)

**Fichiers :**
- Modifier : `backend/migrations/016_playlist_track_ranks.sql` (suite)
- Créer : `backend/src/features/playlists/services/track-operations.int.test.ts`

**Interfaces :**
- Consomme : `rank_between`, `rank_after`, `rank_spaced` (tâche 3).
- Produit (SQL, réservées à `service_role`) :
  - `playlist_add_track(p_playlist_id uuid, p_track_id uuid, p_added_by uuid DEFAULT NULL) → jsonb` `{ rank, tracksVersion, addedAt, rebalanced }` ; erreurs `PLAYLIST_NOT_FOUND`, `TRACK_DUPLICATE`.
  - `playlist_remove_track(p_playlist_id uuid, p_track_id uuid) → jsonb` `{ tracksVersion }` ; erreurs `PLAYLIST_NOT_FOUND`, `TRACK_NOT_IN_PLAYLIST`.
  - `playlist_move_track(p_playlist_id uuid, p_track_id uuid, p_expected_version bigint, p_after_rank text DEFAULT NULL) → jsonb` `{ rank, tracksVersion, rebalanced }` ; erreurs `PLAYLIST_NOT_FOUND`, `TRACK_NOT_IN_PLAYLIST`, `TRACK_MOVED_CONCURRENTLY`, `PLAYLIST_REBALANCED`.
  - Colonnes : `playlist_tracks.rank text COLLATE "C"`, `playlist_tracks.moved_at_version bigint`, `playlists.tracks_version bigint`, `playlists.ranks_rebalanced_at_version bigint`. La colonne `position` et `get_next_playlist_position` disparaissent.
- Les erreurs sortent par `RAISE EXCEPTION '<CODE>'` : supabase-js les rend dans `error.message`.

- [ ] **Étape 1 : écrire le test qui échoue**

`backend/src/features/playlists/services/track-operations.int.test.ts` :

```ts
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';

// Concurrent playlist edits (subject IV.2.3) against the local Supabase stack.
// Each rpc() is its own HTTP request, so Promise.all runs real concurrent transactions.

let ownerId: string;
let playlistId: string;
const trackIds: string[] = [];

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<{ data: T | null; error: string | null }> {
	const { data, error } = await supabaseAdmin.rpc(fn as never, args as never);
	return { data: (data as T) ?? null, error: error?.message ?? null };
}

async function version(): Promise<number> {
	const { data } = await supabaseAdmin.from('playlists').select('tracks_version').eq('id', playlistId).single();
	return data!.tracks_version;
}

async function order(): Promise<{ track_id: string; rank: string; added_by: string | null }[]> {
	const { data, error } = await supabaseAdmin
		.from('playlist_tracks')
		.select('track_id, rank, added_by')
		.eq('playlist_id', playlistId)
		.order('rank');
	if (error) throw error;
	return data;
}

async function expectInvariants(): Promise<void> {
	const rows = await order();
	expect(new Set(rows.map(r => r.track_id)).size).toBe(rows.length);
	expect(new Set(rows.map(r => r.rank)).size).toBe(rows.length);
}

beforeAll(async () => {
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email: `int-${randomUUID()}@example.com`,
		password: 'integration-test-password',
		email_confirm: true,
	});
	if (error) throw error;
	ownerId = data.user.id;
	await supabaseAdmin.from('user_profiles').insert({ id: ownerId, username: `int_${ownerId.slice(0, 8)}` });

	for (let i = 0; i < 6; i++) {
		const { data: track, error: trackError } = await supabaseAdmin
			.from('tracks')
			.insert({ track_uri: `https://soundcloud.com/int/${randomUUID()}`, title: `T${i}`, artist: 'A', duration_ms: 1000 })
			.select('id')
			.single();
		if (trackError) throw trackError;
		trackIds.push(track.id);
	}
});

beforeEach(async () => {
	const { data, error } = await supabaseAdmin
		.from('playlists')
		.insert({ name: 'int', owner_id: ownerId })
		.select('id')
		.single();
	if (error) throw error;
	playlistId = data.id;
	for (const trackId of trackIds.slice(0, 5)) {
		const added = await rpc('playlist_add_track', { p_playlist_id: playlistId, p_track_id: trackId, p_added_by: ownerId });
		expect(added.error).toBeNull();
	}
});

afterAll(async () => {
	await supabaseAdmin.from('tracks').delete().in('id', trackIds);
	if (ownerId) await supabaseAdmin.auth.admin.deleteUser(ownerId); // cascades to playlists
});

describe('playlist track operations (migration 016)', () => {
	it('appends in order and bumps the version once per add', async () => {
		expect((await order()).map(r => r.track_id)).toEqual(trackIds.slice(0, 5));
		expect(await version()).toBe(5);
	});

	it('refuses a duplicate add', async () => {
		const again = await rpc('playlist_add_track', { p_playlist_id: playlistId, p_track_id: trackIds[0] });
		expect(again.error).toBe('TRACK_DUPLICATE');
	});

	it('applies concurrent moves of different tracks', async () => {
		const [a, b, , d, e] = await order();
		const v = await version();
		const results = await Promise.all([
			rpc('playlist_move_track', { p_playlist_id: playlistId, p_track_id: e.track_id, p_after_rank: a.rank, p_expected_version: v }),
			rpc('playlist_move_track', { p_playlist_id: playlistId, p_track_id: b.track_id, p_after_rank: d.rank, p_expected_version: v }),
		]);
		expect(results.map(r => r.error)).toEqual([null, null]);
		const ids = (await order()).map(r => r.track_id);
		expect(ids.indexOf(e.track_id)).toBe(ids.indexOf(a.track_id) + 1);
		expect(ids.indexOf(b.track_id)).toBe(ids.indexOf(d.track_id) + 1);
		await expectInvariants();
	});

	it('lets one of two concurrent moves of the same track win', async () => {
		const [a, , c, , e] = await order();
		const v = await version();
		const results = await Promise.all([
			rpc('playlist_move_track', { p_playlist_id: playlistId, p_track_id: e.track_id, p_after_rank: a.rank, p_expected_version: v }),
			rpc('playlist_move_track', { p_playlist_id: playlistId, p_track_id: e.track_id, p_after_rank: c.rank, p_expected_version: v }),
		]);
		expect(results.map(r => r.error).sort()).toEqual([null, 'TRACK_MOVED_CONCURRENTLY'].sort());
		await expectInvariants();
	});

	it('moves to the top and to the bottom', async () => {
		const rows = await order();
		const last = rows[rows.length - 1];
		const top = await rpc('playlist_move_track', { p_playlist_id: playlistId, p_track_id: last.track_id, p_expected_version: await version() });
		expect(top.error).toBeNull();
		expect((await order())[0].track_id).toBe(last.track_id);

		const now = await order();
		const bottom = await rpc('playlist_move_track', {
			p_playlist_id: playlistId,
			p_track_id: now[0].track_id,
			p_after_rank: now[now.length - 1].rank,
			p_expected_version: await version(),
		});
		expect(bottom.error).toBeNull();
		const after = await order();
		expect(after[after.length - 1].track_id).toBe(now[0].track_id);
	});

	it('refuses a move of a track removed concurrently and never brings it back', async () => {
		const [a, b] = await order();
		const v = await version();
		const [, moved] = await Promise.all([
			rpc('playlist_remove_track', { p_playlist_id: playlistId, p_track_id: b.track_id }),
			rpc('playlist_move_track', { p_playlist_id: playlistId, p_track_id: b.track_id, p_after_rank: a.rank, p_expected_version: v }),
		]);
		const ids = (await order()).map(r => r.track_id);
		expect(ids).not.toContain(b.track_id);
		if (moved.error) expect(moved.error).toBe('TRACK_NOT_IN_PLAYLIST');
		await expectInvariants();
	});

	it('keeps added_by when a track moves', async () => {
		const [a, , , , e] = await order();
		await rpc('playlist_move_track', { p_playlist_id: playlistId, p_track_id: e.track_id, p_after_rank: a.rank, p_expected_version: await version() });
		expect((await order()).every(r => r.added_by === ownerId)).toBe(true);
	});

	it('keeps every invariant under a burst of concurrent operations', async () => {
		const v = await version();
		const rows = await order();
		await Promise.all([
			...rows.map((row, i) =>
				rpc('playlist_move_track', {
					p_playlist_id: playlistId,
					p_track_id: row.track_id,
					p_after_rank: rows[(i + 2) % rows.length].rank,
					p_expected_version: v,
				})
			),
			rpc('playlist_add_track', { p_playlist_id: playlistId, p_track_id: trackIds[5] }),
			rpc('playlist_remove_track', { p_playlist_id: playlistId, p_track_id: rows[1].track_id }),
		]);
		await expectInvariants();
		expect((await order()).length).toBe(5);
	});

	it('rebalances long ranks and refuses moves sent with the old ranks', async () => {
		const [a, ...others] = await order();
		let v = await version();
		let rebalanced = false;
		// Drop the other tracks right after A in turn: each lands between A and the
		// previous one, so the gap halves and ranks lengthen until a rebalance.
		for (let i = 0; i < 1000 && !rebalanced; i++) {
			const moved = await rpc<{ rebalanced: boolean; tracksVersion: number }>('playlist_move_track', {
				p_playlist_id: playlistId,
				p_track_id: others[i % others.length].track_id,
				p_after_rank: a.rank,
				p_expected_version: v,
			});
			expect(moved.error).toBeNull();
			v = moved.data!.tracksVersion;
			rebalanced = moved.data!.rebalanced;
		}
		expect(rebalanced).toBe(true);
		const ranks = (await order()).map(r => r.rank);
		expect(Math.max(...ranks.map(r => r.length))).toBeLessThanOrEqual(64);

		const stale = await rpc('playlist_move_track', {
			p_playlist_id: playlistId,
			p_track_id: a.track_id,
			p_after_rank: a.rank,
			p_expected_version: v - 1,
		});
		expect(stale.error).toBe('PLAYLIST_REBALANCED');
	});

	it('refuses calls made with the anon key', async () => {
		const anon = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
		const { error } = await anon.rpc('playlist_remove_track' as never, { p_playlist_id: playlistId, p_track_id: trackIds[0] } as never);
		expect(error).not.toBeNull();
		expect((await order()).length).toBe(5);
	});
});
```

Note : dans le test de rééquilibrage, A ne bouge jamais et `a.rank` est son rang d'avant le rééquilibrage ; le dernier appel, envoyé avec la version d'avant, doit donc être refusé. Redéplacer toujours la même track après A ne suffirait pas : elle recevrait chaque fois la même clé. `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont écrits dans `backend/.env.test` par `scripts/test-db.sh`.

- [ ] **Étape 2 : vérifier qu'il échoue**

Lancer : `make test-int`
Attendu : échec, `Could not find the function public.playlist_add_track`.

- [ ] **Étape 3 : écrire le schéma et les fonctions**

Ajouter à la fin de `016_playlist_track_ranks.sql` :

```sql
-- =====================================================
-- Schema: ranks replace positions, versions on playlists and rows
-- =====================================================

ALTER TABLE public.playlists
  ADD COLUMN tracks_version bigint NOT NULL DEFAULT 0,
  ADD COLUMN ranks_rebalanced_at_version bigint NOT NULL DEFAULT 0;

ALTER TABLE public.playlist_tracks
  ADD COLUMN rank text COLLATE "C",
  ADD COLUMN moved_at_version bigint NOT NULL DEFAULT 0;

-- Existing tracks keep their order, evenly spaced.
UPDATE public.playlist_tracks pt
SET rank = public.rank_spaced(r.idx, r.cnt)
FROM (
  SELECT id,
         row_number() OVER (PARTITION BY playlist_id ORDER BY position) AS idx,
         count(*) OVER (PARTITION BY playlist_id) AS cnt
  FROM public.playlist_tracks
) r
WHERE pt.id = r.id;

ALTER TABLE public.playlist_tracks
  ALTER COLUMN rank SET NOT NULL,
  ADD CONSTRAINT playlist_tracks_rank_format CHECK (rank ~ '^[0-9A-Za-z]*[1-9A-Za-z]$' AND length(rank) <= 128),
  ADD CONSTRAINT playlist_tracks_rank_unique UNIQUE (playlist_id, rank) DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public.playlist_tracks DROP CONSTRAINT unique_playlist_position;
DROP INDEX IF EXISTS public.idx_playlist_tracks_playlist;
ALTER TABLE public.playlist_tracks DROP COLUMN position;
CREATE INDEX idx_playlist_tracks_rank ON public.playlist_tracks (playlist_id, rank);

DROP FUNCTION IF EXISTS public.get_next_playlist_position(uuid);

COMMENT ON COLUMN public.playlist_tracks.rank IS 'Sort key: base-62 fraction, compared byte by byte (doc/PLAYLIST_CONCURRENCY.md)';
COMMENT ON COLUMN public.playlist_tracks.moved_at_version IS 'tracks_version at which this track was last added or moved';
COMMENT ON COLUMN public.playlists.tracks_version IS 'Incremented by every add, remove and move of a track';
COMMENT ON COLUMN public.playlists.ranks_rebalanced_at_version IS 'tracks_version of the last rebalance: older ranks are void';

-- =====================================================
-- Operations: one function per operation, serialized per playlist
-- =====================================================

-- Rebalance threshold: a generated rank longer than this respaces the playlist.
CREATE OR REPLACE FUNCTION public.rank_max_length()
RETURNS int LANGUAGE sql IMMUTABLE AS $$ SELECT 64 $$;

-- Locks the playlist row; every operation calls it first, so writers of one
-- playlist run one at a time and cannot deadlock.
CREATE OR REPLACE FUNCTION public.playlist_lock(p_playlist_id uuid)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  v bigint;
BEGIN
  SELECT tracks_version INTO v FROM public.playlists WHERE id = p_playlist_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PLAYLIST_NOT_FOUND';
  END IF;
  RETURN v;
END;
$$;

-- Respaces every rank of the playlist, keeping the order. Caller holds the lock
-- and has already set the new tracks_version.
CREATE OR REPLACE FUNCTION public.playlist_rebalance(p_playlist_id uuid, p_version bigint)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  SET CONSTRAINTS public.playlist_tracks_rank_unique DEFERRED;
  UPDATE public.playlist_tracks pt
  SET rank = public.rank_spaced(r.idx, r.cnt)
  FROM (
    SELECT id,
           row_number() OVER (ORDER BY rank) AS idx,
           count(*) OVER () AS cnt
    FROM public.playlist_tracks
    WHERE playlist_id = p_playlist_id
  ) r
  WHERE pt.id = r.id;
  UPDATE public.playlists SET ranks_rebalanced_at_version = p_version WHERE id = p_playlist_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.playlist_add_track(p_playlist_id uuid, p_track_id uuid, p_added_by uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v bigint;
  last_rank text;
  new_rank text;
  new_added_at timestamptz;
  rebalanced boolean := false;
BEGIN
  v := public.playlist_lock(p_playlist_id) + 1;

  IF EXISTS (SELECT 1 FROM public.playlist_tracks WHERE playlist_id = p_playlist_id AND track_id = p_track_id) THEN
    RAISE EXCEPTION 'TRACK_DUPLICATE';
  END IF;

  SELECT max(rank) INTO last_rank FROM public.playlist_tracks WHERE playlist_id = p_playlist_id;
  new_rank := public.rank_after(last_rank);

  INSERT INTO public.playlist_tracks (playlist_id, track_id, rank, moved_at_version, added_by)
  VALUES (p_playlist_id, p_track_id, new_rank, v, p_added_by)
  RETURNING added_at INTO new_added_at;

  UPDATE public.playlists SET tracks_version = v WHERE id = p_playlist_id;

  IF length(new_rank) > public.rank_max_length() THEN
    PERFORM public.playlist_rebalance(p_playlist_id, v);
    SELECT rank INTO new_rank FROM public.playlist_tracks WHERE playlist_id = p_playlist_id AND track_id = p_track_id;
    rebalanced := true;
  END IF;

  RETURN jsonb_build_object('rank', new_rank, 'tracksVersion', v, 'addedAt', new_added_at, 'rebalanced', rebalanced);
END;
$$;

CREATE OR REPLACE FUNCTION public.playlist_remove_track(p_playlist_id uuid, p_track_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v bigint;
BEGIN
  v := public.playlist_lock(p_playlist_id) + 1;

  DELETE FROM public.playlist_tracks WHERE playlist_id = p_playlist_id AND track_id = p_track_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'TRACK_NOT_IN_PLAYLIST';
  END IF;

  UPDATE public.playlists SET tracks_version = v WHERE id = p_playlist_id;
  RETURN jsonb_build_object('tracksVersion', v);
END;
$$;

CREATE OR REPLACE FUNCTION public.playlist_move_track(
  p_playlist_id uuid,
  p_track_id uuid,
  p_expected_version bigint,
  p_after_rank text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v bigint;
  track_moved_at bigint;
  rebalanced_at bigint;
  next_rank text;
  new_rank text;
  rebalanced boolean := false;
BEGIN
  v := public.playlist_lock(p_playlist_id) + 1;

  SELECT ranks_rebalanced_at_version INTO rebalanced_at FROM public.playlists WHERE id = p_playlist_id;
  IF p_expected_version < rebalanced_at THEN
    RAISE EXCEPTION 'PLAYLIST_REBALANCED';
  END IF;

  SELECT moved_at_version INTO track_moved_at
  FROM public.playlist_tracks WHERE playlist_id = p_playlist_id AND track_id = p_track_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'TRACK_NOT_IN_PLAYLIST';
  END IF;
  IF track_moved_at > p_expected_version THEN
    RAISE EXCEPTION 'TRACK_MOVED_CONCURRENTLY';
  END IF;

  -- The first other track after the drop point; nothing else lies between.
  SELECT min(rank) INTO next_rank
  FROM public.playlist_tracks
  WHERE playlist_id = p_playlist_id
    AND track_id <> p_track_id
    AND (p_after_rank IS NULL OR rank > p_after_rank COLLATE "C");

  new_rank := public.rank_between(p_after_rank, next_rank);

  UPDATE public.playlist_tracks
  SET rank = new_rank, moved_at_version = v
  WHERE playlist_id = p_playlist_id AND track_id = p_track_id;

  UPDATE public.playlists SET tracks_version = v WHERE id = p_playlist_id;

  IF length(new_rank) > public.rank_max_length() THEN
    PERFORM public.playlist_rebalance(p_playlist_id, v);
    SELECT rank INTO new_rank FROM public.playlist_tracks WHERE playlist_id = p_playlist_id AND track_id = p_track_id;
    rebalanced := true;
  END IF;

  RETURN jsonb_build_object('rank', new_rank, 'tracksVersion', v, 'rebalanced', rebalanced);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rank_max_length() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.playlist_lock(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.playlist_rebalance(uuid, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.playlist_add_track(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.playlist_remove_track(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.playlist_move_track(uuid, uuid, bigint, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rank_max_length() TO service_role;
GRANT EXECUTE ON FUNCTION public.playlist_lock(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.playlist_rebalance(uuid, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.playlist_add_track(uuid, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.playlist_remove_track(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.playlist_move_track(uuid, uuid, bigint, text) TO service_role;
```

Points à retenir :
- `p_expected_version` est placé avant `p_after_rank`, parce qu'en Postgres un paramètre avec `DEFAULT` ne peut pas précéder un paramètre sans.
- Comme `rank` est déclarée `COLLATE "C"`, `max(rank)`, `min(rank)` et `ORDER BY rank` suivent l'ordre des octets.
- Chaque move dans le même trou allonge la clé d'environ un caractère tous les 6 moves : le test de rééquilibrage atteint 64 caractères vers 380 moves, sous la limite de 1000 qu'il s'accorde. Noter le seuil retenu dans l'issue #88.

- [ ] **Étape 4 : vérifier que le test passe**

Lancer : `make test-int`
Attendu : PASS sur `track-ranks.int.test.ts` et `track-operations.int.test.ts`. Lancer deux fois de suite pour repérer un test instable.

- [ ] **Étape 5 : appliquer et régénérer**

Appliquer la suite de la migration dans le dashboard Supabase, puis `make generate-types`. `npm run type-check` échoue alors sur le code qui lit `position` : c'est attendu et corrigé en tâche 5. Faire ce commit et la tâche 5 sur la même branche, avant toute PR.

- [ ] **Étape 6 : commit**

```bash
git add backend/migrations/016_playlist_track_ranks.sql backend/src/features/playlists/services/track-operations.int.test.ts backend/src/shared/types/supabase.generated.ts
git commit -m "feat(playlists): add atomic track operations with ranks and versions"
```

---

### Tâche 5 : service, contrôleur et routes (#89)

**Fichiers :**
- Créer : `backend/src/features/playlists/utils/track-rpc.ts`
- Créer : `backend/src/features/playlists/utils/track-rpc.test.ts`
- Réécrire : `backend/src/features/playlists/services/playlist-track.service.ts`
- Modifier : `backend/src/features/playlists/playlist.service.ts` (lectures ordonnées)
- Modifier : `backend/src/features/playlists/utils/playlist.helpers.ts` (suppression de `reindexPositions`)
- Modifier : `backend/src/features/playlists/playlist.controller.ts`, `playlist.routes.ts`
- Modifier : `backend/src/features/playlists/playlist.types.ts`, `playlist.validators.ts`, `playlist.openapi.ts` (retrait de l'ancien contrat)

**Interfaces :**
- Consomme : les fonctions SQL de la tâche 4 ; les types de la tâche 1.
- Produit :
  - `addTrackRpc(playlistId: string, trackId: string, addedBy: string | null): Promise<{ rank: string; tracksVersion: number; addedAt: string; rebalanced: boolean }>`
  - `removeTrackRpc(playlistId: string, trackId: string): Promise<{ tracksVersion: number }>`
  - `moveTrackRpc(playlistId: string, trackId: string, move: MoveTrackInput): Promise<{ rank: string; tracksVersion: number; rebalanced: boolean }>`
  - `PlaylistTrackService.addTrack(...) → AddTrackResult`, `.removeTrack(...) → RemoveTrackResult`, `.moveTrack(playlistId, userId, trackId, move) → MoveTrackResult`
  - `POST /api/playlists/:id/tracks/:trackId/move` remplace `PUT /api/playlists/:id/tracks/reorder`.
- En attendant la tâche 6, le service appelle `realtime.notifyPlaylistUpdate` avec l'ancienne signature : `'track_added'` avec `{ track }` (on passe `{ ...track, position: 0 }` pour satisfaire `TrackWithPositionResponse`), `'track_removed'` avec `{ trackId }`, et `'reordered'` pour un move.

- [ ] **Étape 1 : écrire le test qui échoue**

`backend/src/features/playlists/utils/track-rpc.test.ts` :

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/shared/middleware/error-handler.js';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock('@/shared/config/supabase.js', () => ({ supabaseAdmin: { rpc } }));

const { addTrackRpc, moveTrackRpc, removeTrackRpc } = await import('@/features/playlists/utils/track-rpc.js');

describe('track RPC wrappers', () => {
	beforeEach(() => rpc.mockReset());

	it('returns the parsed move result', async () => {
		rpc.mockResolvedValue({ data: { rank: 'l', tracksVersion: 11, rebalanced: false }, error: null });
		await expect(moveTrackRpc('p', 't', { afterRank: 'h', expectedVersion: 10 })).resolves.toEqual({
			rank: 'l',
			tracksVersion: 11,
			rebalanced: false,
		});
		expect(rpc).toHaveBeenCalledWith('playlist_move_track', {
			p_playlist_id: 'p',
			p_track_id: 't',
			p_expected_version: 10,
			p_after_rank: 'h',
		});
	});

	it.each([
		['TRACK_MOVED_CONCURRENTLY', 409],
		['TRACK_NOT_IN_PLAYLIST', 409],
		['PLAYLIST_REBALANCED', 409],
		['PLAYLIST_NOT_FOUND', 404],
	])('maps move error %s to %i', async (code, status) => {
		rpc.mockResolvedValue({ data: null, error: { message: code } });
		const error = await moveTrackRpc('p', 't', { afterRank: null, expectedVersion: 0 }).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(AppError);
		expect(error).toMatchObject({ statusCode: status, code });
	});

	it('maps a missing track on remove to 404', async () => {
		rpc.mockResolvedValue({ data: null, error: { message: 'TRACK_NOT_IN_PLAYLIST' } });
		await expect(removeTrackRpc('p', 't')).rejects.toMatchObject({ statusCode: 404, code: 'TRACK_NOT_IN_PLAYLIST' });
	});

	it('maps a duplicate add to 409', async () => {
		rpc.mockResolvedValue({ data: null, error: { message: 'TRACK_DUPLICATE' } });
		await expect(addTrackRpc('p', 't', null)).rejects.toMatchObject({ statusCode: 409, code: 'TRACK_DUPLICATE' });
	});

	it('turns an unknown database error into a 500', async () => {
		rpc.mockResolvedValue({ data: null, error: { message: 'connection reset' } });
		await expect(removeTrackRpc('p', 't')).rejects.toMatchObject({ statusCode: 500 });
	});

	it('rejects a malformed result', async () => {
		rpc.mockResolvedValue({ data: { tracksVersion: 'x' }, error: null });
		await expect(removeTrackRpc('p', 't')).rejects.toMatchObject({ statusCode: 500 });
	});
});
```

- [ ] **Étape 2 : vérifier qu'il échoue**

Lancer : `cd backend && npx vitest run src/features/playlists/utils/track-rpc.test.ts`
Attendu : échec, module introuvable.

- [ ] **Étape 3 : écrire `track-rpc.ts`**

```ts
import { z } from 'zod';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type { MoveTrackInput } from '@/features/playlists/playlist.validators.js';

// Calls the track operations of migration 016 and turns their errors into
// API errors (doc/PLAYLIST_CONCURRENCY.md, "Operations").

const addResultSchema = z.object({
	rank: z.string(),
	tracksVersion: z.number().int(),
	addedAt: z.string(),
	rebalanced: z.boolean(),
});
const removeResultSchema = z.object({ tracksVersion: z.number().int() });
const moveResultSchema = z.object({
	rank: z.string(),
	tracksVersion: z.number().int(),
	rebalanced: z.boolean(),
});

type Operation = 'add' | 'remove' | 'move';

const ERRORS: Record<string, { status: Partial<Record<Operation, number>> & { default: number }; message: string }> = {
	PLAYLIST_NOT_FOUND: { status: { default: 404 }, message: 'Playlist not found' },
	TRACK_DUPLICATE: { status: { default: 409 }, message: 'Track already in playlist' },
	TRACK_NOT_IN_PLAYLIST: { status: { default: 409, remove: 404 }, message: 'Track is not in the playlist' },
	TRACK_MOVED_CONCURRENTLY: { status: { default: 409 }, message: 'Track was moved by someone else' },
	PLAYLIST_REBALANCED: { status: { default: 409 }, message: 'Playlist order changed, reload it' },
};

function toAppError(operation: Operation, message: string): AppError {
	const known = ERRORS[message];
	if (known) {
		return new AppError(known.status[operation] ?? known.status.default, known.message, message);
	}
	logger.error('Track operation failed', { operation, error: message });
	return new AppError(500, 'Track operation failed', 'TRACK_OPERATION_ERROR');
}

async function call<T>(operation: Operation, fn: string, args: Record<string, unknown>, schema: z.ZodType<T>): Promise<T> {
	const { data, error } = await supabaseAdmin.rpc(fn as never, args as never);
	if (error) throw toAppError(operation, error.message);
	const parsed = schema.safeParse(data);
	if (!parsed.success) throw toAppError(operation, `malformed result from ${fn}`);
	return parsed.data;
}

export function addTrackRpc(playlistId: string, trackId: string, addedBy: string | null) {
	return call('add', 'playlist_add_track', {
		p_playlist_id: playlistId,
		p_track_id: trackId,
		...(addedBy ? { p_added_by: addedBy } : {}),
	}, addResultSchema);
}

export function removeTrackRpc(playlistId: string, trackId: string) {
	return call('remove', 'playlist_remove_track', { p_playlist_id: playlistId, p_track_id: trackId }, removeResultSchema);
}

export function moveTrackRpc(playlistId: string, trackId: string, move: MoveTrackInput) {
	return call('move', 'playlist_move_track', {
		p_playlist_id: playlistId,
		p_track_id: trackId,
		p_expected_version: move.expectedVersion,
		...(move.afterRank !== null ? { p_after_rank: move.afterRank } : {}),
	}, moveResultSchema);
}
```

Le cast `fn as never` évite de dupliquer la signature générée de chaque fonction ; le résultat est validé par Zod. Si le lint refuse ce cast, appeler `supabaseAdmin.rpc('playlist_move_track', {...})` directement dans chaque fonction avec les types générés. Le test `toHaveBeenCalledWith` de l'étape 1 suppose les clés optionnelles absentes quand elles sont nulles : avec `afterRank: 'h'` elles sont présentes.

- [ ] **Étape 4 : vérifier que le test passe**

Lancer : `cd backend && npx vitest run src/features/playlists/utils/track-rpc.test.ts`
Attendu : PASS.

- [ ] **Étape 5 : réécrire le service**

`backend/src/features/playlists/services/playlist-track.service.ts` :

```ts
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { checkEditPermission } from '@/features/playlists/permissions/playlist.permissions.js';
import { formatTrackResponse } from '@/features/playlists/utils/playlist.helpers.js';
import { addTrackRpc, moveTrackRpc, removeTrackRpc } from '@/features/playlists/utils/track-rpc.js';
import { realtime } from '@/realtime/index.js';
import type {
	AddTrackDTO,
	AddTrackResult,
	MoveTrackResult,
	RemoveTrackResult,
	TrackInPlaylistResponse,
} from '@/features/playlists/playlist.types.js';
import type { MoveTrackInput } from '@/features/playlists/playlist.validators.js';

/**
 * Adds, removes and moves tracks through the atomic operations of migration 016.
 * See doc/PLAYLIST_CONCURRENCY.md.
 */
export class PlaylistTrackService {
	/**
	 * Add track to playlist
	 * Note: In 'open' edit mode, we don't track who added the track (added_by = null)
	 */
	async addTrack(playlistId: string, userId: string, track: AddTrackDTO): Promise<AddTrackResult> {
		const playlist = await checkEditPermission(playlistId, userId);

		const { data: trackRow, error } = await supabaseAdmin
			.from('tracks')
			.upsert(
				{
					track_uri: track.trackUri,
					title: track.title,
					artist: track.artist,
					album: track.album,
					album_art: track.albumArt,
					duration_ms: track.durationMs,
					preview_url: track.previewUrl,
				},
				{ onConflict: 'track_uri' }
			)
			.select()
			.single();
		if (error) {
			logger.error('Failed to upsert track', { error, playlistId });
			throw new AppError(500, 'Failed to add track', 'TRACK_ADD_ERROR');
		}

		const addedBy = playlist.edit_mode === 'restricted' ? userId : null;
		const result = await addTrackRpc(playlistId, trackRow.id, addedBy);

		const added: TrackInPlaylistResponse = {
			...formatTrackResponse(trackRow),
			rank: result.rank,
			addedBy,
			addedAt: result.addedAt,
		};
		logger.info('Track added to playlist', { playlistId, trackId: trackRow.id, userId, version: result.tracksVersion });
		realtime.notifyPlaylistUpdate(playlistId, 'track_added', { track: { ...added, position: 0 } });

		return { track: added, tracksVersion: result.tracksVersion, rebalanced: result.rebalanced };
	}

	/**
	 * Remove track from playlist
	 */
	async removeTrack(playlistId: string, userId: string, trackId: string): Promise<RemoveTrackResult> {
		await checkEditPermission(playlistId, userId);
		const result = await removeTrackRpc(playlistId, trackId);

		logger.info('Track removed from playlist', { playlistId, trackId, userId, version: result.tracksVersion });
		realtime.notifyPlaylistUpdate(playlistId, 'track_removed', { trackId });

		return result;
	}

	/**
	 * Move a track right after move.afterRank (null = top)
	 */
	async moveTrack(playlistId: string, userId: string, trackId: string, move: MoveTrackInput): Promise<MoveTrackResult> {
		await checkEditPermission(playlistId, userId);
		const result = await moveTrackRpc(playlistId, trackId, move);

		logger.info('Track moved in playlist', { playlistId, trackId, userId, version: result.tracksVersion });
		realtime.notifyPlaylistUpdate(playlistId, 'reordered');

		return { trackId, ...result };
	}
}
```

Supprimer `reindexPositions` de `utils/playlist.helpers.ts` (plus aucun appelant).

- [ ] **Étape 6 : ordonner les lectures par rang**

Dans `playlist.service.ts` :
- remplacer chaque `.select('playlist_id, position, tracks:track_id(album_art)')` par `.select('playlist_id, rank, tracks:track_id(album_art)')` et chaque `.order('position', { ascending: true })` par `.order('rank', { ascending: true })` (lignes ~60, ~168, ~252, ~344) ;
- dans `getPlaylistById`, sélectionner `rank` au lieu de `position`, mapper `rank: pt.rank` au lieu de `position: pt.position`, et remplacer le `tracksVersion: 0` provisoire de la tâche 1 par `tracksVersion: playlist.tracks_version`.

Dans `playlist.types.ts` : `PlaylistWithTracksResponse.tracks` devient `TrackInPlaylistResponse[]` ; supprimer `ReorderTracksDTO`. Garder `TrackWithPositionResponse` jusqu'à la tâche 6 (le temps réel l'importe encore).

- [ ] **Étape 7 : contrôleur et routes**

Dans `playlist.controller.ts` :
- importer `moveTrackSchema` à la place de `reorderTracksSchema` ;
- `addTrack` : `const result = await trackService.addTrack(id, authReq.user.id, validated);` puis `data: result` dans la réponse 201 ;
- `removeTrack` : `const result = await trackService.removeTrack(id, authReq.user.id, trackId);` puis `data: result` ;
- remplacer `reorderTracks` par :

```ts
	/**
	 * POST /api/playlists/:id/tracks/:trackId/move
	 * Move a track right after afterRank (doc/PLAYLIST_CONCURRENCY.md)
	 */
	async moveTrack(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const id = routeParam(req, 'id');
			const trackId = routeParam(req, 'trackId');
			const validated = moveTrackSchema.parse(req.body);
			const result = await trackService.moveTrack(id, authReq.user.id, trackId, validated);

			const response: ApiResponse = {
				success: true,
				data: result,
				meta: { timestamp: new Date().toISOString() },
			};

			res.json(response);
		} catch (error) {
			next(error);
		}
	}
```

Dans `playlist.routes.ts`, remplacer le bloc `PUT /:id/tracks/reorder` par :

```ts
/**
 * @route   POST /api/playlists/:id/tracks/:trackId/move
 * @desc    Move a track right after afterRank (concurrency-safe)
 * @access  Private (owner + collaborators)
 */
router.post('/:id/tracks/:trackId/move', (req, res, next) =>
	playlistController.moveTrack(req, res, next)
);
```

Supprimer `reorderTracksSchema` et `ReorderTracksInput` de `playlist.validators.ts`. Dans `playlist.openapi.ts`, supprimer le chemin `'/api/playlists/{id}/tracks/reorder'`, le schéma `ReorderTracksRequest` et la propriété `position` de `PlaylistTrack`.

- [ ] **Étape 8 : vérifier**

Lancer : `cd backend && npm run type-check && npm run lint && npm test && cd .. && make test-int`
Attendu : tout vert. `grep -rn "position\|reorder" backend/src/features/playlists` ne renvoie plus que les anciens types gardés pour le temps réel.

Puis, avec `make dev-docker` : dans Swagger UI, ajouter deux tracks à une playlist, lire `tracksVersion` et les rangs via `GET /api/playlists/{id}`, appeler `move` avec ces valeurs (200), puis rejouer le même appel (`409 TRACK_MOVED_CONCURRENTLY`).

- [ ] **Étape 9 : commit**

```bash
git add backend/src/features/playlists
git commit -m "feat(playlists): route add, remove and move through atomic operations"
```

---

### Tâche 6 : diffusion versionnée (#90)

**Fichiers :**
- Modifier : `backend/src/realtime/index.ts`
- Modifier : `backend/src/features/playlists/services/playlist-track.service.ts` (appels de notification)
- Modifier : `backend/src/features/playlists/playlist.types.ts` (retrait de `TrackWithPositionResponse`)
- Créer : `backend/src/realtime/playlist-updated.int.test.ts`
- Modifier : `backend/package.json`, `backend/package-lock.json` (`socket.io-client` en devDependency)

**Interfaces :**
- Consomme : `PlaylistUpdatedPayload` (tâche 1).
- Produit : `realtime.notifyPlaylistUpdate(payload: PlaylistUpdatedPayload): void`, qui émet `playlist:updated` avec exactement `payload` dans la room `playlist:<playlistId>`.

- [ ] **Étape 1 : installer le client de test**

```bash
cd backend && npm install -D socket.io-client
```

- [ ] **Étape 2 : écrire le test qui échoue**

`backend/src/realtime/playlist-updated.int.test.ts` :

```ts
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { io as connect, type Socket } from 'socket.io-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { realtime } from '@/realtime/index.js';
import type { PlaylistUpdatedPayload } from '@/features/playlists/playlist.types.js';

// Two clients in one playlist room receive the same versioned event (#90).
const server = createServer();
let url: string;
const clients: Socket[] = [];

beforeAll(async () => {
	realtime.initialize(server);
	await new Promise<void>(resolve => server.listen(0, resolve));
	url = `http://localhost:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
	clients.forEach(c => c.disconnect());
	await new Promise(resolve => server.close(resolve));
});

function join(playlistId: string): Promise<Socket> {
	return new Promise(resolve => {
		// When socket JWT auth (#62) is merged, pass { auth: { token } } with a test user's token here.
		const socket = connect(url, { transports: ['websocket'] });
		clients.push(socket);
		socket.on('connect', () => {
			socket.emit('playlist:join', playlistId);
			setTimeout(() => resolve(socket), 100);
		});
	});
}

describe('playlist:updated', () => {
	it('sends the same version and change to every client of the room', async () => {
		const [alice, bob] = await Promise.all([join('p1'), join('p1')]);
		const received = Promise.all(
			[alice, bob].map(s => new Promise<PlaylistUpdatedPayload>(resolve => s.once('playlist:updated', resolve)))
		);

		const payload: PlaylistUpdatedPayload = {
			playlistId: 'p1',
			tracksVersion: 11,
			rebalanced: false,
			event: 'track_moved',
			trackId: 't1',
			rank: 'l',
		};
		realtime.notifyPlaylistUpdate(payload);

		expect(await received).toEqual([payload, payload]);
	});
});
```

- [ ] **Étape 3 : vérifier qu'il échoue**

Lancer : `make test-int`
Attendu : échec de type ou d'exécution, `notifyPlaylistUpdate` attend encore `(playlistId, event, data)`.

- [ ] **Étape 4 : changer la diffusion**

Dans `backend/src/realtime/index.ts` :
- supprimer `TrackAddedPayload`, `TrackRemovedPayload`, `PlaylistEventPayload` et l'import de `TrackWithPositionResponse` ;
- importer `import type { PlaylistUpdatedPayload } from '@/features/playlists/playlist.types.js';` ;
- remplacer les trois surcharges et l'implémentation par :

```ts
	/**
	 * Notify all clients watching a playlist of one track operation and the
	 * version it produced (doc/PLAYLIST_CONCURRENCY.md, "Broadcast and convergence")
	 */
	notifyPlaylistUpdate(payload: PlaylistUpdatedPayload): void {
		const { playlistId, event, tracksVersion } = payload;
		if (!this.io) {
			socketLogger.event('playlist:updated', 'N/A', {
				level: 'warn',
				playlistId,
				event,
				action: 'not_initialized',
			});
			return;
		}

		this.io.to(`playlist:${playlistId}`).emit('playlist:updated', payload);

		socketLogger.broadcast('playlist_updated', {
			playlistId,
			event,
			tracksVersion,
			room: `playlist:${playlistId}`,
			action: 'broadcasted',
		});
	}
```

Dans `playlist-track.service.ts`, remplacer les trois appels :

```ts
		realtime.notifyPlaylistUpdate({
			playlistId,
			tracksVersion: result.tracksVersion,
			rebalanced: result.rebalanced,
			event: 'track_added',
			track: added,
		});
```

```ts
		realtime.notifyPlaylistUpdate({
			playlistId,
			tracksVersion: result.tracksVersion,
			rebalanced: false,
			event: 'track_removed',
			trackId,
		});
```

```ts
		realtime.notifyPlaylistUpdate({
			playlistId,
			tracksVersion: result.tracksVersion,
			rebalanced: result.rebalanced,
			event: 'track_moved',
			trackId,
			rank: result.rank,
		});
```

Supprimer `TrackWithPositionResponse` de `playlist.types.ts`. Si `socketLogger.broadcast` n'accepte pas `tracksVersion` dans son objet de contexte, retirer ce champ.

- [ ] **Étape 5 : vérifier**

Lancer : `cd backend && npm run type-check && npm run lint && npm test && cd .. && make test-int`
Attendu : tout vert.

- [ ] **Étape 6 : commit**

```bash
git add backend/src/realtime backend/src/features/playlists backend/package.json backend/package-lock.json
git commit -m "feat(realtime): broadcast versioned playlist track events"
```

---

### Tâche 7 : convergence côté mobile (#91)

**Fichiers :**
- Modifier : `mobile/src/services/api.ts` (export de `apiRequest`)
- Modifier : `mobile/src/api/playlistApi.ts`
- Créer : `mobile/src/store/playlistSync.ts`, `mobile/src/store/playlistSync.test.ts`
- Modifier : `mobile/src/store/playlistStore.ts`
- Créer : `mobile/src/store/playlistStore.test.ts`
- Modifier : `mobile/src/hooks/usePlaylistSocket.ts`
- Modifier : `mobile/src/types/track.types.ts` (retrait de `TrackWithPosition`)

**Interfaces :**
- Consomme : les types de la tâche 2 ; les endpoints de la tâche 5 ; l'événement de la tâche 6.
- Produit :
  - `playlistApi.addTrack(playlistId, track): Promise<AddTrackResult>`, `.removeTrack(playlistId, trackId): Promise<RemoveTrackResult>`, `.moveTrack(playlistId, trackId, afterRank: string | null, expectedVersion: number): Promise<MoveTrackResult>`
  - `sortByRank(tracks: TrackInPlaylist[]): TrackInPlaylist[]`
  - `applyPlaylistEvent(playlist: PlaylistWithTracks, event: PlaylistUpdatedEvent): PlaylistWithTracks | 'ignore' | 'reload'`
  - store : `moveTrack(playlistId: string, trackId: string, afterRank: string | null): Promise<void>` (rejette avec l'`ApiError` sur un 409), `applyPlaylistEvent(event: PlaylistUpdatedEvent): 'applied' | 'ignored' | 'reload'`
  - constante `CONFLICT_CODES = ['TRACK_MOVED_CONCURRENTLY', 'TRACK_NOT_IN_PLAYLIST', 'PLAYLIST_REBALANCED']`

- [ ] **Étape 1 : écrire le test pur qui échoue**

`mobile/src/store/playlistSync.test.ts` :

```ts
import { applyPlaylistEvent, sortByRank } from '@/store/playlistSync';
import type { PlaylistWithTracks } from '@/types/playlist.types';
import type { TrackInPlaylist } from '@/types/track.types';

const track = (id: string, rank: string): TrackInPlaylist =>
	({ id, rank, addedBy: null, addedAt: '2026-10-06T00:00:00Z', title: id, artist: 'A', trackUri: id, durationMs: 1 }) as TrackInPlaylist;

const playlist = (tracksVersion: number, tracks: TrackInPlaylist[]): PlaylistWithTracks =>
	({ id: 'p', tracksVersion, tracks }) as PlaylistWithTracks;

const base = playlist(10, [track('A', 'a'), track('B', 'h'), track('C', 'p')]);

describe('sortByRank', () => {
	it('sorts by byte order', () => {
		expect(sortByRank([track('x', 'a'), track('y', 'Z'), track('z', '1')]).map(t => t.id)).toEqual(['z', 'y', 'x']);
	});
});

describe('applyPlaylistEvent', () => {
	it('ignores a version already displayed', () => {
		expect(applyPlaylistEvent(base, { playlistId: 'p', tracksVersion: 10, rebalanced: false, event: 'track_removed', trackId: 'A' })).toBe('ignore');
	});

	it('asks for a reload when a version was skipped', () => {
		expect(applyPlaylistEvent(base, { playlistId: 'p', tracksVersion: 12, rebalanced: false, event: 'track_removed', trackId: 'A' })).toBe('reload');
	});

	it('asks for a reload after a rebalance', () => {
		expect(applyPlaylistEvent(base, { playlistId: 'p', tracksVersion: 11, rebalanced: true, event: 'track_moved', trackId: 'C', rank: '1' })).toBe('reload');
	});

	it('applies a move in rank order', () => {
		const next = applyPlaylistEvent(base, { playlistId: 'p', tracksVersion: 11, rebalanced: false, event: 'track_moved', trackId: 'C', rank: 'c' });
		expect(next).not.toBe('ignore');
		expect((next as PlaylistWithTracks).tracks.map(t => t.id)).toEqual(['A', 'C', 'B']);
		expect((next as PlaylistWithTracks).tracksVersion).toBe(11);
	});

	it('applies an add and a remove', () => {
		const added = applyPlaylistEvent(base, { playlistId: 'p', tracksVersion: 11, rebalanced: false, event: 'track_added', track: track('D', 'w') }) as PlaylistWithTracks;
		expect(added.tracks.map(t => t.id)).toEqual(['A', 'B', 'C', 'D']);
		const removed = applyPlaylistEvent(added, { playlistId: 'p', tracksVersion: 12, rebalanced: false, event: 'track_removed', trackId: 'B' }) as PlaylistWithTracks;
		expect(removed.tracks.map(t => t.id)).toEqual(['A', 'C', 'D']);
	});
});
```

- [ ] **Étape 2 : vérifier qu'il échoue**

Lancer : `cd mobile && npx jest src/store/playlistSync.test.ts`
Attendu : échec, module introuvable.

- [ ] **Étape 3 : écrire `playlistSync.ts`**

```ts
import type { PlaylistUpdatedEvent, PlaylistWithTracks } from '@/types/playlist.types';
import type { TrackInPlaylist } from '@/types/track.types';

// Applies the server's track events in version order (doc/PLAYLIST_CONCURRENCY.md,
// "Broadcast and convergence"). Ranks compare byte by byte, like the server.

export function sortByRank(tracks: TrackInPlaylist[]): TrackInPlaylist[] {
	return [...tracks].sort((a, b) => (a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0));
}

export function applyPlaylistEvent(
	playlist: PlaylistWithTracks,
	event: PlaylistUpdatedEvent
): PlaylistWithTracks | 'ignore' | 'reload' {
	if (event.tracksVersion <= playlist.tracksVersion) return 'ignore';
	if (event.tracksVersion > playlist.tracksVersion + 1 || event.rebalanced) return 'reload';

	let tracks: TrackInPlaylist[];
	switch (event.event) {
		case 'track_added':
			tracks = [...playlist.tracks.filter(t => t.id !== event.track.id), event.track];
			break;
		case 'track_removed':
			tracks = playlist.tracks.filter(t => t.id !== event.trackId);
			break;
		case 'track_moved':
			tracks = playlist.tracks.map(t => (t.id === event.trackId ? { ...t, rank: event.rank } : t));
			break;
	}
	return { ...playlist, tracks: sortByRank(tracks), tracksVersion: event.tracksVersion };
}
```

- [ ] **Étape 4 : vérifier que le test passe**

Lancer : `cd mobile && npx jest src/store/playlistSync.test.ts`
Attendu : PASS.

- [ ] **Étape 5 : passer les appels de tracks par `apiRequest`**

Dans `mobile/src/services/api.ts`, exporter la fonction existante : `export async function apiRequest<T>(...)` (ligne ~109).

Dans `mobile/src/api/playlistApi.ts`, importer `apiRequest` depuis `@/services/api` et les types de résultat, puis remplacer `addTrack`, `removeTrack` et `reorderTracks` par :

```ts
	/**
	 * Add track to playlist
	 */
	addTrack(playlistId: string, track: Track): Promise<AddTrackResult> {
		return apiRequest<AddTrackResult>(`/api/playlists/${playlistId}/tracks`, {
			method: 'POST',
			body: JSON.stringify({
				trackUri: track.trackUri,
				title: track.title,
				artist: track.artist,
				album: track.album,
				albumArt: track.albumArt,
				durationMs: track.durationMs,
				previewUrl: track.previewUrl,
			}),
		});
	},

	/**
	 * Remove track from playlist
	 */
	removeTrack(playlistId: string, trackId: string): Promise<RemoveTrackResult> {
		return apiRequest<RemoveTrackResult>(`/api/playlists/${playlistId}/tracks/${trackId}`, {
			method: 'DELETE',
		});
	},

	/**
	 * Move a track right after afterRank (null = top). See doc/PLAYLIST_CONCURRENCY.md.
	 */
	moveTrack(playlistId: string, trackId: string, afterRank: string | null, expectedVersion: number): Promise<MoveTrackResult> {
		return apiRequest<MoveTrackResult>(`/api/playlists/${playlistId}/tracks/${trackId}/move`, {
			method: 'POST',
			body: JSON.stringify({ afterRank, expectedVersion }),
		});
	},
```

Reprendre le corps de requête de l'ancien `addTrack` (lignes ~177–243) s'il transforme des champs que ce bloc ne reprend pas. Vérifier qu'`apiRequest` ajoute bien `Content-Type: application/json` ; sinon, le passer dans `headers`.

- [ ] **Étape 6 : écrire le test du store qui échoue**

`mobile/src/store/playlistStore.test.ts` :

```ts
import { usePlaylistStore } from '@/store/playlistStore';
import { playlistApi } from '@api/playlistApi';
import { ApiError } from '@/services/api';
import type { PlaylistWithTracks } from '@/types/playlist.types';
import type { TrackInPlaylist } from '@/types/track.types';

jest.mock('@api/playlistApi', () => ({
	playlistApi: { moveTrack: jest.fn(), fetchPlaylistById: jest.fn() },
}));

const api = playlistApi as jest.Mocked<typeof playlistApi>;

const track = (id: string, rank: string) =>
	({ id, rank, addedBy: null, addedAt: '', title: id, artist: 'A', trackUri: id, durationMs: 1 }) as TrackInPlaylist;

const start = (): PlaylistWithTracks =>
	({ id: 'p', tracksVersion: 10, tracks: [track('A', 'a'), track('B', 'h'), track('C', 'p')] }) as PlaylistWithTracks;

beforeEach(() => {
	jest.resetAllMocks();
	usePlaylistStore.setState({ currentPlaylist: start(), playlistsCache: new Map([['p', start()]]), error: null });
});

describe('playlistStore.moveTrack', () => {
	it('sends two quick moves one after the other with the returned version', async () => {
		api.moveTrack
			.mockResolvedValueOnce({ trackId: 'C', rank: 'c', tracksVersion: 11, rebalanced: false })
			.mockResolvedValueOnce({ trackId: 'B', rank: 'b', tracksVersion: 12, rebalanced: false });

		const { moveTrack } = usePlaylistStore.getState();
		await Promise.all([moveTrack('p', 'C', 'a'), moveTrack('p', 'B', 'a')]);

		expect(api.moveTrack).toHaveBeenNthCalledWith(1, 'p', 'C', 'a', 10);
		expect(api.moveTrack).toHaveBeenNthCalledWith(2, 'p', 'B', 'a', 11);
		const playlist = usePlaylistStore.getState().currentPlaylist!;
		expect(playlist.tracksVersion).toBe(12);
		expect(playlist.tracks.map(t => t.id)).toEqual(['A', 'B', 'C']);
	});

	it('reloads the playlist and rethrows on a conflict', async () => {
		api.moveTrack.mockRejectedValue(new ApiError('moved', 'TRACK_MOVED_CONCURRENTLY'));
		api.fetchPlaylistById.mockResolvedValue({ ...start(), tracksVersion: 13 });

		await expect(usePlaylistStore.getState().moveTrack('p', 'C', 'a')).rejects.toMatchObject({
			code: 'TRACK_MOVED_CONCURRENTLY',
		});
		expect(api.fetchPlaylistById).toHaveBeenCalledWith('p');
		expect(usePlaylistStore.getState().currentPlaylist!.tracksVersion).toBe(13);
	});
});

describe('playlistStore.applyPlaylistEvent', () => {
	it('applies the next version and ignores it a second time', () => {
		const event = { playlistId: 'p', tracksVersion: 11, rebalanced: false, event: 'track_removed' as const, trackId: 'A' };
		expect(usePlaylistStore.getState().applyPlaylistEvent(event)).toBe('applied');
		expect(usePlaylistStore.getState().applyPlaylistEvent(event)).toBe('ignored');
		expect(usePlaylistStore.getState().currentPlaylist!.tracks.map(t => t.id)).toEqual(['B', 'C']);
	});

	it('asks for a reload when a version is missing', () => {
		const event = { playlistId: 'p', tracksVersion: 15, rebalanced: false, event: 'track_removed' as const, trackId: 'A' };
		expect(usePlaylistStore.getState().applyPlaylistEvent(event)).toBe('reload');
	});
});
```

Vérifier que `ApiError` est bien exporté par `@/services/api` (ligne 45) et que l'alias `@api/*` est résolu par la config jest ; sinon utiliser le chemin `@/api/playlistApi`.

- [ ] **Étape 7 : vérifier qu'il échoue**

Lancer : `cd mobile && npx jest src/store/playlistStore.test.ts`
Attendu : échec, `moveTrack` n'est pas une fonction.

- [ ] **Étape 8 : implémenter dans le store**

Dans `playlistStore.ts` :
- importer `applyPlaylistEvent as applyEvent` et `sortByRank` depuis `@/store/playlistSync`, `ApiError` depuis `@/services/api`, `PlaylistUpdatedEvent` depuis `@/types/playlist.types`, `TrackInPlaylist` depuis `@/types/track.types` ;
- dans `PlaylistState`, remplacer `reorderTracks` par `moveTrack: (playlistId: string, trackId: string, afterRank: string | null) => Promise<void>;` et `addTrackLocally` / `removeTrackLocally` par `applyPlaylistEvent: (event: PlaylistUpdatedEvent) => 'applied' | 'ignored' | 'reload';` ;
- au-dessus de `create`, ajouter :

```ts
// Moves from this client go one at a time: each one is sent with the version the
// previous one returned, so a quick second move is never refused against ourselves.
let moveQueue: Promise<unknown> = Promise.resolve();

export const CONFLICT_CODES = ['TRACK_MOVED_CONCURRENTLY', 'TRACK_NOT_IN_PLAYLIST', 'PLAYLIST_REBALANCED'];
```

- ajouter dans le store une fonction interne de mise à jour, et les deux actions :

```ts
	moveTrack: (playlistId, trackId, afterRank) => {
		const run = async () => {
			const playlist = get().currentPlaylist;
			if (playlist?.id !== playlistId) return;
			try {
				const result = await playlistApi.moveTrack(playlistId, trackId, afterRank, playlist.tracksVersion);
				const event: PlaylistUpdatedEvent = {
					playlistId,
					tracksVersion: result.tracksVersion,
					rebalanced: result.rebalanced,
					event: 'track_moved',
					trackId,
					rank: result.rank,
				};
				if (get().applyPlaylistEvent(event) === 'reload') await get().fetchPlaylistById(playlistId);
			} catch (error) {
				if (error instanceof ApiError && CONFLICT_CODES.includes(error.code)) {
					await get().fetchPlaylistById(playlistId);
				}
				throw error;
			}
		};
		const next = moveQueue.then(run, run);
		moveQueue = next.catch(() => undefined);
		return next;
	},

	applyPlaylistEvent: event => {
		const { currentPlaylist, playlistsCache } = get();
		if (currentPlaylist?.id !== event.playlistId) return 'ignored';
		const next = applyEvent(currentPlaylist, event);
		if (next === 'ignore') return 'ignored';
		if (next === 'reload') return 'reload';
		const newCache = new Map(playlistsCache);
		newCache.set(next.id, next);
		set({ currentPlaylist: next, playlistsCache: newCache });
		return 'applied';
	},
```

- `fetchPlaylistById` : après réception, trier les tracks avec `sortByRank` avant de les stocker ;
- `addTrack` et `removeTrack` : garder leur comportement (le remove reste optimiste) mais utiliser les nouveaux retours ; après `playlistApi.addTrack`, passer le résultat à `get().applyPlaylistEvent({ playlistId, tracksVersion: r.tracksVersion, rebalanced: r.rebalanced, event: 'track_added', track: r.track })` et recharger si `'reload'` ; pour le remove, remplacer le rechargement systématique par `applyPlaylistEvent({ ..., event: 'track_removed', trackId })` (la track est déjà retirée localement, l'événement ne fait qu'avancer la version) ;
- supprimer `reorderTracks`, `addTrackLocally`, `removeTrackLocally`.

Si le store dépasse ~400 lignes, sortir `moveTrack` et la file dans `mobile/src/store/playlistMoves.ts`.

- [ ] **Étape 9 : brancher le socket**

Dans `usePlaylistSocket.ts`, remplacer l'interface locale, les deux sélecteurs et le `switch` par :

```ts
import type { PlaylistUpdatedEvent } from '@/types/playlist.types';

export function usePlaylistSocket(playlistId: string) {
	const socket = useSocketStore(state => state.socket);
	const isConnected = useSocketStore(state => state.isConnected);
	const applyPlaylistEvent = usePlaylistStore(state => state.applyPlaylistEvent);
	const fetchPlaylistById = usePlaylistStore(state => state.fetchPlaylistById);

	useEffect(() => {
		if (!socket || !isConnected) return;

		socket.emit('playlist:join', playlistId);

		const handlePlaylistUpdate = (event: PlaylistUpdatedEvent) => {
			if (event.playlistId !== playlistId) return;
			if (applyPlaylistEvent(event) === 'reload') void fetchPlaylistById(playlistId);
		};

		socket.on('playlist:updated', handlePlaylistUpdate);
		return () => {
			socket.off('playlist:updated', handlePlaylistUpdate);
			if (socket.connected) socket.emit('playlist:leave', playlistId);
		};
	}, [socket, isConnected, playlistId, applyPlaylistEvent, fetchPlaylistById]);
}
```

Garder les `console.log` `__DEV__` existants si l'équipe y tient. Dans `PlaylistDetailScreen.tsx`, supprimer `handleReorderUpdate` et appeler `usePlaylistSocket(id)`.

Remplacer `TrackWithPosition` par `TrackInPlaylist` partout (`grep -rn TrackWithPosition mobile/src`), puis le supprimer de `track.types.ts`. `PlaylistWithTracks.tracks` devient `TrackInPlaylist[]`.

- [ ] **Étape 10 : vérifier**

Lancer : `cd mobile && npm run type-check && npm run lint && npm test`
Attendu : tout vert, `playlistSync.test.ts` et `playlistStore.test.ts` compris.

- [ ] **Étape 11 : commit**

```bash
git add mobile/src
git commit -m "feat(mobile): converge playlists on versioned track events"
```

---

### Tâche 8 : déplacer une track depuis l'écran (#91)

Aucun écran ne permet aujourd'hui de déplacer une track. Le plan propose deux boutons « monter » et « descendre » sur chaque ligne, sans nouvelle dépendance. Un vrai glisser-déposer demanderait `react-native-draggable-flatlist` et passerait par une décision à part.

**Fichiers :**
- Modifier : `mobile/src/components/common/SwipeableTrackItem.tsx`
- Modifier : `mobile/src/screens/playlists/PlaylistDetailScreen.tsx`
- Créer : `mobile/src/screens/playlists/moveTarget.ts`, `mobile/src/screens/playlists/moveTarget.test.ts`

**Interfaces :**
- Consomme : `usePlaylistStore().moveTrack` et `CONFLICT_CODES` (tâche 7).
- Produit : `afterRankFor(tracks: TrackInPlaylist[], index: number, direction: 'up' | 'down'): string | null | undefined` (`undefined` = déplacement impossible) ; props `onMoveUp?`, `onMoveDown?` sur `SwipeableTrackItem`.

- [ ] **Étape 1 : écrire le test qui échoue**

`mobile/src/screens/playlists/moveTarget.test.ts` :

```ts
import { afterRankFor } from '@/screens/playlists/moveTarget';
import type { TrackInPlaylist } from '@/types/track.types';

const tracks = ['a', 'h', 'p', 't'].map((rank, i) => ({ id: `${i}`, rank }) as TrackInPlaylist);

describe('afterRankFor', () => {
	it('moves up by dropping after the track two rows above', () => {
		expect(afterRankFor(tracks, 2, 'up')).toBe('a');
	});

	it('moves the second track to the top', () => {
		expect(afterRankFor(tracks, 1, 'up')).toBeNull();
	});

	it('moves down by dropping after the next track', () => {
		expect(afterRankFor(tracks, 1, 'down')).toBe('p');
	});

	it('cannot move past the edges', () => {
		expect(afterRankFor(tracks, 0, 'up')).toBeUndefined();
		expect(afterRankFor(tracks, 3, 'down')).toBeUndefined();
	});
});
```

- [ ] **Étape 2 : vérifier qu'il échoue**

Lancer : `cd mobile && npx jest src/screens/playlists/moveTarget.test.ts`
Attendu : échec, module introuvable.

- [ ] **Étape 3 : écrire `moveTarget.ts`**

```ts
import type { TrackInPlaylist } from '@/types/track.types';

// afterRank for moving the track at index one row up or down: the rank of the
// track it will sit after, null for the top, undefined when it cannot move.
export function afterRankFor(
	tracks: TrackInPlaylist[],
	index: number,
	direction: 'up' | 'down'
): string | null | undefined {
	if (direction === 'up') {
		if (index <= 0) return undefined;
		return index === 1 ? null : tracks[index - 2].rank;
	}
	if (index >= tracks.length - 1) return undefined;
	return tracks[index + 1].rank;
}
```

- [ ] **Étape 4 : vérifier que le test passe**

Lancer : `cd mobile && npx jest src/screens/playlists/moveTarget.test.ts`
Attendu : PASS.

- [ ] **Étape 5 : boutons dans la ligne**

Dans `SwipeableTrackItem.tsx`, ajouter aux props `onMoveUp?: () => void; onMoveDown?: () => void;` et, après la durée, quand `!disabled` :

```tsx
				{!disabled && (onMoveUp || onMoveDown) && (
					<View style={styles.moveButtons}>
						<TouchableOpacity onPress={onMoveUp} disabled={!onMoveUp} accessibilityLabel="Monter la track">
							<Ionicons name="chevron-up" size={22} color={onMoveUp ? theme.colors.text : theme.colors.textSecondary} />
						</TouchableOpacity>
						<TouchableOpacity onPress={onMoveDown} disabled={!onMoveDown} accessibilityLabel="Descendre la track">
							<Ionicons name="chevron-down" size={22} color={onMoveDown ? theme.colors.text : theme.colors.textSecondary} />
						</TouchableOpacity>
					</View>
				)}
```

avec dans `createStyles` : `moveButtons: { marginLeft: theme.spacing.sm, alignItems: 'center' },` (adapter le nom de l'espacement à ceux de `Theme`).

- [ ] **Étape 6 : brancher l'écran**

Dans `PlaylistDetailScreen.tsx` : récupérer `moveTrack` dans `usePlaylistStore()`, importer `afterRankFor` et `CONFLICT_CODES`, et :

```tsx
	const handleMove = async (index: number, direction: 'up' | 'down') => {
		const tracks = currentPlaylist?.tracks ?? [];
		const afterRank = afterRankFor(tracks, index, direction);
		if (afterRank === undefined) return;
		try {
			await moveTrack(id, tracks[index].id, afterRank);
		} catch (error) {
			if (error instanceof ApiError && CONFLICT_CODES.includes(error.code)) {
				showError("Cette track a été modifiée par quelqu'un d'autre");
			} else {
				showError('Impossible de déplacer la track');
			}
		}
	};
```

et dans `renderItem={({ item, index }) => ...}` :

```tsx
						<SwipeableTrackItem
							track={item}
							onDelete={() => handleDeleteTrack(item.id)}
							disabled={!canEdit}
							onMoveUp={index > 0 ? () => handleMove(index, 'up') : undefined}
							onMoveDown={index < currentPlaylist.tracks.length - 1 ? () => handleMove(index, 'down') : undefined}
						/>
```

- [ ] **Étape 7 : vérifier**

Lancer : `cd mobile && npm run type-check && npm run lint && npm test`, puis à la main : `make dev-local`, ouvrir la même playlist sur l'émulateur et sur un second appareil (ou Expo Go) ; monter une track sur l'un, la voir bouger sur l'autre ; déplacer la même track sur les deux presque en même temps : l'un des deux affiche « modifiée par quelqu'un d'autre » et les deux écrans finissent dans le même ordre.

- [ ] **Étape 8 : commit**

```bash
git add mobile/src
git commit -m "feat(mobile): move tracks up and down in a playlist"
```

---

### Tâche 9 : documentation et clôture

**Fichiers :**
- Modifier : `doc/PLAYLIST_CONCURRENCY.md`

- [ ] **Étape 1 : reporter ce que le plan a ajouté**

Dans `doc/PLAYLIST_CONCURRENCY.md` :
- section « Rebalancing » : préciser que le rééquilibrage met à jour `playlists.ranks_rebalanced_at_version`, qu'un move dont `expectedVersion` est plus ancien reçoit `409 PLAYLIST_REBALANCED`, et que la diffusion porte `rebalanced: true` pour faire recharger les clients ; donner le seuil retenu (`rank_max_length()`).
- tableau « Operations » : ajouter `409 PLAYLIST_REBALANCED` aux refus du move, et le chemin `POST /api/playlists/:id/tracks/:trackId/move`.
- section « Broadcast and convergence » : remplacer « the exact payload is defined in the contract (#87) » par la forme de `PlaylistUpdatedPayload` (tâche 1) et ajouter : un événement `rebalanced` déclenche un rechargement.
- section « Tests » : nommer les fichiers `track-ranks.int.test.ts`, `track-operations.int.test.ts`, `playlist-updated.int.test.ts`, `playlistSync.test.ts`, `playlistStore.test.ts`.

- [ ] **Étape 2 : vérification finale**

Lancer : `make test` et `make test-int`, puis `npm run type-check && npm run lint` dans `backend/` et `mobile/`. Ouvrir Swagger UI : `addTrack`, `removeTrack` et `moveTrack` documentent leurs réponses et leurs 409.

- [ ] **Étape 3 : commit**

```bash
git add doc/PLAYLIST_CONCURRENCY.md
git commit -m "docs(playlists): document rebalancing and the final event payload"
```

## Répartition en branches et PR

| Tâches | Issue | Branche |
|---|---|---|
| 1, 2 | #87 | `87-concurrent-edit-contract` |
| 3, 4, 5 | #88 et #89 (la migration supprime `position`, le code doit suivre dans la même PR) | `88-atomic-track-operations` |
| 6 | #90 | `90-versioned-playlist-events` |
| 7, 8 | #91 | `91-mobile-playlist-convergence` |
| 9 | #85 | dans la dernière PR de l'epic |

La PR de #88/#89 mentionne `Closes #88` et `Closes #89`. Elle ne doit être mergée qu'avec la migration 016 appliquée dans le dashboard Supabase, sinon le backend déployé lit une colonne `rank` absente.

import { randomUUID } from 'node:crypto';
import { createClient, type PostgrestError, type SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createSignInClient, supabaseAdmin } from '@/shared/config/supabase.js';

// Concurrent playlist edits (subject IV.2.3) against the local Supabase stack, migration 016.
// Each rpc() is its own HTTP request, so Promise.all runs real concurrent transactions.
// Functions and the new columns are reached untyped: the generated types only know
// them after 016 is applied on the hosted project and `make generate-types` runs.

interface Row {
	track_id: string;
	rank: string;
	added_by: string | null;
	moved_at_version: number;
}

interface MoveResult {
	rank: string;
	tracksVersion: number;
	rebalanced: boolean;
}

interface AddResult extends MoveResult {
	addedAt: string;
}

const db = supabaseAdmin as unknown as SupabaseClient;
const PASSWORD = 'integration-test-password';

let ownerId: string;
let playlistId: string;
const trackIds: string[] = [];

async function rpc<T>(
	fn: string,
	args: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
	const response: { data: unknown; error: PostgrestError | null } = await db.rpc(fn, args);
	const { data, error } = response;
	return { data: (data as T | null) ?? null, error: error?.message ?? null };
}

const add = (trackId: string, addedBy: string | null = ownerId) =>
	rpc<AddResult>('playlist_add_track', {
		p_playlist_id: playlistId,
		p_track_id: trackId,
		p_added_by: addedBy,
	});

const remove = (trackId: string) =>
	rpc<{ tracksVersion: number }>('playlist_remove_track', {
		p_playlist_id: playlistId,
		p_track_id: trackId,
	});

const move = (trackId: string, afterRank: string | null, expectedVersion: number) =>
	rpc<MoveResult>('playlist_move_track', {
		p_playlist_id: playlistId,
		p_track_id: trackId,
		p_after_rank: afterRank,
		p_expected_version: expectedVersion,
	});

async function playlistState(): Promise<{
	tracks_version: number;
	ranks_rebalanced_at_version: number;
}> {
	const { data, error } = await db
		.from('playlists')
		.select('tracks_version, ranks_rebalanced_at_version')
		.eq('id', playlistId)
		.single()
		.overrideTypes<
			{ tracks_version: number; ranks_rebalanced_at_version: number },
			{ merge: false }
		>();
	if (error) throw error;
	return data;
}

async function version(): Promise<number> {
	return (await playlistState()).tracks_version;
}

async function order(): Promise<Row[]> {
	const { data, error } = await db
		.from('playlist_tracks')
		.select('track_id, rank, added_by, moved_at_version')
		.eq('playlist_id', playlistId)
		.order('rank')
		.overrideTypes<Row[], { merge: false }>();
	if (error) throw error;
	return data;
}

const ids = (rows: Row[]) => rows.map(r => r.track_id);

// Each track once, ranks unique and in byte order, added_by never rewritten.
async function expectInvariants(): Promise<Row[]> {
	const rows = await order();
	expect(new Set(ids(rows)).size).toBe(rows.length);
	expect(new Set(rows.map(r => r.rank)).size).toBe(rows.length);
	for (let i = 1; i < rows.length; i++) expect(rows[i - 1].rank < rows[i].rank).toBe(true);
	expect(rows.every(r => r.added_by === ownerId)).toBe(true);
	return rows;
}

beforeAll(async () => {
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email: `int-${randomUUID()}@example.com`,
		password: PASSWORD,
		email_confirm: true,
	});
	if (error) throw error;
	ownerId = data.user.id;
	const { error: profileError } = await supabaseAdmin
		.from('user_profiles')
		.insert({ id: ownerId, username: `int_${ownerId.slice(0, 8)}` });
	if (profileError) throw profileError;

	for (let i = 0; i < 6; i++) {
		const { data: track, error: trackError } = await supabaseAdmin
			.from('tracks')
			.insert({
				track_uri: `https://soundcloud.com/int/${randomUUID()}`,
				title: `T${i}`,
				artist: 'A',
				duration_ms: 1000,
			})
			.select('id')
			.single();
		if (trackError) throw trackError;
		trackIds.push(track.id);
	}
});

beforeEach(async () => {
	const { data, error } = await supabaseAdmin
		.from('playlists')
		.insert({ name: 'int', owner_id: ownerId, visibility: 'private' })
		.select('id')
		.single();
	if (error) throw error;
	playlistId = data.id;
	for (const trackId of trackIds.slice(0, 5)) {
		const added = await add(trackId);
		expect(added.error).toBeNull();
	}
});

afterAll(async () => {
	if (trackIds.length) await supabaseAdmin.from('tracks').delete().in('id', trackIds);
	if (ownerId) await supabaseAdmin.auth.admin.deleteUser(ownerId); // cascades to playlists
});

describe('playlist track operations (migration 016)', () => {
	it('appends in order, sets added_by and bumps the version once per add', async () => {
		const rows = await expectInvariants();
		expect(ids(rows)).toEqual(trackIds.slice(0, 5));
		expect(await version()).toBe(5);
		expect(rows.map(r => r.moved_at_version)).toEqual([1, 2, 3, 4, 5]);
	});

	it('returns the new rank and version from an add', async () => {
		const added = await add(trackIds[5]);
		expect(added.error).toBeNull();
		expect(added.data).toMatchObject({ tracksVersion: 6, rebalanced: false });
		const rows = await expectInvariants();
		expect(rows[rows.length - 1]).toMatchObject({ track_id: trackIds[5], rank: added.data!.rank });
	});

	it('refuses a duplicate add and leaves the version alone', async () => {
		const again = await add(trackIds[0]);
		expect(again.error).toBe('TRACK_DUPLICATE');
		expect(await version()).toBe(5);
		await expectInvariants();
	});

	it('refuses operations on a missing playlist', async () => {
		const missing = await rpc('playlist_remove_track', {
			p_playlist_id: randomUUID(),
			p_track_id: trackIds[0],
		});
		expect(missing.error).toBe('PLAYLIST_NOT_FOUND');
	});

	it('removes a track and bumps the version', async () => {
		const removed = await remove(trackIds[2]);
		expect(removed.error).toBeNull();
		expect(removed.data).toEqual({ tracksVersion: 6 });
		expect(ids(await expectInvariants())).not.toContain(trackIds[2]);

		const again = await remove(trackIds[2]);
		expect(again.error).toBe('TRACK_NOT_IN_PLAYLIST');
		expect(await version()).toBe(6);
	});

	it('moves to the top and to the bottom', async () => {
		const rows = await order();
		const last = rows[rows.length - 1];
		const top = await move(last.track_id, null, await version());
		expect(top.error).toBeNull();
		expect(top.data!.tracksVersion).toBe(6);
		expect((await order())[0].track_id).toBe(last.track_id);

		const now = await order();
		const bottom = await move(now[0].track_id, now[now.length - 1].rank, await version());
		expect(bottom.error).toBeNull();
		expect(bottom.data!.tracksVersion).toBe(7);
		const after = await expectInvariants();
		expect(after[after.length - 1].track_id).toBe(now[0].track_id);
	});

	it('applies concurrent moves of different tracks, each where its author dropped it', async () => {
		const [a, b, , d, e] = await order();
		const v = await version();
		const results = await Promise.all([move(e.track_id, a.rank, v), move(b.track_id, d.rank, v)]);
		expect(results.map(r => r.error)).toEqual([null, null]);
		const now = ids(await expectInvariants());
		expect(now.indexOf(e.track_id)).toBe(now.indexOf(a.track_id) + 1);
		expect(now.indexOf(b.track_id)).toBe(now.indexOf(d.track_id) + 1);
		expect(await version()).toBe(v + 2);
	});

	it('lets exactly one of N concurrent moves of the same track win', async () => {
		const rows = await order();
		const moved = rows[4];
		const v = await version();
		const results = await Promise.all(
			[null, rows[0].rank, rows[1].rank, rows[2].rank, rows[3].rank].map(after =>
				move(moved.track_id, after, v)
			)
		);
		const errors = results.map(r => r.error);
		expect(errors.filter(e => e === null)).toHaveLength(1);
		expect(errors.filter(e => e === 'TRACK_MOVED_CONCURRENTLY')).toHaveLength(4);
		expect(await version()).toBe(v + 1);
		await expectInvariants();
	});

	it('refuses a move of a track removed concurrently and never brings it back', async () => {
		const [a, b] = await order();
		const v = await version();
		const [removed, moved] = await Promise.all([remove(b.track_id), move(b.track_id, a.rank, v)]);
		expect(removed.error).toBeNull();
		if (moved.error) expect(moved.error).toBe('TRACK_NOT_IN_PLAYLIST');
		expect(ids(await expectInvariants())).not.toContain(b.track_id);
	});

	it('keeps added_by and added_at when a track moves', async () => {
		const before = await supabaseAdmin
			.from('playlist_tracks')
			.select('track_id, added_at')
			.eq('playlist_id', playlistId);
		const [a, , , , e] = await order();
		const moved = await move(e.track_id, a.rank, await version());
		expect(moved.error).toBeNull();
		await expectInvariants();
		const after = await supabaseAdmin
			.from('playlist_tracks')
			.select('track_id, added_at')
			.eq('playlist_id', playlistId);
		const sort = (rows: { track_id: string }[] | null) =>
			[...(rows ?? [])].sort((x, y) => x.track_id.localeCompare(y.track_id));
		expect(sort(after.data)).toEqual(sort(before.data));
	});

	it('keeps every invariant under a burst of concurrent moves, adds and removes', async () => {
		const v = await version();
		const rows = await order();
		const results = await Promise.all([
			...rows.map((row, i) => move(row.track_id, rows[(i + 2) % rows.length].rank, v)),
			add(trackIds[5]),
			remove(rows[1].track_id),
		]);
		// Every operation applies, except the move of the removed track if the remove ran first.
		results.forEach((result, i) => {
			if (i === 1 && result.error !== null) expect(result.error).toBe('TRACK_NOT_IN_PLAYLIST');
			else expect(result.error).toBeNull();
		});
		const now = ids(await expectInvariants());
		expect(now).toHaveLength(5);
		expect(now).toContain(trackIds[5]);
		expect(now).not.toContain(rows[1].track_id);
	});

	it('rebalances long ranks, keeps the order, and refuses moves sent with the old ranks', async () => {
		const [a, ...others] = await order();
		let v = await version();
		let rebalanced = false;
		let moves = 0;
		// Drop the other tracks right after A in turn: each lands between A and the
		// previous one, so the gap halves and ranks lengthen until a rebalance.
		while (moves < 1000 && !rebalanced) {
			const trackId = others[moves % others.length].track_id;
			const expected = [
				a.track_id,
				trackId,
				...ids(await order()).filter(id => id !== a.track_id && id !== trackId),
			];
			const moved = await move(trackId, a.rank, v);
			moves++;
			expect(moved.error).toBeNull();
			v = moved.data!.tracksVersion;
			rebalanced = moved.data!.rebalanced;
			if (rebalanced) {
				const rows = await expectInvariants();
				expect(ids(rows)).toEqual(expected);
				expect(rows.find(r => r.track_id === trackId)!.rank).toBe(moved.data!.rank);
			}
		}
		expect(rebalanced).toBe(true);
		const rows = await expectInvariants();
		expect(Math.max(...rows.map(r => r.rank.length))).toBeLessThanOrEqual(64);
		expect(await playlistState()).toEqual({ tracks_version: v, ranks_rebalanced_at_version: v });

		// A was never moved, so only the rebalance can refuse this stale move.
		const stale = await move(a.track_id, a.rank, v - 1);
		expect(stale.error).toBe('PLAYLIST_REBALANCED');
		expect(await version()).toBe(v);

		const fresh = await move(a.track_id, rows[rows.length - 1].rank, v);
		expect(fresh.error).toBeNull();
		expect(fresh.data!.rebalanced).toBe(false);
	}, 60_000);

	it('refuses every 016 function to the anon key with a permission error', async () => {
		const anon = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
			auth: { autoRefreshToken: false, persistSession: false },
		});
		const calls: [string, Record<string, unknown>][] = [
			['rank_between', { p_a: null, p_b: null }],
			['rank_after', { p_a: null }],
			['rank_spaced', { p_index: 1, p_count: 1 }],
			['rank_max_length', {}],
			['playlist_lock', { p_playlist_id: playlistId }],
			['playlist_rebalance', { p_playlist_id: playlistId, p_version: 99 }],
			['playlist_add_track', { p_playlist_id: playlistId, p_track_id: trackIds[5] }],
			['playlist_remove_track', { p_playlist_id: playlistId, p_track_id: trackIds[0] }],
			[
				'playlist_move_track',
				{ p_playlist_id: playlistId, p_track_id: trackIds[0], p_expected_version: 5 },
			],
		];
		for (const [fn, args] of calls) {
			const { error } = await anon.rpc(fn, args);
			expect(error, fn).not.toBeNull();
			expect(error!.code === '42501' || /permission denied/i.test(error!.message), fn).toBe(true);
		}
		expect(await order()).toHaveLength(5);
		expect(await playlistState()).toEqual({ tracks_version: 5, ranks_rebalanced_at_version: 0 });
	});

	it('refuses direct inserts and deletes on playlist_tracks to the playlist owner', async () => {
		const { data: owner } = await supabaseAdmin.auth.admin.getUserById(ownerId);
		const user = createSignInClient() as unknown as SupabaseClient;
		const { error: signInError } = await user.auth.signInWithPassword({
			email: owner.user!.email!,
			password: PASSWORD,
		});
		expect(signInError).toBeNull();

		const { error: insertError } = await user
			.from('playlist_tracks')
			.insert({ playlist_id: playlistId, track_id: trackIds[5], rank: 'zz', added_by: ownerId });
		expect(insertError).not.toBeNull();

		// RLS hides rows from a delete without a policy instead of raising.
		await user.from('playlist_tracks').delete().eq('playlist_id', playlistId);

		expect(ids(await order())).toEqual(trackIds.slice(0, 5));
		expect(await version()).toBe(5);
	});
});

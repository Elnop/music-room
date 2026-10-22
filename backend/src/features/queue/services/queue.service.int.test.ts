import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { QueueService } from '@/features/queue/services/queue.service.js';
import { playPlaylistRpc } from '@/features/queue/utils/queue-rpc.js';
import * as playlists from '@/features/playlists/services/playlist.service.js';
import * as playlistTracks from '@/features/playlists/services/playlist-track.service.js';
import type { QueueState } from '@/features/queue/queue.types.js';

// The play queue of migrations 021 and 022 against the local Supabase stack
// (#273, #277): every row of the plans' I/O matrices, block detachment,
// history trim and rank rebalance. No Socket.io server runs here: notifyQueueUpdate is a no-op.

const URI_PREFIX = `https://soundcloud.com/int-queue/${randomUUID()}`;
const queue = new QueueService();
const users: string[] = [];
let userId: string;
let trackCount = 0;

async function createUser(): Promise<string> {
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email: `int-${randomUUID()}@example.com`,
		password: 'integration-test-password',
		email_confirm: true,
	});
	if (error) throw error;
	users.push(data.user.id);
	return data.user.id;
}

const dto = () => {
	trackCount += 1;
	return {
		trackUri: `${URI_PREFIX}/${trackCount}`,
		title: `T${trackCount}`,
		artist: 'A',
		durationMs: 1000,
	};
};

/** Adds n tracks and returns the item ids in queue order. */
async function addItems(n: number, user = userId): Promise<string[]> {
	let state: QueueState = { ownerId: user, version: 0, currentItemId: null, items: [] };
	for (let i = 0; i < n; i++) state = await queue.addItem(user, user, dto());
	return state.items.map(item => item.id);
}

const ids = (state: QueueState) => state.items.map(item => item.id);

// Ranks unique and in byte order, matching the item order.
function expectRanked(state: QueueState) {
	const ranks = state.items.map(item => item.rank);
	expect(new Set(ranks).size).toBe(ranks.length);
	for (let i = 1; i < ranks.length; i++) expect(ranks[i - 1] < ranks[i]).toBe(true);
}

async function createProfile(id: string) {
	const { error } = await supabaseAdmin
		.from('user_profiles')
		.insert({ id, username: `int_${id.slice(0, 8)}` });
	if (error) throw error;
}

async function seedBlock(itemIds: string[]): Promise<string> {
	const blockId = randomUUID();
	const { error } = await supabaseAdmin
		.from('play_queue_items')
		.update({ block_id: blockId })
		.in('id', itemIds);
	if (error) throw error;
	return blockId;
}

async function setRank(itemId: string, rank: string) {
	const { error } = await supabaseAdmin.from('play_queue_items').update({ rank }).eq('id', itemId);
	if (error) throw error;
}

const blockFlags = (state: QueueState, itemIds: string[]) =>
	itemIds.map(id => state.items.find(item => item.id === id)?.blockDetached);

beforeAll(async () => {
	await createUser(); // warms the auth admin client
});

beforeEach(async () => {
	userId = await createUser();
});

afterAll(async () => {
	for (const id of users) await supabaseAdmin.auth.admin.deleteUser(id); // cascades to queues
	await supabaseAdmin.from('tracks').delete().like('track_uri', `${URI_PREFIX}/%`);
});

describe('read and add', () => {
	it('returns an empty queue to a user who never queued anything', async () => {
		expect(await queue.getQueue(userId, userId)).toEqual({
			ownerId: userId,
			version: 0,
			currentItemId: null,
			items: [],
		});
	});

	it('appends after the last rank and keeps the current item', async () => {
		const [first] = await addItems(2);
		await queue.playItem(userId, userId, first);
		const track = dto();
		const state = await queue.addItem(userId, userId, track);

		expect(state.currentItemId).toBe(first);
		expect(state.items).toHaveLength(3);
		expect(state.items[2]).toMatchObject({
			track: { trackUri: track.trackUri, title: track.title, album: null, albumArt: null },
			sourcePlaylistId: null,
			blockId: null,
			blockDetached: false,
		});
		expectRanked(state);
		expect(await queue.getQueue(userId, userId)).toEqual(state);
	});

	it('reuses the tracks row of a known track_uri', async () => {
		const track = dto();
		await queue.addItem(userId, userId, track);
		const state = await queue.addItem(userId, userId, { ...track, title: 'Renamed' });
		expect(state.items.map(item => item.track.title)).toEqual(['Renamed', 'Renamed']);
		const { count } = await supabaseAdmin
			.from('tracks')
			.select('id', { count: 'exact', head: true })
			.eq('track_uri', track.trackUri);
		expect(count).toBe(1);
	});

	it('serializes concurrent adds of one user', async () => {
		await Promise.all(Array.from({ length: 8 }, () => queue.addItem(userId, userId, dto())));
		const state = await queue.getQueue(userId, userId);
		expect(state.items).toHaveLength(8);
		expectRanked(state);
	});

	it('stores no stream URL', async () => {
		await addItems(2);
		const withPreview = { ...dto(), previewUrl: 'https://api.soundcloud.com/tracks/1/stream' };
		await queue.addItem(userId, userId, withPreview);
		const { data: track, error: trackError } = await supabaseAdmin
			.from('tracks')
			.select('preview_url')
			.eq('track_uri', withPreview.trackUri)
			.single();
		if (trackError) throw trackError;
		expect(track.preview_url).toBeNull();

		const { data, error } = await supabaseAdmin
			.from('play_queue_items')
			.select('*, tracks(*)')
			.eq('user_id', userId);
		if (error) throw error;
		expect(JSON.stringify(data)).not.toMatch(/stream|api\.soundcloud\.com|sndcdn\.com\/.*\.mp3/);
	});
});

describe('add next (#316)', () => {
	it('places the new item right after the current one', async () => {
		const [a, b, c] = await addItems(3);
		await queue.playItem(userId, userId, a);
		const track = dto();
		const state = await queue.addItem(userId, userId, track, { next: true });

		expect(state.currentItemId).toBe(a);
		expect(ids(state)[0]).toBe(a);
		expect(state.items[1].track.trackUri).toBe(track.trackUri);
		expect(ids(state).slice(2)).toEqual([b, c]);
		expectRanked(state);
		expect(await queue.getQueue(userId, userId)).toEqual(state);
	});

	it('places the new item at the top when nothing is current', async () => {
		const [a, b] = await addItems(2);
		const track = dto();
		const state = await queue.addItem(userId, userId, track, { next: true });

		expect(state.currentItemId).toBeNull();
		expect(state.items[0].track.trackUri).toBe(track.trackUri);
		expect(ids(state).slice(1)).toEqual([a, b]);
		expectRanked(state);
	});

	it('adds a track already queued as a second item', async () => {
		const [a] = await addItems(2);
		await queue.playItem(userId, userId, a);
		const track = dto();
		const state = await queue.addItem(userId, userId, track, { next: true });
		const again = await queue.addItem(userId, userId, track, { next: true });
		expect(again.items).toHaveLength(4);
		expect(again.items[1].track.trackUri).toBe(state.items[1].track.trackUri);
		expect(again.items[1].id).not.toBe(state.items[1].id);
	});
});

describe('remove', () => {
	it('removes an upcoming or a history item', async () => {
		const [a, b, c, d] = await addItems(4);
		await queue.playItem(userId, userId, b);
		await queue.removeItem(userId, userId, a);
		const state = await queue.removeItem(userId, userId, d);
		expect(ids(state)).toEqual([b, c]);
		expect(state.currentItemId).toBe(b);
	});

	it('moves current to the next item when the current one is removed', async () => {
		const [a, b, c] = await addItems(3);
		await queue.playItem(userId, userId, b);
		const state = await queue.removeItem(userId, userId, b);
		expect(state).toMatchObject({ currentItemId: c });
		expect(ids(state)).toEqual([a, c]);
	});

	it('empties the queue when the last current item is removed', async () => {
		const [, , c] = await addItems(3);
		await queue.playItem(userId, userId, c);
		expect(await queue.removeItem(userId, userId, c)).toMatchObject({
			currentItemId: null,
			items: [],
		});
	});

	it('keeps 50 history items when the removed current item is followed', async () => {
		const all = await addItems(52);
		await queue.playItem(userId, userId, all[50]); // 50 items of history
		const state = await queue.removeItem(userId, userId, all[50]);
		expect(state.currentItemId).toBe(all[51]);
		expect(ids(state)).toEqual([...all.slice(0, 50), all[51]]);
	});

	it('detaches the whole block of a removed item', async () => {
		const [a, b, c, d] = await addItems(4);
		await seedBlock([a, b, c]);
		const state = await queue.removeItem(userId, userId, b);
		expect(blockFlags(state, [a, c, d])).toEqual([true, true, false]);
	});

	it("answers 404 for an unknown item or another user's item, and changes nothing", async () => {
		const other = await createUser();
		const [theirs] = await addItems(1, other);
		await addItems(1);
		const before = await queue.getQueue(userId, userId);

		await expect(queue.removeItem(userId, userId, randomUUID())).rejects.toMatchObject({
			statusCode: 404,
			code: 'QUEUE_ITEM_NOT_FOUND',
		});
		await expect(queue.removeItem(userId, userId, theirs)).rejects.toMatchObject({
			statusCode: 404,
			code: 'QUEUE_ITEM_NOT_FOUND',
		});
		expect(await queue.getQueue(userId, userId)).toEqual(before);
		expect(ids(await queue.getQueue(other, other))).toEqual([theirs]);
	});
});

describe('move', () => {
	it('places the item right after the current one when afterItemId is null', async () => {
		const [a, b, c, d] = await addItems(4);
		await queue.playItem(userId, userId, a);
		const state = await queue.moveItem(userId, userId, d, null);
		expect(ids(state)).toEqual([a, d, b, c]);
		expectRanked(state);
	});

	it('places the item at the top when nothing is current', async () => {
		const [a, b, c] = await addItems(3);
		expect(ids(await queue.moveItem(userId, userId, c, null))).toEqual([c, a, b]);
	});

	it('places the item between afterItemId and the next item', async () => {
		const [a, b, c, d] = await addItems(4);
		await queue.playItem(userId, userId, a);
		expect(ids(await queue.moveItem(userId, userId, b, c))).toEqual([a, c, b, d]);
	});

	it('detaches the whole block of a moved item', async () => {
		const [a, b, c, d] = await addItems(4);
		await seedBlock([b, c]);
		const state = await queue.moveItem(userId, userId, b, d);
		expect(blockFlags(state, [a, b, c, d])).toEqual([false, true, true, false]);
	});

	it('refuses to move the current item, a history item, or after one of them', async () => {
		const [a, b, c, d] = await addItems(4);
		await queue.playItem(userId, userId, b);
		const notUpcoming = { statusCode: 409, code: 'QUEUE_ITEM_NOT_UPCOMING' };
		await expect(queue.moveItem(userId, userId, b, null)).rejects.toMatchObject(notUpcoming);
		await expect(queue.moveItem(userId, userId, a, null)).rejects.toMatchObject(notUpcoming);
		await expect(queue.moveItem(userId, userId, d, b)).rejects.toMatchObject(notUpcoming);
		await expect(queue.moveItem(userId, userId, d, a)).rejects.toMatchObject(notUpcoming);
		expect(ids(await queue.getQueue(userId, userId))).toEqual([a, b, c, d]);
	});

	it("answers 404 for an unknown item or afterItemId, or another user's", async () => {
		const other = await createUser();
		const [theirs] = await addItems(1, other);
		const [a, b] = await addItems(2);
		const notFound = { statusCode: 404, code: 'QUEUE_ITEM_NOT_FOUND' };
		await expect(queue.moveItem(userId, userId, randomUUID(), null)).rejects.toMatchObject(
			notFound
		);
		await expect(queue.moveItem(userId, userId, theirs, null)).rejects.toMatchObject(notFound);
		await expect(queue.moveItem(userId, userId, a, theirs)).rejects.toMatchObject(notFound);
		expect(ids(await queue.getQueue(userId, userId))).toEqual([a, b]);
	});
});

describe('play, next and previous', () => {
	it('plays any item of the caller', async () => {
		const [a, b, c] = await addItems(3);
		expect((await queue.playItem(userId, userId, c)).currentItemId).toBe(c);
		expect((await queue.playItem(userId, userId, a)).currentItemId).toBe(a);
		expect(ids(await queue.getQueue(userId, userId))).toEqual([a, b, c]);
	});

	it("answers 404 to play an unknown item or another user's", async () => {
		const other = await createUser();
		const [theirs] = await addItems(1, other);
		await addItems(1);
		const notFound = { statusCode: 404, code: 'QUEUE_ITEM_NOT_FOUND' };
		await expect(queue.playItem(userId, userId, randomUUID())).rejects.toMatchObject(notFound);
		await expect(queue.playItem(userId, userId, theirs)).rejects.toMatchObject(notFound);
		expect((await queue.getQueue(userId, userId)).currentItemId).toBeNull();
		expect((await queue.getQueue(other, other)).currentItemId).toBeNull();
	});

	it('steps to the first item from no current, then forward, then back', async () => {
		const [a, b] = await addItems(2);
		expect((await queue.step(userId, userId, 'next')).currentItemId).toBe(a);
		expect((await queue.step(userId, userId, 'next')).currentItemId).toBe(b);
		expect((await queue.step(userId, userId, 'previous')).currentItemId).toBe(a);
	});

	it('answers 409 QUEUE_END with no next item', async () => {
		const queueEnd = { statusCode: 409, code: 'QUEUE_END' };
		await expect(queue.step(userId, userId, 'next')).rejects.toMatchObject(queueEnd);
		const [, b] = await addItems(2);
		await queue.playItem(userId, userId, b);
		await expect(queue.step(userId, userId, 'next')).rejects.toMatchObject(queueEnd);
	});

	it('answers 409 QUEUE_START with no previous item or no current', async () => {
		const queueStart = { statusCode: 409, code: 'QUEUE_START' };
		const [a] = await addItems(2);
		await expect(queue.step(userId, userId, 'previous')).rejects.toMatchObject(queueStart);
		await queue.playItem(userId, userId, a);
		await expect(queue.step(userId, userId, 'previous')).rejects.toMatchObject(queueStart);
	});

	it('keeps only the 50 most recent history items after a step forward', async () => {
		const all = await addItems(53);
		await queue.playItem(userId, userId, all[50]); // 50 items of history, none dropped
		expect((await queue.getQueue(userId, userId)).items).toHaveLength(53);

		const state = await queue.step(userId, userId, 'next');
		expect(state.currentItemId).toBe(all[51]);
		expect(ids(state)).toEqual(all.slice(1));
	});
});

describe('rank rebalance', () => {
	const longRank = 'V' + 'z'.repeat(63); // 64 characters: rank_max_length()

	it('respaces the ranks when an add makes a key too long', async () => {
		const [a, b] = await addItems(2);
		await setRank(b, longRank);
		const state = await queue.addItem(userId, userId, dto());
		expect(ids(state).slice(0, 2)).toEqual([a, b]);
		expect(state.items.every(item => item.rank.length <= 2)).toBe(true);
		expectRanked(state);
	});

	it('respaces the ranks when a move makes a key too long', async () => {
		const [a, b, c] = await addItems(3);
		await setRank(a, '1');
		await setRank(b, '1' + '0'.repeat(62) + '1'); // right above a: no room at 64 characters
		const state = await queue.moveItem(userId, userId, c, a);
		expect(ids(state)).toEqual([a, c, b]);
		expect(state.items.every(item => item.rank.length <= 2)).toBe(true);
		expectRanked(state);
	});
});

describe('play a playlist', () => {
	let ownerId: string;

	beforeEach(async () => {
		ownerId = await createUser();
		await createProfile(ownerId);
	});

	/** A playlist of n tracks added through the playlist services; returns its id and track URIs. */
	async function createPlaylist(
		n: number,
		visibility: 'public' | 'private' = 'public'
	): Promise<{ id: string; uris: string[] }> {
		const { id } = await playlists.createPlaylist(ownerId, { name: 'int-play', visibility });
		const uris: string[] = [];
		for (let i = 0; i < n; i++) {
			const track = dto();
			await playlistTracks.addTrack(id, ownerId, track);
			uris.push(track.trackUri);
		}
		return { id, uris };
	}

	const uris = (state: QueueState) => state.items.map(item => item.track.trackUri);

	function expectBlock(state: QueueState, playlistId: string, from: number, count: number) {
		const block = state.items.slice(from, from + count);
		expect(new Set(block.map(item => item.blockId)).size).toBe(1);
		expect(block[0].blockId).not.toBeNull();
		for (const item of block) {
			expect(item).toMatchObject({ sourcePlaylistId: playlistId, blockDetached: false });
		}
		return block[0].blockId;
	}

	it('fills an empty queue with the playlist, in order, and plays its first track', async () => {
		const playlist = await createPlaylist(3);
		const state = await queue.playPlaylist(userId, userId, playlist.id);

		expect(uris(state)).toEqual(playlist.uris);
		expectBlock(state, playlist.id, 0, 3);
		expect(state.currentItemId).toBe(state.items[0].id);
		expectRanked(state);
		expect(await queue.getQueue(userId, userId)).toEqual(state);
	});

	it('places the block after the current item and before the upcoming ones', async () => {
		const [x, y, z] = await addItems(3);
		await queue.playItem(userId, userId, x);
		const playlist = await createPlaylist(2);
		const state = await queue.playPlaylist(userId, userId, playlist.id);

		expect(ids(state)[0]).toBe(x);
		expect(ids(state).slice(3)).toEqual([y, z]);
		expect(uris(state).slice(1, 3)).toEqual(playlist.uris);
		expectBlock(state, playlist.id, 1, 2);
		expect(state.currentItemId).toBe(state.items[1].id);
		expectRanked(state);
	});

	it('puts the block first when nothing is current', async () => {
		const [y, z] = await addItems(2);
		const playlist = await createPlaylist(2);
		const state = await queue.playPlaylist(userId, userId, playlist.id);

		expect(uris(state).slice(0, 2)).toEqual(playlist.uris);
		expect(ids(state).slice(2)).toEqual([y, z]);
		expect(state.currentItemId).toBe(state.items[0].id);
		expectRanked(state);
	});

	it('adds a second, separate block when the same playlist is played again', async () => {
		const playlist = await createPlaylist(2);
		const first = await queue.playPlaylist(userId, userId, playlist.id);
		const state = await queue.playPlaylist(userId, userId, playlist.id);

		expect(ids(state).slice(0, 1)).toEqual(ids(first).slice(0, 1));
		expect(uris(state)).toEqual([playlist.uris[0], ...playlist.uris, playlist.uris[1]]);
		const firstBlock = expectBlock(first, playlist.id, 0, 2);
		const secondBlock = expectBlock(state, playlist.id, 1, 2);
		expect(secondBlock).not.toBe(firstBlock);
		expect(state.currentItemId).toBe(state.items[1].id);
		expectRanked(state);
	});

	it('answers 409 PLAYLIST_EMPTY for an empty playlist and changes nothing', async () => {
		const [x] = await addItems(2);
		await queue.playItem(userId, userId, x);
		const before = await queue.getQueue(userId, userId);
		const playlist = await createPlaylist(0);

		await expect(queue.playPlaylist(userId, userId, playlist.id)).rejects.toMatchObject({
			statusCode: 409,
			code: 'PLAYLIST_EMPTY',
		});
		expect(await queue.getQueue(userId, userId)).toEqual(before);
	});

	it('answers 403 PLAYLIST_ACCESS_DENIED for a private playlist the caller cannot view', async () => {
		await addItems(1);
		const before = await queue.getQueue(userId, userId);
		const playlist = await createPlaylist(1, 'private');

		await expect(queue.playPlaylist(userId, userId, playlist.id)).rejects.toMatchObject({
			statusCode: 403,
			code: 'PLAYLIST_ACCESS_DENIED',
		});
		expect(await queue.getQueue(userId, userId)).toEqual(before);

		// The owner can play their own private playlist.
		expect(uris(await queue.playPlaylist(ownerId, ownerId, playlist.id))).toEqual(playlist.uris);
	});

	it('answers 404 when the playlist is deleted after the permission check', async () => {
		await addItems(1);
		const before = await queue.getQueue(userId, userId);
		const playlist = await createPlaylist(1);
		await supabaseAdmin.from('playlists').delete().eq('id', playlist.id);

		await expect(playPlaylistRpc(userId, playlist.id)).rejects.toMatchObject({
			statusCode: 404,
			code: 'PLAYLIST_NOT_FOUND',
		});
		expect(await queue.getQueue(userId, userId)).toEqual(before);
	});

	it('answers 404 PLAYLIST_NOT_FOUND for an unknown playlist', async () => {
		await addItems(1);
		const before = await queue.getQueue(userId, userId);
		await expect(queue.playPlaylist(userId, userId, randomUUID())).rejects.toMatchObject({
			statusCode: 404,
			code: 'PLAYLIST_NOT_FOUND',
		});
		expect(await queue.getQueue(userId, userId)).toEqual(before);
	});

	it('respaces the ranks when the block makes a key too long, keeping the order', async () => {
		const [x, y] = await addItems(2);
		await setRank(x, '1');
		await setRank(y, '1' + '0'.repeat(62) + '1'); // right above x: no room at 64 characters
		await queue.playItem(userId, userId, x);
		const playlist = await createPlaylist(3);
		const state = await queue.playPlaylist(userId, userId, playlist.id);

		expect(ids(state)[0]).toBe(x);
		expect(uris(state).slice(1, 4)).toEqual(playlist.uris);
		expect(ids(state)[4]).toBe(y);
		expect(state.items.every(item => item.rank.length <= 2)).toBe(true);
		expectRanked(state);
	});

	it('keeps the order of a long playlist squeezed between two items', async () => {
		const [x, y] = await addItems(2);
		await queue.playItem(userId, userId, x);
		const { id } = await playlists.createPlaylist(ownerId, { name: 'int-long' });
		// 450 tracks seeded directly: rank_between halves the gap at each one,
		// so a key passes rank_max_length() and the queue is respaced mid-block.
		const count = 450;
		const tracks = Array.from({ length: count }, () => dto());
		const { data: rows, error } = await supabaseAdmin
			.from('tracks')
			.insert(tracks.map(toRow))
			.select('id, track_uri');
		if (error) throw error;
		const trackIdOf = new Map(rows.map(row => [row.track_uri, row.id]));
		const digits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
		const rankOf = (i: number) => digits[1 + Math.floor(i / 61)] + digits[1 + (i % 61)];
		const { error: linkError } = await supabaseAdmin.from('playlist_tracks').insert(
			tracks.map((track, i) => ({
				playlist_id: id,
				track_id: trackIdOf.get(track.trackUri) ?? '',
				rank: rankOf(i),
			}))
		);
		if (linkError) throw linkError;

		const state = await queue.playPlaylist(userId, userId, id);
		expect(state.items).toHaveLength(count + 2);
		expect(ids(state)[0]).toBe(x);
		expect(ids(state)[count + 1]).toBe(y);
		expect(uris(state).slice(1, count + 1)).toEqual(tracks.map(track => track.trackUri));
		expect(state.items.every(item => item.rank.length <= 64)).toBe(true);
		expectRanked(state);
	});
});

const toRow = (track: ReturnType<typeof dto>) => ({
	track_uri: track.trackUri,
	title: track.title,
	artist: track.artist,
	duration_ms: track.durationMs,
});

describe('version', () => {
	it('starts at 0 without a queue and grows by one with each add', async () => {
		expect((await queue.getQueue(userId, userId)).version).toBe(0);
		expect((await queue.addItem(userId, userId, dto())).version).toBe(1);
		expect((await queue.addItem(userId, userId, dto())).version).toBe(2);
	});

	it('grows with every mutation', async () => {
		const [a, b, c] = await addItems(3);
		let version = (await queue.getQueue(userId, userId)).version;
		const steps: Array<() => Promise<QueueState>> = [
			() => queue.playItem(userId, userId, a),
			() => queue.step(userId, userId, 'next'),
			() => queue.step(userId, userId, 'previous'),
			() => queue.moveItem(userId, userId, c, null),
			() => queue.removeItem(userId, userId, b),
		];
		for (const step of steps) {
			const next = (await step()).version;
			expect(next).toBeGreaterThan(version);
			version = next;
		}
	});

	it('keeps the version when a mutation is refused', async () => {
		const [a] = await addItems(1);
		const before = await queue.getQueue(userId, userId);
		await expect(queue.step(userId, userId, 'previous')).rejects.toMatchObject({
			code: 'QUEUE_START',
		});
		await expect(queue.removeItem(userId, userId, randomUUID())).rejects.toMatchObject({
			statusCode: 404,
		});
		await expect(queue.moveItem(userId, userId, a, randomUUID())).rejects.toMatchObject({
			statusCode: 404,
			code: 'QUEUE_ITEM_NOT_FOUND',
		});
		expect(await queue.getQueue(userId, userId)).toEqual(before);
	});

	it('gives each of two concurrent adds its own version', async () => {
		const [first, second] = await Promise.all([
			queue.addItem(userId, userId, dto()),
			queue.addItem(userId, userId, dto()),
		]);
		expect(new Set([first.version, second.version]).size).toBe(2);
		const last = first.version > second.version ? first : second;
		expect(last.items).toHaveLength(2);
	});

	it('carries the owner id', async () => {
		expect((await queue.addItem(userId, userId, dto())).ownerId).toBe(userId);
	});
});

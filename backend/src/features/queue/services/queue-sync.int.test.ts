import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { logger } from '@/shared/utils/logger.js';
import type { QueueState } from '@/features/queue/queue.types.js';

// Playlist -> queue sync of migration 023 (#278) against the local Supabase
// stack: every row of the plan's I/O matrix. Playlist changes go through
// playlist-track.service, as the API does; queue:updated is captured on a mock.

const { notifyQueueUpdate } = vi.hoisted(() => ({ notifyQueueUpdate: vi.fn() }));
vi.mock('@/realtime/index.js', () => ({
	realtime: { notifyQueueUpdate, notifyPlaylistUpdate: vi.fn(), revalidatePlaylistRoom: vi.fn() },
}));

const { QueueService } = await import('@/features/queue/services/queue.service.js');
const playlists = await import('@/features/playlists/services/playlist.service.js');
const playlistTracks = await import('@/features/playlists/services/playlist-track.service.js');

const URI_PREFIX = `https://soundcloud.com/int-queue-sync/${randomUUID()}`;
const queue = new QueueService();
const users: string[] = [];
let trackCount = 0;
let ownerId: string;
let userId: string;

async function createUser(): Promise<string> {
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email: `int-${randomUUID()}@example.com`,
		password: 'integration-test-password',
		email_confirm: true,
	});
	if (error) throw error;
	users.push(data.user.id);
	const { error: profileError } = await supabaseAdmin
		.from('user_profiles')
		.insert({ id: data.user.id, username: `int_${data.user.id.slice(0, 8)}` });
	if (profileError) throw profileError;
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

interface Track {
	id: string;
	uri: string;
}

async function addTrack(playlistId: string, track = dto()): Promise<Track> {
	const { track: added } = await playlistTracks.addTrack(playlistId, ownerId, track);
	return { id: added.id, uri: track.trackUri };
}

/** A public playlist of n tracks owned by ownerId. */
async function createPlaylist(n: number): Promise<{ id: string; tracks: Track[] }> {
	const { id } = await playlists.createPlaylist(ownerId, {
		name: 'int-sync',
		visibility: 'public',
	});
	const tracks: Track[] = [];
	for (let i = 0; i < n; i++) tracks.push(await addTrack(id));
	return { id, tracks };
}

/** Moves a track of the playlist right after another one (null = top), as the owner. */
async function moveTrack(playlistId: string, trackId: string, afterTrackId: string | null) {
	const { data: playlist, error } = await supabaseAdmin
		.from('playlists')
		.select('tracks_version')
		.eq('id', playlistId)
		.single();
	if (error) throw error;
	let afterRank: string | null = null;
	if (afterTrackId !== null) {
		const { data, error: rankError } = await supabaseAdmin
			.from('playlist_tracks')
			.select('rank')
			.eq('playlist_id', playlistId)
			.eq('track_id', afterTrackId)
			.single();
		if (rankError) throw rankError;
		afterRank = data.rank;
	}
	await playlistTracks.moveTrack(playlistId, ownerId, trackId, {
		afterRank,
		expectedVersion: playlist.tracks_version,
	});
}

async function setRank(itemId: string, rank: string) {
	const { error } = await supabaseAdmin.from('play_queue_items').update({ rank }).eq('id', itemId);
	if (error) throw error;
}

/** Track URIs of each block of the queue, in queue order. */
function blocksOf(state: QueueState): string[][] {
	const blocks = new Map<string, string[]>();
	for (const item of state.items) {
		if (item.blockId === null) continue;
		blocks.set(item.blockId, [...(blocks.get(item.blockId) ?? []), item.track.trackUri]);
	}
	return [...blocks.values()];
}

const uris = (state: QueueState) => state.items.map(item => item.track.trackUri);
const current = (state: QueueState) =>
	state.items.find(item => item.id === state.currentItemId)?.track.trackUri;

function expectRanked(state: QueueState) {
	const ranks = state.items.map(item => item.rank);
	expect(new Set(ranks).size).toBe(ranks.length);
	for (let i = 1; i < ranks.length; i++) expect(ranks[i - 1] < ranks[i]).toBe(true);
}

/** Users that received queue:updated since the last clear. */
const notified = () => notifyQueueUpdate.mock.calls.map(([id]) => id as string);

beforeAll(async () => {
	await createUser(); // warms the auth admin client
});

beforeEach(async () => {
	ownerId = await createUser();
	userId = await createUser();
	notifyQueueUpdate.mockClear();
});

afterAll(async () => {
	for (const id of users) await supabaseAdmin.auth.admin.deleteUser(id); // cascades
	await supabaseAdmin.from('tracks').delete().like('track_uri', `${URI_PREFIX}/%`);
});

describe('add', () => {
	it('appends the track after the block last item, in the same block, and notifies', async () => {
		const playlist = await createPlaylist(2);
		await queue.playPlaylist(userId, userId, playlist.id);
		const standalone = dto();
		const before = await queue.addItem(userId, userId, standalone);
		const blockId = before.items[0].blockId;
		notifyQueueUpdate.mockClear();

		const added = await addTrack(playlist.id);
		const state = await queue.getQueue(userId, userId);

		expect(uris(state)).toEqual([
			...playlist.tracks.map(t => t.uri),
			added.uri,
			standalone.trackUri,
		]);
		expect(state.items[2]).toMatchObject({
			sourcePlaylistId: playlist.id,
			blockId,
			blockDetached: false,
		});
		expect(state.currentItemId).toBe(before.currentItemId);
		expectRanked(state);
		expect(notified()).toEqual([userId]);
		expect(notifyQueueUpdate).toHaveBeenCalledWith(userId, state);
	});

	it('leaves a finished block alone (its last item is current)', async () => {
		const playlist = await createPlaylist(2);
		await queue.playPlaylist(userId, userId, playlist.id);
		const before = await queue.step(userId, userId, 'next');
		notifyQueueUpdate.mockClear();

		await addTrack(playlist.id);

		expect(await queue.getQueue(userId, userId)).toEqual(before);
		expect(notified()).toEqual([]);
	});

	it('leaves a finished block alone (its last item is history)', async () => {
		const playlist = await createPlaylist(1);
		await queue.playPlaylist(userId, userId, playlist.id);
		await queue.addItem(userId, userId, dto());
		const before = await queue.step(userId, userId, 'next');
		notifyQueueUpdate.mockClear();

		await addTrack(playlist.id);

		expect(await queue.getQueue(userId, userId)).toEqual(before);
		expect(notified()).toEqual([]);
	});

	it('bumps the version of a queue it changes', async () => {
		const playlist = await createPlaylist(2);
		await queue.playPlaylist(userId, userId, playlist.id);
		const before = await queue.getQueue(userId, userId);

		await addTrack(playlist.id);

		expect((await queue.getQueue(userId, userId)).version).toBeGreaterThan(before.version);
	});
});

describe('add after a remove that kept the current item', () => {
	it('appends the re-added track to the block', async () => {
		const playlist = await createPlaylist(2);
		const [t1, t2] = playlist.tracks;
		await queue.playPlaylist(userId, userId, playlist.id);
		await playlistTracks.removeTrack(playlist.id, ownerId, t1.id); // t1 is current: kept
		notifyQueueUpdate.mockClear();

		await addTrack(playlist.id, { trackUri: t1.uri, title: 'T', artist: 'A', durationMs: 1000 });
		const state = await queue.getQueue(userId, userId);

		expect(uris(state)).toEqual([t1.uri, t2.uri, t1.uri]);
		expect(current(state)).toBe(t1.uri);
		expect(new Set(state.items.map(item => item.blockId)).size).toBe(1);
		expect(notified()).toEqual([userId]);
	});
});

describe('rank rebalance during a sync', () => {
	// Blocks are synced in queue order of their first item: block A (played
	// first, its first item now history) before block B. A's change forces a
	// rebalance; B is then checked against the rebalanced current item.

	it('compares the next block against the rebalanced current item', async () => {
		const playlist = await createPlaylist(3);
		const [t1, t2, t3] = playlist.tracks;
		await queue.playPlaylist(userId, userId, playlist.id); // block A
		await queue.playPlaylist(userId, userId, playlist.id); // block B after a1
		await queue.step(userId, userId, 'next');
		const seeded = await queue.step(userId, userId, 'next'); // b3 current: B finished
		// a1, b1, b2, b3 (current), a2, a3: an append after a3 needs a long key.
		const ranks = ['1', '2', '3', '4', '5', '5' + '0'.repeat(63) + '1'];
		for (const [i, item] of seeded.items.entries()) await setRank(item.id, ranks[i]);

		const added = await addTrack(playlist.id);
		const state = await queue.getQueue(userId, userId);

		expect(uris(state)).toEqual([t1.uri, t1.uri, t2.uri, t3.uri, t2.uri, t3.uri, added.uri]);
		expect(state.currentItemId).toBe(seeded.currentItemId);
		expect(state.items.slice(0, 6).map(item => item.id)).toEqual(seeded.items.map(item => item.id));
		expect(state.items.every(item => item.rank.length <= 2)).toBe(true);
		expectRanked(state);
	});

	it('does not move the current item after a rebalance', async () => {
		const playlist = await createPlaylist(4);
		const [t1, t2, t3, t4] = playlist.tracks;
		await queue.playPlaylist(userId, userId, playlist.id); // block A
		await queue.playPlaylist(userId, userId, playlist.id); // block B after a1
		await queue.step(userId, userId, 'next');
		await queue.step(userId, userId, 'next');
		const seeded = await queue.step(userId, userId, 'next'); // b4 current
		// a1, b1..b4 (b4 current), a2, a3, a4: moving a4 after a2 needs a long key.
		const ranks = ['1', '2', '3', '4', '5', '6', '6' + '0'.repeat(62) + '1', '7'];
		for (const [i, item] of seeded.items.entries()) await setRank(item.id, ranks[i]);

		await moveTrack(playlist.id, t4.id, t2.id); // playlist: t1, t2, t4, t3
		const state = await queue.getQueue(userId, userId);

		expect(uris(state)).toEqual([t1.uri, t1.uri, t2.uri, t3.uri, t4.uri, t2.uri, t4.uri, t3.uri]);
		expect(state.currentItemId).toBe(seeded.currentItemId);
		expect(state.items.slice(0, 5).map(item => item.id)).toEqual(
			seeded.items.slice(0, 5).map(item => item.id)
		);
		expect(state.items.every(item => item.rank.length <= 2)).toBe(true);
		expectRanked(state);
	});
});

describe('remove', () => {
	it('deletes the upcoming block item of the track', async () => {
		const playlist = await createPlaylist(3);
		await queue.playPlaylist(userId, userId, playlist.id);
		notifyQueueUpdate.mockClear();

		await playlistTracks.removeTrack(playlist.id, ownerId, playlist.tracks[2].id);
		const state = await queue.getQueue(userId, userId);

		expect(uris(state)).toEqual(playlist.tracks.slice(0, 2).map(t => t.uri));
		expect(state.items.every(item => !item.blockDetached)).toBe(true);
		expect(notified()).toEqual([userId]);
	});

	it('keeps the current item', async () => {
		const playlist = await createPlaylist(3);
		const before = await queue.playPlaylist(userId, userId, playlist.id);
		notifyQueueUpdate.mockClear();

		await playlistTracks.removeTrack(playlist.id, ownerId, playlist.tracks[0].id);

		expect(await queue.getQueue(userId, userId)).toEqual(before);
		expect(notified()).toEqual([]);
	});

	it('keeps history items', async () => {
		const playlist = await createPlaylist(3);
		await queue.playPlaylist(userId, userId, playlist.id);
		const before = await queue.step(userId, userId, 'next');
		notifyQueueUpdate.mockClear();

		await playlistTracks.removeTrack(playlist.id, ownerId, playlist.tracks[0].id);

		expect(await queue.getQueue(userId, userId)).toEqual(before);
		expect(notified()).toEqual([]);
	});
});

describe('move', () => {
	it('moves an upcoming block item to match the playlist order', async () => {
		const playlist = await createPlaylist(4);
		const [t1, t2, t3, t4] = playlist.tracks;
		await queue.playPlaylist(userId, userId, playlist.id);
		notifyQueueUpdate.mockClear();

		await moveTrack(playlist.id, t4.id, t2.id);
		const state = await queue.getQueue(userId, userId);

		expect(uris(state)).toEqual([t1.uri, t2.uri, t4.uri, t3.uri]);
		expect(current(state)).toBe(t1.uri);
		expect(state.items.every(item => !item.blockDetached)).toBe(true);
		expectRanked(state);
		expect(notified()).toEqual([userId]);
	});

	it('moves an item to the top: right before the block first item', async () => {
		const playlist = await createPlaylist(3);
		const [t1, t2, t3] = playlist.tracks;
		const standalone = dto();
		await queue.addItem(userId, userId, standalone);
		const playing = await queue.step(userId, userId, 'next');
		await queue.playPlaylist(userId, userId, playlist.id); // after the standalone item
		await queue.playItem(userId, userId, playing.items[0].id); // the whole block is upcoming again
		notifyQueueUpdate.mockClear();

		await moveTrack(playlist.id, t3.id, null);
		const state = await queue.getQueue(userId, userId);

		expect(uris(state)).toEqual([standalone.trackUri, t3.uri, t1.uri, t2.uri]);
		expect(current(state)).toBe(standalone.trackUri);
		expectRanked(state);
		expect(notified()).toEqual([userId]);
	});

	it('moves before the block first item when the block holds no predecessor', async () => {
		const playlist = await createPlaylist(3);
		const [t1, t2, t3] = playlist.tracks;
		const standalone = dto();
		await queue.addItem(userId, userId, standalone);
		const playing = await queue.step(userId, userId, 'next');
		const played = await queue.playPlaylist(userId, userId, playlist.id);
		await queue.playItem(userId, userId, playing.items[0].id);
		// t1's block item is gone, as a history trim would leave it.
		const { error } = await supabaseAdmin
			.from('play_queue_items')
			.delete()
			.eq('id', played.items[1].id);
		if (error) throw error;
		notifyQueueUpdate.mockClear();

		await moveTrack(playlist.id, t3.id, t1.id); // playlist: t1, t3, t2
		const state = await queue.getQueue(userId, userId);

		expect(uris(state)).toEqual([standalone.trackUri, t3.uri, t2.uri]);
		expectRanked(state);
		expect(notified()).toEqual([userId]);
	});

	it('leaves the current item where it is', async () => {
		const playlist = await createPlaylist(3);
		const [t1, , t3] = playlist.tracks;
		const before = await queue.playPlaylist(userId, userId, playlist.id);
		notifyQueueUpdate.mockClear();

		await moveTrack(playlist.id, t1.id, t3.id);

		expect(await queue.getQueue(userId, userId)).toEqual(before);
		expect(notified()).toEqual([]);
	});

	it('does not move an upcoming item into the history', async () => {
		const playlist = await createPlaylist(3);
		const [, , t3] = playlist.tracks;
		await queue.playPlaylist(userId, userId, playlist.id);
		const before = await queue.step(userId, userId, 'next'); // t1 history, t2 current
		notifyQueueUpdate.mockClear();

		await moveTrack(playlist.id, t3.id, null); // its new place is before t1

		expect(await queue.getQueue(userId, userId)).toEqual(before);
		expect(notified()).toEqual([]);
	});

	it('does not move a history item', async () => {
		const playlist = await createPlaylist(3);
		const [t1, , t3] = playlist.tracks;
		await queue.playPlaylist(userId, userId, playlist.id);
		const before = await queue.step(userId, userId, 'next');
		notifyQueueUpdate.mockClear();

		await moveTrack(playlist.id, t1.id, t3.id);

		expect(await queue.getQueue(userId, userId)).toEqual(before);
		expect(notified()).toEqual([]);
	});
});

describe('detached block', () => {
	it('is never synced', async () => {
		const playlist = await createPlaylist(4);
		const [t1, t2, t3] = playlist.tracks;
		const played = await queue.playPlaylist(userId, userId, playlist.id);
		const before = await queue.removeItem(userId, userId, played.items[3].id); // detaches the block
		notifyQueueUpdate.mockClear();

		await addTrack(playlist.id);
		await playlistTracks.removeTrack(playlist.id, ownerId, t2.id);
		await moveTrack(playlist.id, t3.id, t1.id);
		await moveTrack(playlist.id, t3.id, null);

		expect(await queue.getQueue(userId, userId)).toEqual(before);
		expect(uris(before)).toEqual([t1.uri, t2.uri, t3.uri]);
		expect(notified()).toEqual([]);
	});
});

describe('access to the playlist', () => {
	async function setAccess(
		playlistId: string,
		access: { visibility: string; viewer_ids?: string[] }
	) {
		const { error } = await supabaseAdmin.from('playlists').update(access).eq('id', playlistId);
		if (error) throw error;
	}

	it('stops syncing a user who can no longer view the playlist', async () => {
		const playlist = await createPlaylist(2);
		const before = await queue.playPlaylist(userId, userId, playlist.id);
		await setAccess(playlist.id, { visibility: 'private' });
		notifyQueueUpdate.mockClear();

		await addTrack(playlist.id);
		await playlistTracks.removeTrack(playlist.id, ownerId, playlist.tracks[1].id);

		expect(await queue.getQueue(userId, userId)).toEqual(before);
		expect(notified()).toEqual([]);
	});

	it('keeps syncing a viewer of a private playlist', async () => {
		const playlist = await createPlaylist(2);
		await queue.playPlaylist(userId, userId, playlist.id);
		await setAccess(playlist.id, { visibility: 'private', viewer_ids: [userId] });
		notifyQueueUpdate.mockClear();

		const added = await addTrack(playlist.id);

		expect(uris(await queue.getQueue(userId, userId))).toEqual([
			...playlist.tracks.map(t => t.uri),
			added.uri,
		]);
		expect(notified()).toEqual([userId]);
	});
});

describe('several users and blocks', () => {
	it('syncs every block and notifies each affected user once', async () => {
		const otherId = await createUser();
		const bystanderId = await createUser();
		const playlist = await createPlaylist(2);
		await queue.playPlaylist(userId, userId, playlist.id);
		await queue.playPlaylist(otherId, otherId, playlist.id);
		await queue.playPlaylist(otherId, otherId, playlist.id); // a second block for otherId
		await queue.addItem(bystanderId, bystanderId, dto());
		notifyQueueUpdate.mockClear();

		const added = await addTrack(playlist.id);

		const mine = await queue.getQueue(userId, userId);
		expect(uris(mine)).toEqual([...playlist.tracks.map(t => t.uri), added.uri]);

		const other = await queue.getQueue(otherId, otherId);
		const blocks = new Map<string, string[]>();
		for (const item of other.items) {
			const key = item.blockId ?? 'none';
			blocks.set(key, [...(blocks.get(key) ?? []), item.track.trackUri]);
		}
		expect(blocks.size).toBe(2);
		for (const blockUris of blocks.values()) {
			expect(blockUris).toEqual([...playlist.tracks.map(t => t.uri), added.uri]);
		}
		expectRanked(other);

		expect(notified().sort()).toEqual([userId, otherId].sort());
	});

	it('moves and removes in every block', async () => {
		const otherId = await createUser();
		const playlist = await createPlaylist(4);
		const [t1, t2, t3, t4] = playlist.tracks;
		await queue.playPlaylist(userId, userId, playlist.id);
		await queue.playPlaylist(otherId, otherId, playlist.id);
		await queue.playPlaylist(otherId, otherId, playlist.id); // a second block for otherId
		notifyQueueUpdate.mockClear();

		await moveTrack(playlist.id, t4.id, t2.id);
		expect(blocksOf(await queue.getQueue(userId, userId))).toEqual([
			[t1.uri, t2.uri, t4.uri, t3.uri],
		]);
		const moved = await queue.getQueue(otherId, otherId);
		expect(blocksOf(moved)).toEqual([
			[t1.uri, t2.uri, t4.uri, t3.uri],
			[t1.uri, t2.uri, t4.uri, t3.uri],
		]);
		expectRanked(moved);
		expect(notified().sort()).toEqual([userId, otherId].sort());
		notifyQueueUpdate.mockClear();

		await playlistTracks.removeTrack(playlist.id, ownerId, t2.id);
		expect(blocksOf(await queue.getQueue(userId, userId))).toEqual([[t1.uri, t4.uri, t3.uri]]);
		expect(blocksOf(await queue.getQueue(otherId, otherId))).toEqual([
			[t1.uri, t4.uri, t3.uri],
			[t1.uri, t4.uri, t3.uri],
		]);
		expect(notified().sort()).toEqual([userId, otherId].sort());
	});
});

describe('sync failure', () => {
	it('logs the error and never fails the playlist operation', async () => {
		const playlist = await createPlaylist(3);
		const [t1, t2, t3] = playlist.tracks;
		const before = await queue.playPlaylist(userId, userId, playlist.id);
		notifyQueueUpdate.mockClear();

		const realRpc = supabaseAdmin.rpc.bind(supabaseAdmin);
		const rpc = vi.spyOn(supabaseAdmin, 'rpc').mockImplementation(((
			fn: string,
			args?: Record<string, unknown>
		) => {
			if (fn.startsWith('queue_sync_')) {
				return Promise.resolve({ data: null, error: { message: 'boom' } });
			}
			return realRpc(fn as never, args as never);
		}) as never);
		const logError = vi.spyOn(logger, 'error');

		try {
			const result = await playlistTracks.addTrack(playlist.id, ownerId, dto());
			expect(result.track.id).toBeDefined();
			await moveTrack(playlist.id, t3.id, t1.id);
			const removed = await playlistTracks.removeTrack(playlist.id, ownerId, t2.id);
			expect(typeof removed.tracksVersion).toBe('number');
		} finally {
			rpc.mockRestore();
		}

		expect(logError).toHaveBeenCalledWith(
			'Queue sync failed',
			expect.objectContaining({ change: 'added', playlistId: playlist.id, error: 'boom' })
		);
		for (const change of ['moved', 'removed']) {
			expect(logError).toHaveBeenCalledWith(
				'Queue sync failed',
				expect.objectContaining({ change, playlistId: playlist.id, error: 'boom' })
			);
		}
		logError.mockRestore();
		expect(await queue.getQueue(userId, userId)).toEqual(before);
		expect(notified()).toEqual([]);
	});
});

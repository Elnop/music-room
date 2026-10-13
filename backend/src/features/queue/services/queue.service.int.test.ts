import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { QueueService } from '@/features/queue/services/queue.service.js';
import type { QueueState } from '@/features/queue/queue.types.js';

// The play queue of migration 021 against the local Supabase stack (#273):
// every row of the plan's I/O matrix, block detachment, history trim and
// rank rebalance. No Socket.io server runs here: notifyQueueUpdate is a no-op.

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
	let state: QueueState = { currentItemId: null, items: [] };
	for (let i = 0; i < n; i++) state = await queue.addItem(user, dto());
	return state.items.map(item => item.id);
}

const ids = (state: QueueState) => state.items.map(item => item.id);

// Ranks unique and in byte order, matching the item order.
function expectRanked(state: QueueState) {
	const ranks = state.items.map(item => item.rank);
	expect(new Set(ranks).size).toBe(ranks.length);
	for (let i = 1; i < ranks.length; i++) expect(ranks[i - 1] < ranks[i]).toBe(true);
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
		expect(await queue.getQueue(userId)).toEqual({ currentItemId: null, items: [] });
	});

	it('appends after the last rank and keeps the current item', async () => {
		const [first] = await addItems(2);
		await queue.playItem(userId, first);
		const track = dto();
		const state = await queue.addItem(userId, track);

		expect(state.currentItemId).toBe(first);
		expect(state.items).toHaveLength(3);
		expect(state.items[2]).toMatchObject({
			track: { trackUri: track.trackUri, title: track.title, album: null, albumArt: null },
			sourcePlaylistId: null,
			blockId: null,
			blockDetached: false,
		});
		expectRanked(state);
		expect(await queue.getQueue(userId)).toEqual(state);
	});

	it('reuses the tracks row of a known track_uri', async () => {
		const track = dto();
		await queue.addItem(userId, track);
		const state = await queue.addItem(userId, { ...track, title: 'Renamed' });
		expect(state.items.map(item => item.track.title)).toEqual(['Renamed', 'Renamed']);
		const { count } = await supabaseAdmin
			.from('tracks')
			.select('id', { count: 'exact', head: true })
			.eq('track_uri', track.trackUri);
		expect(count).toBe(1);
	});

	it('serializes concurrent adds of one user', async () => {
		await Promise.all(Array.from({ length: 8 }, () => queue.addItem(userId, dto())));
		const state = await queue.getQueue(userId);
		expect(state.items).toHaveLength(8);
		expectRanked(state);
	});

	it('stores no stream URL', async () => {
		await addItems(2);
		const withPreview = { ...dto(), previewUrl: 'https://api.soundcloud.com/tracks/1/stream' };
		await queue.addItem(userId, withPreview);
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

describe('remove', () => {
	it('removes an upcoming or a history item', async () => {
		const [a, b, c, d] = await addItems(4);
		await queue.playItem(userId, b);
		await queue.removeItem(userId, a);
		const state = await queue.removeItem(userId, d);
		expect(ids(state)).toEqual([b, c]);
		expect(state.currentItemId).toBe(b);
	});

	it('moves current to the next item when the current one is removed', async () => {
		const [a, b, c] = await addItems(3);
		await queue.playItem(userId, b);
		const state = await queue.removeItem(userId, b);
		expect(state).toMatchObject({ currentItemId: c });
		expect(ids(state)).toEqual([a, c]);
	});

	it('empties the queue when the last current item is removed', async () => {
		const [, , c] = await addItems(3);
		await queue.playItem(userId, c);
		expect(await queue.removeItem(userId, c)).toEqual({ currentItemId: null, items: [] });
	});

	it('keeps 50 history items when the removed current item is followed', async () => {
		const all = await addItems(52);
		await queue.playItem(userId, all[50]); // 50 items of history
		const state = await queue.removeItem(userId, all[50]);
		expect(state.currentItemId).toBe(all[51]);
		expect(ids(state)).toEqual([...all.slice(0, 50), all[51]]);
	});

	it('detaches the whole block of a removed item', async () => {
		const [a, b, c, d] = await addItems(4);
		await seedBlock([a, b, c]);
		const state = await queue.removeItem(userId, b);
		expect(blockFlags(state, [a, c, d])).toEqual([true, true, false]);
	});

	it("answers 404 for an unknown item or another user's item, and changes nothing", async () => {
		const other = await createUser();
		const [theirs] = await addItems(1, other);
		await addItems(1);
		const before = await queue.getQueue(userId);

		await expect(queue.removeItem(userId, randomUUID())).rejects.toMatchObject({
			statusCode: 404,
			code: 'QUEUE_ITEM_NOT_FOUND',
		});
		await expect(queue.removeItem(userId, theirs)).rejects.toMatchObject({
			statusCode: 404,
			code: 'QUEUE_ITEM_NOT_FOUND',
		});
		expect(await queue.getQueue(userId)).toEqual(before);
		expect(ids(await queue.getQueue(other))).toEqual([theirs]);
	});
});

describe('move', () => {
	it('places the item right after the current one when afterItemId is null', async () => {
		const [a, b, c, d] = await addItems(4);
		await queue.playItem(userId, a);
		const state = await queue.moveItem(userId, d, null);
		expect(ids(state)).toEqual([a, d, b, c]);
		expectRanked(state);
	});

	it('places the item at the top when nothing is current', async () => {
		const [a, b, c] = await addItems(3);
		expect(ids(await queue.moveItem(userId, c, null))).toEqual([c, a, b]);
	});

	it('places the item between afterItemId and the next item', async () => {
		const [a, b, c, d] = await addItems(4);
		await queue.playItem(userId, a);
		expect(ids(await queue.moveItem(userId, b, c))).toEqual([a, c, b, d]);
	});

	it('detaches the whole block of a moved item', async () => {
		const [a, b, c, d] = await addItems(4);
		await seedBlock([b, c]);
		const state = await queue.moveItem(userId, b, d);
		expect(blockFlags(state, [a, b, c, d])).toEqual([false, true, true, false]);
	});

	it('refuses to move the current item, a history item, or after one of them', async () => {
		const [a, b, c, d] = await addItems(4);
		await queue.playItem(userId, b);
		const notUpcoming = { statusCode: 409, code: 'QUEUE_ITEM_NOT_UPCOMING' };
		await expect(queue.moveItem(userId, b, null)).rejects.toMatchObject(notUpcoming);
		await expect(queue.moveItem(userId, a, null)).rejects.toMatchObject(notUpcoming);
		await expect(queue.moveItem(userId, d, b)).rejects.toMatchObject(notUpcoming);
		await expect(queue.moveItem(userId, d, a)).rejects.toMatchObject(notUpcoming);
		expect(ids(await queue.getQueue(userId))).toEqual([a, b, c, d]);
	});

	it("answers 404 for an unknown item or afterItemId, or another user's", async () => {
		const other = await createUser();
		const [theirs] = await addItems(1, other);
		const [a, b] = await addItems(2);
		const notFound = { statusCode: 404, code: 'QUEUE_ITEM_NOT_FOUND' };
		await expect(queue.moveItem(userId, randomUUID(), null)).rejects.toMatchObject(notFound);
		await expect(queue.moveItem(userId, theirs, null)).rejects.toMatchObject(notFound);
		await expect(queue.moveItem(userId, a, theirs)).rejects.toMatchObject(notFound);
		expect(ids(await queue.getQueue(userId))).toEqual([a, b]);
	});
});

describe('play, next and previous', () => {
	it('plays any item of the caller', async () => {
		const [a, b, c] = await addItems(3);
		expect((await queue.playItem(userId, c)).currentItemId).toBe(c);
		expect((await queue.playItem(userId, a)).currentItemId).toBe(a);
		expect(ids(await queue.getQueue(userId))).toEqual([a, b, c]);
	});

	it("answers 404 to play an unknown item or another user's", async () => {
		const other = await createUser();
		const [theirs] = await addItems(1, other);
		await addItems(1);
		const notFound = { statusCode: 404, code: 'QUEUE_ITEM_NOT_FOUND' };
		await expect(queue.playItem(userId, randomUUID())).rejects.toMatchObject(notFound);
		await expect(queue.playItem(userId, theirs)).rejects.toMatchObject(notFound);
		expect((await queue.getQueue(userId)).currentItemId).toBeNull();
		expect((await queue.getQueue(other)).currentItemId).toBeNull();
	});

	it('steps to the first item from no current, then forward, then back', async () => {
		const [a, b] = await addItems(2);
		expect((await queue.step(userId, 'next')).currentItemId).toBe(a);
		expect((await queue.step(userId, 'next')).currentItemId).toBe(b);
		expect((await queue.step(userId, 'previous')).currentItemId).toBe(a);
	});

	it('answers 409 QUEUE_END with no next item', async () => {
		const queueEnd = { statusCode: 409, code: 'QUEUE_END' };
		await expect(queue.step(userId, 'next')).rejects.toMatchObject(queueEnd);
		const [, b] = await addItems(2);
		await queue.playItem(userId, b);
		await expect(queue.step(userId, 'next')).rejects.toMatchObject(queueEnd);
	});

	it('answers 409 QUEUE_START with no previous item or no current', async () => {
		const queueStart = { statusCode: 409, code: 'QUEUE_START' };
		const [a] = await addItems(2);
		await expect(queue.step(userId, 'previous')).rejects.toMatchObject(queueStart);
		await queue.playItem(userId, a);
		await expect(queue.step(userId, 'previous')).rejects.toMatchObject(queueStart);
	});

	it('keeps only the 50 most recent history items after a step forward', async () => {
		const all = await addItems(53);
		await queue.playItem(userId, all[50]); // 50 items of history, none dropped
		expect((await queue.getQueue(userId)).items).toHaveLength(53);

		const state = await queue.step(userId, 'next');
		expect(state.currentItemId).toBe(all[51]);
		expect(ids(state)).toEqual(all.slice(1));
	});
});

describe('rank rebalance', () => {
	const longRank = 'V' + 'z'.repeat(63); // 64 characters: rank_max_length()

	it('respaces the ranks when an add makes a key too long', async () => {
		const [a, b] = await addItems(2);
		await setRank(b, longRank);
		const state = await queue.addItem(userId, dto());
		expect(ids(state).slice(0, 2)).toEqual([a, b]);
		expect(state.items.every(item => item.rank.length <= 2)).toBe(true);
		expectRanked(state);
	});

	it('respaces the ranks when a move makes a key too long', async () => {
		const [a, b, c] = await addItems(3);
		await setRank(a, '1');
		await setRank(b, '1' + '0'.repeat(62) + '1'); // right above a: no room at 64 characters
		const state = await queue.moveItem(userId, c, a);
		expect(ids(state)).toEqual([a, c, b]);
		expect(state.items.every(item => item.rank.length <= 2)).toBe(true);
		expectRanked(state);
	});
});

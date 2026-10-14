import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { QueueService } from '@/features/queue/services/queue.service.js';
import {
	insertBlockRpc,
	trackIdsFromRpc,
	upcomingTrackIdsRpc,
} from '@/features/queue/utils/queue-rpc.js';
import type { QueueItem, QueueState } from '@/features/queue/queue.types.js';

// The transfer functions of migration 025 against the local Supabase stack (#295):
// the track lists read from a queue and the block insertion that follows them.

const URI_PREFIX = `https://soundcloud.com/int-transfer/${randomUUID()}`;
const queue = new QueueService();
const users: string[] = [];
let userId: string;
let otherUser: string;
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

/** Adds n tracks to a user's queue and returns the resulting state. */
async function addItemsTo(user: string, n: number): Promise<QueueState> {
	await addItems(n, user);
	return queue.getQueue(user, user);
}

/** The tracks.id of each item, in the items' order. */
async function trackIdsOf(items: QueueItem[]): Promise<string[]> {
	const uris = items.map(item => item.track.trackUri);
	const { data, error } = await supabaseAdmin
		.from('tracks')
		.select('id, track_uri')
		.in('track_uri', uris);
	if (error) throw error;
	const byUri = new Map((data ?? []).map(row => [row.track_uri, row.id]));
	return uris.map(uri => {
		const id = byUri.get(uri);
		if (!id) throw new Error(`track not found: ${uri}`);
		return id;
	});
}

beforeAll(async () => {
	await createUser(); // warms the auth admin client
});

beforeEach(async () => {
	userId = await createUser();
	otherUser = await createUser();
});

afterAll(async () => {
	for (const id of users) await supabaseAdmin.auth.admin.deleteUser(id); // cascades to queues
	await supabaseAdmin.from('tracks').delete().like('track_uri', `${URI_PREFIX}/%`);
});

describe('queue_track_ids_from / queue_track_ids_upcoming', () => {
	it('returns the item and the following ones, in queue order', async () => {
		const ids = await addItems(3);
		const state = await queue.getQueue(userId, userId);
		const trackIds = await trackIdsFromRpc(userId, ids[1]);
		expect(trackIds).toHaveLength(2);
		expect(trackIds).toEqual(await trackIdsOf(state.items.slice(1)));
	});

	it("refuses another user's item with 404 QUEUE_ITEM_NOT_FOUND", async () => {
		const [foreign] = await addItems(1, otherUser);
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
		const ids = await addItems(2);
		await queue.playItem(userId, userId, ids[0]);
		const before = await queue.getQueue(userId, userId);
		const block = await trackIdsOf((await addItemsTo(otherUser, 2)).items);
		const state = await insertBlockRpc(userId, block);
		const order = state.items.map(i => i.id);
		expect(order[0]).toBe(ids[0]);
		expect(order.at(-1)).toBe(ids[1]);
		const inserted = state.items.slice(1, 3);
		expect(inserted).toHaveLength(2);
		expect(state.currentItemId).toBe(inserted[0].id);
		expect(new Set(inserted.map(i => i.blockId)).size).toBe(1);
		expect(inserted[0].blockId).not.toBeNull();
		expect(inserted.every(i => i.sourcePlaylistId === null && !i.blockDetached)).toBe(true);
		expect(state.version).toBeGreaterThan(before.version);
	});

	it('puts the block first when nothing is current', async () => {
		const ids = await addItems(1);
		const state = await insertBlockRpc(
			userId,
			await trackIdsOf((await queue.getQueue(userId, userId)).items)
		);
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

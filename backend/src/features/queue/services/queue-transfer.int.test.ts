import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { QueueService } from '@/features/queue/services/queue.service.js';
import { QueueTransferService } from '@/features/queue/services/queue-transfer.service.js';
import { realtime } from '@/realtime/index.js';

// #295: transfer playback to a device of mine or of a friend. Checks come before any change.
// No Socket.io server runs here: device presence and commands are stubbed on
// the realtime singleton.

const URI_PREFIX = `https://soundcloud.com/int-queue-transfer/${randomUUID()}`;
const queue = new QueueService();
const transfer = new QueueTransferService();
const users: string[] = [];
let trackCount = 0;
let me: string;
let friend: string;
let stranger: string;

async function createUser(): Promise<string> {
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email: `int-${randomUUID()}@example.com`,
		password: 'integration-test-password',
		email_confirm: true,
	});
	if (error) throw error;
	const id = data.user.id;
	users.push(id);
	// devices and follows reference user_profiles
	const { error: profileError } = await supabaseAdmin
		.from('user_profiles')
		.insert({ id, username: `int_${id.slice(0, 8)}` });
	if (profileError) throw profileError;
	return id;
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

const online = new Set<string>();
const sendDeviceCommand = vi.spyOn(realtime, 'sendDeviceCommand').mockReturnValue(true);
const notifyQueueUpdate = vi.spyOn(realtime, 'notifyQueueUpdate').mockReturnValue(undefined);
vi.spyOn(realtime, 'isDeviceOnline').mockImplementation((userId, deviceId) =>
	online.has(`${userId}:${deviceId}`)
);

/** I follow the friend, who allows me to control the licensed device only. */
async function license(deviceId: string) {
	const { error: followError } = await supabaseAdmin.from('follows').insert([
		{ follower_id: me, following_id: friend },
		{ follower_id: friend, following_id: me },
	]);
	if (followError) throw followError;
	const { error: deviceError } = await supabaseAdmin.from('devices').upsert({
		user_id: friend,
		device_id: deviceId,
		device_name: 'TV',
		platform: 'android',
		model: 'X',
	});
	if (deviceError) throw deviceError;
	const { error } = await supabaseAdmin
		.from('device_control_licenses')
		.insert({ owner_id: friend, device_id: deviceId, grantee_id: me });
	if (error) throw error;
}

beforeAll(async () => {
	me = await createUser();
	friend = await createUser();
	stranger = await createUser();
});

beforeEach(async () => {
	online.clear();
	sendDeviceCommand.mockClear();
	notifyQueueUpdate.mockClear();
	await supabaseAdmin.from('devices').delete().in('user_id', [me, friend]); // cascades to licenses
	await supabaseAdmin.from('follows').delete().in('follower_id', [me, friend, stranger]);
	await supabaseAdmin.from('play_queues').delete().in('user_id', [me, friend]); // cascades to items
});

afterAll(async () => {
	for (const id of users) await supabaseAdmin.auth.admin.deleteUser(id);
	await supabaseAdmin.from('tracks').delete().like('track_uri', `${URI_PREFIX}/%`);
	vi.restoreAllMocks();
});

/** Plays an item of my queue and returns the queue. */
async function playingQueue(count: number, currentIndex: number) {
	let state = await queue.getQueue(me, me);
	for (let i = 0; i < count; i++) state = await queue.addItem(me, me, dto());
	return queue.playItem(me, me, state.items[currentIndex].id);
}

describe('transfer to one of my devices', () => {
	it('sends play-item at my position and leaves my queue unchanged', async () => {
		online.add(`${me}:tablet`);
		await playingQueue(1, 0);
		const before = await queue.getQueue(me, me);
		const result = await transfer.transfer(me, {
			targetUserId: me,
			targetDeviceId: 'tablet',
			positionMs: 30_000,
			playing: { queueItemId: before.currentItemId! },
		});
		expect(result).toEqual({ ownerId: me, deviceId: 'tablet', queue: null });
		expect(sendDeviceCommand).toHaveBeenCalledWith(me, 'tablet', {
			action: 'play-item',
			fromUserId: me,
			item: before.items[0],
			positionMs: 30_000,
			version: before.version,
		});
		expect(await queue.getQueue(me, me)).toEqual(before);
	});

	it('sends play-track for a track played outside the queue', async () => {
		online.add(`${me}:tablet`);
		const before = await playingQueue(1, 0);
		const track = { ...dto(), album: undefined };
		const result = await transfer.transfer(me, {
			targetUserId: me,
			targetDeviceId: 'tablet',
			positionMs: 1234,
			playing: { track },
		});
		expect(result.queue).toBeNull();
		expect(sendDeviceCommand).toHaveBeenCalledWith(me, 'tablet', {
			action: 'play-track',
			fromUserId: me,
			track: { ...track, album: null, albumArt: null },
			positionMs: 1234,
		});
		expect(await queue.getQueue(me, me)).toEqual(before);
	});

	it('refuses an offline device of mine with 409, changing nothing and sending nothing', async () => {
		const before = await playingQueue(1, 0);
		await expect(
			transfer.transfer(me, {
				targetUserId: me,
				targetDeviceId: 'tablet',
				positionMs: 0,
				playing: { queueItemId: before.currentItemId! },
			})
		).rejects.toMatchObject({ statusCode: 409, code: 'DEVICE_OFFLINE' });
		expect(await queue.getQueue(me, me)).toEqual(before);
		expect(sendDeviceCommand).not.toHaveBeenCalled();
	});

	it('does not pause the source when it is the target device', async () => {
		online.add(`${me}:tablet`);
		const before = await playingQueue(1, 0);
		await transfer.transfer(me, {
			targetUserId: me,
			targetDeviceId: 'tablet',
			positionMs: 0,
			playing: { queueItemId: before.currentItemId! },
			source: { userId: me, deviceId: 'tablet' },
		});
		expect(sendDeviceCommand).toHaveBeenCalledTimes(1);
		expect(sendDeviceCommand).toHaveBeenCalledWith(
			me,
			'tablet',
			expect.objectContaining({ action: 'play-item' })
		);
	});

	it('pauses the remote source after the play command', async () => {
		online.add(`${me}:tablet`);
		const before = await playingQueue(1, 0);
		await transfer.transfer(me, {
			targetUserId: me,
			targetDeviceId: 'tablet',
			positionMs: 0,
			playing: { queueItemId: before.currentItemId! },
			source: { userId: me, deviceId: 'phone' },
		});
		expect(sendDeviceCommand).toHaveBeenCalledTimes(2);
		expect(sendDeviceCommand).toHaveBeenNthCalledWith(
			1,
			me,
			'tablet',
			expect.objectContaining({ action: 'play-item' })
		);
		expect(sendDeviceCommand).toHaveBeenNthCalledWith(2, me, 'phone', {
			action: 'pause',
			fromUserId: me,
		});
		const [play, pause] = sendDeviceCommand.mock.invocationCallOrder;
		expect(play).toBeLessThan(pause);
	});
});

describe('transfer to a friend device', () => {
	async function friendQueue() {
		const x = await queue.addItem(friend, friend, dto());
		await queue.playItem(friend, friend, x.items[0].id);
		return queue.addItem(friend, friend, dto());
	}

	it('puts my track and what follows first in the friend queue and plays it there', async () => {
		await license('tv');
		online.add(`${friend}:tv`);
		const mine = await playingQueue(3, 1);
		const [a, b, c] = mine.items;
		const x = (await friendQueue()).items;
		const friendBefore = await queue.getQueue(friend, friend);
		const result = await transfer.transfer(me, {
			targetUserId: friend,
			targetDeviceId: 'tv',
			positionMs: 5000,
			playing: { queueItemId: b.id },
		});
		const after = await queue.getQueue(friend, friend);
		expect(after.items.map(i => i.track.trackUri)).toEqual([
			x[0].track.trackUri,
			b.track.trackUri,
			c.track.trackUri,
			x[1].track.trackUri,
		]);
		expect(after.items.map(i => i.track.trackUri)).not.toContain(a.track.trackUri);
		expect(after.currentItemId).toBe(after.items[1].id);
		expect(after.version).toBeGreaterThan(friendBefore.version);
		expect(result).toEqual({ ownerId: friend, deviceId: 'tv', queue: after });
		expect(notifyQueueUpdate).toHaveBeenCalledWith(friend, after);
		expect(sendDeviceCommand).toHaveBeenCalledWith(friend, 'tv', {
			action: 'play-item',
			fromUserId: me,
			item: after.items[1],
			positionMs: 5000,
			version: after.version,
		});
		expect(await queue.getQueue(me, me)).toEqual(mine);
	});

	it('uses the played track then my upcoming items when playing outside the queue', async () => {
		await license('tv');
		online.add(`${friend}:tv`);
		const mine = await playingQueue(3, 0);
		const track = { ...dto(), album: undefined };
		const result = await transfer.transfer(me, {
			targetUserId: friend,
			targetDeviceId: 'tv',
			positionMs: 0,
			playing: { track },
		});
		expect(result.queue?.items.map(i => i.track.trackUri)).toEqual([
			track.trackUri,
			mine.items[1].track.trackUri,
			mine.items[2].track.trackUri,
		]);
		expect(result.queue?.currentItemId).toBe(result.queue?.items[0].id);
		expect(await queue.getQueue(me, me)).toEqual(mine);
	});

	it('refuses without a license (403) or offline (409), changing no queue and sending nothing', async () => {
		const mine = await playingQueue(2, 0);
		const friendBefore = await friendQueue();
		notifyQueueUpdate.mockClear();
		const input = {
			targetUserId: friend,
			targetDeviceId: 'tv',
			positionMs: 0,
			playing: { queueItemId: mine.currentItemId! },
		};
		await expect(transfer.transfer(me, input)).rejects.toMatchObject({
			statusCode: 403,
			code: 'QUEUE_ACCESS_DENIED',
		});
		await license('tv');
		await expect(transfer.transfer(me, input)).rejects.toMatchObject({
			statusCode: 409,
			code: 'DEVICE_OFFLINE',
		});
		expect(await queue.getQueue(me, me)).toEqual(mine);
		expect(await queue.getQueue(friend, friend)).toEqual(friendBefore);
		expect(sendDeviceCommand).not.toHaveBeenCalled();
		expect(notifyQueueUpdate).not.toHaveBeenCalled();
	});

	it('refuses a device the friend did not license to me, even with another licensed', async () => {
		await license('radio');
		await supabaseAdmin.from('devices').upsert({
			user_id: friend,
			device_id: 'tv',
			device_name: 'TV',
			platform: 'android',
			model: 'X',
		});
		online.add(`${friend}:tv`);
		const mine = await playingQueue(1, 0);
		const friendBefore = await friendQueue();
		notifyQueueUpdate.mockClear();
		await expect(
			transfer.transfer(me, {
				targetUserId: friend,
				targetDeviceId: 'tv',
				positionMs: 0,
				playing: { queueItemId: mine.currentItemId! },
			})
		).rejects.toMatchObject({ statusCode: 403, code: 'QUEUE_ACCESS_DENIED' });
		expect(await queue.getQueue(me, me)).toEqual(mine);
		expect(await queue.getQueue(friend, friend)).toEqual(friendBefore);
		expect(sendDeviceCommand).not.toHaveBeenCalled();
		expect(notifyQueueUpdate).not.toHaveBeenCalled();
	});

	it('refuses an item that is not in my queue with 404, changing nothing', async () => {
		await license('tv');
		online.add(`${friend}:tv`);
		const mine = await playingQueue(1, 0);
		const friendBefore = await friendQueue();
		await expect(
			transfer.transfer(me, {
				targetUserId: friend,
				targetDeviceId: 'tv',
				positionMs: 0,
				playing: { queueItemId: friendBefore.items[0].id },
			})
		).rejects.toMatchObject({ statusCode: 404, code: 'QUEUE_ITEM_NOT_FOUND' });
		expect(await queue.getQueue(me, me)).toEqual(mine);
		expect(await queue.getQueue(friend, friend)).toEqual(friendBefore);
		expect(sendDeviceCommand).not.toHaveBeenCalled();
	});

	it('refuses a source device I do not control with 403, before any change', async () => {
		await license('tv');
		online.add(`${friend}:tv`);
		const mine = await playingQueue(1, 0);
		const friendBefore = await friendQueue();
		await expect(
			transfer.transfer(me, {
				targetUserId: friend,
				targetDeviceId: 'tv',
				positionMs: 0,
				playing: { queueItemId: mine.currentItemId! },
				source: { userId: stranger, deviceId: 'x' },
			})
		).rejects.toMatchObject({ statusCode: 403, code: 'QUEUE_ACCESS_DENIED' });
		expect(await queue.getQueue(me, me)).toEqual(mine);
		expect(await queue.getQueue(friend, friend)).toEqual(friendBefore);
		expect(sendDeviceCommand).not.toHaveBeenCalled();
	});
});

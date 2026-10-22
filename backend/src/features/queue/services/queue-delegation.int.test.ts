import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import * as queue from '@/features/queue/services/queue.service.js';
import * as playlistService from '@/features/playlists/services/playlist.service.js';
import { realtime } from '@/realtime/index.js';

// #294: a friend who controls at least one device of the owner manages the
// owner's queue; playback actions target a device the friend controls, online.
// No Socket.io server runs here: device presence and commands are stubbed on
// the realtime singleton.

const URI_PREFIX = `https://soundcloud.com/int-queue-delegation/${randomUUID()}`;
const users: string[] = [];
let trackCount = 0;
let owner: string;
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
vi.spyOn(realtime, 'isDeviceOnline').mockImplementation((userId, deviceId) =>
	online.has(`${userId}:${deviceId}`)
);

async function befriend(allDevices: boolean) {
	const { error } = await supabaseAdmin.from('follows').insert([
		{ follower_id: friend, following_id: owner, can_control_music: allDevices },
		{ follower_id: owner, following_id: friend },
	]);
	if (error) throw error;
}

async function license(deviceId: string) {
	const { error: deviceError } = await supabaseAdmin.from('devices').upsert({
		user_id: owner,
		device_id: deviceId,
		device_name: 'TV',
		platform: 'android',
		model: 'X',
	});
	if (deviceError) throw deviceError;
	const { error } = await supabaseAdmin
		.from('device_control_licenses')
		.insert({ owner_id: owner, device_id: deviceId, grantee_id: friend });
	if (error) throw error;
}

beforeAll(async () => {
	owner = await createUser();
	friend = await createUser();
	stranger = await createUser();
});

beforeEach(async () => {
	online.clear();
	sendDeviceCommand.mockClear();
	await supabaseAdmin.from('devices').delete().eq('user_id', owner); // cascades to licenses
	await supabaseAdmin.from('follows').delete().in('follower_id', [owner, friend, stranger]);
	await supabaseAdmin.from('play_queues').delete().eq('user_id', owner); // cascades to items
});

afterAll(async () => {
	for (const id of users) await supabaseAdmin.auth.admin.deleteUser(id);
	await supabaseAdmin.from('tracks').delete().like('track_uri', `${URI_PREFIX}/%`);
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
		await expect(queue.getQueue(stranger, owner)).rejects.toMatchObject({
			code: 'QUEUE_ACCESS_DENIED',
		});
		await expect(queue.addItem(stranger, owner, dto())).rejects.toMatchObject({ statusCode: 403 });
		await expect(queue.removeItem(stranger, owner, before.items[0].id)).rejects.toMatchObject({
			statusCode: 403,
		});
		expect(await queue.getQueue(owner, owner)).toEqual(before);
	});

	it('refuses a friend without any device control (switch off, no license)', async () => {
		await befriend(false);
		await expect(queue.getQueue(friend, owner)).rejects.toMatchObject({
			code: 'QUEUE_ACCESS_DENIED',
		});
	});

	it('refuses a former friend after an unfollow', async () => {
		await befriend(true);
		await supabaseAdmin
			.from('follows')
			.delete()
			.eq('follower_id', owner)
			.eq('following_id', friend);
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
		expect(sendDeviceCommand).toHaveBeenCalledWith(owner, 'tv', {
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
		await expect(queue.playItem(friend, owner, itemId, 'radio')).rejects.toMatchObject({
			statusCode: 403,
		});
		await expect(queue.playItem(friend, owner, itemId, 'tv')).rejects.toMatchObject({
			statusCode: 409,
			code: 'DEVICE_OFFLINE',
		});
		expect(await queue.getQueue(owner, owner)).toEqual(before);
		expect(sendDeviceCommand).not.toHaveBeenCalled();
	});

	it("checks the playlist's visibility for the delegate, not the owner", async () => {
		await befriend(true);
		online.add(`${owner}:tv`);
		const playlist = await playlistService.createPlaylist(owner, {
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
		expect(sendDeviceCommand).toHaveBeenCalledWith(
			owner,
			'tablet',
			expect.objectContaining({ action: 'play-item', fromUserId: owner })
		);
	});

	it('sends no command when the owner plays from the calling device', async () => {
		const added = await queue.addItem(owner, owner, dto());
		await queue.playItem(owner, owner, added.items[0].id);
		expect(sendDeviceCommand).not.toHaveBeenCalled();
	});
});

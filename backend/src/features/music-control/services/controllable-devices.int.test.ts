import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { ControllableDevicesService } from '@/features/music-control/services/controllable-devices.service.js';
import { realtime } from '@/realtime/index.js';

// #295: the devices I can play on, mine then friends'. Presence is stubbed on
// the realtime singleton (no Socket.io server here).

const service = new ControllableDevicesService();
const users: string[] = [];
const names = new Map<string, string>();
let me: string;
let friend: string;
let other: string;
let stranger: string;
const online = new Set<string>();
vi.spyOn(realtime, 'isDeviceOnline').mockImplementation((userId, deviceId) =>
	online.has(`${userId}:${deviceId}`)
);

async function createUser(label: string): Promise<string> {
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email: `int-${randomUUID()}@example.com`,
		password: 'integration-test-password',
		email_confirm: true,
	});
	if (error) throw error;
	const id = data.user.id;
	users.push(id);
	const username = `${label}_${id.slice(0, 8)}`;
	names.set(id, username);
	const { error: profileError } = await supabaseAdmin
		.from('user_profiles')
		.insert({ id, username });
	if (profileError) throw profileError;
	return id;
}

async function addDevice(userId: string, deviceId: string) {
	const { error } = await supabaseAdmin.from('devices').upsert({
		user_id: userId,
		device_id: deviceId,
		device_name: deviceId,
		platform: 'android',
		model: 'X',
	});
	if (error) throw error;
}

async function befriend(a: string, b: string) {
	const { error } = await supabaseAdmin.from('follows').insert([
		{ follower_id: a, following_id: b },
		{ follower_id: b, following_id: a },
	]);
	if (error) throw error;
}

async function licenseDevice(owner: string, deviceId: string, grantee: string) {
	const { error } = await supabaseAdmin
		.from('device_control_licenses')
		.insert({ owner_id: owner, device_id: deviceId, grantee_id: grantee });
	if (error) throw error;
}

beforeAll(async () => {
	me = await createUser('me');
	friend = await createUser('friend');
	other = await createUser('other');
	stranger = await createUser('stranger');
});

beforeEach(async () => {
	online.clear();
	const all = [me, friend, other, stranger];
	await supabaseAdmin.from('devices').delete().in('user_id', all); // cascades to licenses
	await supabaseAdmin.from('follows').delete().in('follower_id', all);
});

afterAll(async () => {
	for (const id of users) await supabaseAdmin.auth.admin.deleteUser(id);
	vi.restoreAllMocks();
});

const ids = (devices: Array<{ deviceId: string }>) => devices.map(d => d.deviceId).sort();

describe('GET /api/music-control/controllable-devices', () => {
	it('lists my own devices first, flagged isSelf', async () => {
		await addDevice(me, 'phone');
		await addDevice(me, 'tablet');
		const { owners } = await service.list(me);
		expect(owners).toHaveLength(1);
		expect(owners[0]).toMatchObject({ ownerId: me, username: names.get(me), isSelf: true });
		expect(ids(owners[0].devices)).toEqual(['phone', 'tablet']);
		expect(owners[0].devices.every(d => d.access === 'all-devices')).toBe(true);
	});

	it('lists a licensed friend single device only', async () => {
		await befriend(me, friend);
		await addDevice(friend, 'tv');
		await addDevice(friend, 'laptop');
		await licenseDevice(friend, 'tv', me);
		const { owners } = await service.list(me);
		const entry = owners.find(o => o.ownerId === friend);
		expect(entry?.isSelf).toBe(false);
		expect(ids(entry!.devices)).toEqual(['tv']);
		expect(entry!.devices[0].access).toBe('license');
	});

	it('lists every device of a friend who turned on all-devices', async () => {
		await befriend(me, friend);
		await addDevice(friend, 'tv');
		await addDevice(friend, 'laptop');
		const { error } = await supabaseAdmin
			.from('follows')
			.update({ can_control_music: true })
			.eq('follower_id', me)
			.eq('following_id', friend);
		if (error) throw error;
		const { owners } = await service.list(me);
		const entry = owners.find(o => o.ownerId === friend);
		expect(ids(entry!.devices)).toEqual(['laptop', 'tv']);
	});

	it('omits a friend with no license nor switch', async () => {
		await befriend(me, friend);
		await addDevice(friend, 'tv');
		const { owners } = await service.list(me);
		expect(owners.map(o => o.ownerId)).not.toContain(friend);
	});

	it('omits a non-friend who licensed me (one-way follow)', async () => {
		await supabaseAdmin.from('follows').insert({ follower_id: me, following_id: stranger });
		await addDevice(stranger, 'tv');
		await licenseDevice(stranger, 'tv', me);
		const { owners } = await service.list(me);
		expect(owners.map(o => o.ownerId)).not.toContain(stranger);
	});

	it('puts me first then friends by username, and reflects online state', async () => {
		await addDevice(me, 'phone');
		await befriend(me, friend);
		await befriend(me, other);
		await addDevice(friend, 'tv');
		await addDevice(other, 'pc');
		await licenseDevice(friend, 'tv', me);
		await licenseDevice(other, 'pc', me);
		online.add(`${friend}:tv`);
		const { owners } = await service.list(me);
		expect(owners[0].ownerId).toBe(me);
		const rest = owners.slice(1).map(o => o.username);
		expect(rest).toEqual([...rest].sort());
		expect(owners[0].devices[0].online).toBe(false);
		expect(owners.find(o => o.ownerId === friend)!.devices[0].online).toBe(true);
		expect(owners.find(o => o.ownerId === other)!.devices[0].online).toBe(false);
	});
});

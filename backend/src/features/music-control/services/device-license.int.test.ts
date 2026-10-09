import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { DeviceService } from '@/features/music-control/services/device.service.js';
import { DeviceLicenseService } from '@/features/music-control/services/device-license.service.js';

// Per-device licenses (story 4.4) against the local Supabase stack: devices
// and device_control_licenses (015), follows (mutual friendship).

const deviceService = new DeviceService();
const licenseService = new DeviceLicenseService();

async function createUser(): Promise<string> {
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email: `int-${randomUUID()}@example.com`,
		password: 'integration-test-password',
		email_confirm: true,
	});
	if (error) throw error;
	const id = data.user.id;

	const { error: profileError } = await supabaseAdmin
		.from('user_profiles')
		.insert({ id, username: `int_${id.slice(0, 8)}`, display_name: `User ${id.slice(0, 4)}` });
	if (profileError) throw profileError;
	return id;
}

async function follow(followerId: string, followingId: string, canControlMusic = false) {
	const { error } = await supabaseAdmin.from('follows').insert({
		follower_id: followerId,
		following_id: followingId,
		can_control_music: canControlMusic,
	});
	if (error) throw error;
}

async function addDevice(userId: string, lastSeenAt: string): Promise<string> {
	const deviceId = `dev-${randomUUID()}`;
	const { error } = await supabaseAdmin.from('devices').insert({
		user_id: userId,
		device_id: deviceId,
		device_name: 'Test device',
		platform: 'android',
		model: 'Pixel Test',
		last_seen_at: lastSeenAt,
	});
	if (error) throw error;
	return deviceId;
}

async function licenseRows(ownerId: string, deviceId: string, granteeId: string) {
	const { data, error } = await supabaseAdmin
		.from('device_control_licenses')
		.select('created_at')
		.eq('owner_id', ownerId)
		.eq('device_id', deviceId)
		.eq('grantee_id', granteeId);
	if (error) throw error;
	return data;
}

describe('device licenses (story 4.4)', () => {
	// alice owns the devices; bob is her mutual friend; carol follows alice one
	// way; dave is a mutual friend with "all my devices"; eve is unrelated.
	let alice: string;
	let bob: string;
	let carol: string;
	let dave: string;
	let eve: string;
	let phone: string;
	let tablet: string;
	let bobDevice: string;

	beforeAll(async () => {
		[alice, bob, carol, dave, eve] = await Promise.all([
			createUser(),
			createUser(),
			createUser(),
			createUser(),
			createUser(),
		]);
		await follow(alice, bob);
		await follow(bob, alice);
		await follow(carol, alice, true); // stale switch, not mutual
		await follow(alice, dave);
		await follow(dave, alice, true);

		phone = await addDevice(alice, '2026-10-09T12:00:00.000Z');
		tablet = await addDevice(alice, '2026-10-08T12:00:00.000Z');
		bobDevice = await addDevice(bob, '2026-10-09T12:00:00.000Z');
	});

	afterAll(async () => {
		// Cascades to profiles, follows, devices and licenses.
		for (const id of [alice, bob, carol, dave, eve]) {
			if (id) await supabaseAdmin.auth.admin.deleteUser(id);
		}
	});

	it('grants a mutual friend a license on an own device', async () => {
		const result = await licenseService.grant(alice, phone, bob);

		expect(result.deviceId).toBe(phone);
		expect(result.license.user).toEqual({
			id: bob,
			username: `int_${bob.slice(0, 8)}`,
			displayName: `User ${bob.slice(0, 4)}`,
			avatarUrl: null,
		});
		expect(Date.parse(result.license.grantedAt)).not.toBeNaN();
		expect(await licenseRows(alice, phone, bob)).toHaveLength(1);
	});

	it('is idempotent: granting again keeps one row and the first grantedAt', async () => {
		const [first] = await licenseRows(alice, phone, bob);
		const again = await licenseService.grant(alice, phone, bob);

		const rows = await licenseRows(alice, phone, bob);
		expect(rows).toHaveLength(1);
		expect(Date.parse(again.license.grantedAt)).toBe(Date.parse(first.created_at));
	});

	it('lists my devices with their licenses', async () => {
		const devices = await deviceService.listMyDevices(alice);

		expect(devices.map(d => d.deviceId)).toEqual([phone, tablet]);
		expect(devices[0]).toMatchObject({
			deviceName: 'Test device',
			platform: 'android',
			model: 'Pixel Test',
		});
		expect(devices[0].licenses).toHaveLength(1);
		expect(devices[0].licenses[0].user.id).toBe(bob);
		expect(devices[0].licenses[0].grantedAt).toEqual(expect.any(String));
		expect(devices[1].licenses).toEqual([]);
	});

	it('refuses to license the owner', async () => {
		await expect(licenseService.grant(alice, phone, alice)).rejects.toMatchObject({
			statusCode: 400,
			code: 'CANNOT_LICENSE_SELF',
		});
	});

	it("refuses a grant on another user's device or an unknown device", async () => {
		await expect(licenseService.grant(alice, bobDevice, bob)).rejects.toMatchObject({
			statusCode: 404,
			code: 'DEVICE_NOT_FOUND',
		});
		await expect(licenseService.grant(alice, 'unknown-device', bob)).rejects.toMatchObject({
			statusCode: 404,
			code: 'DEVICE_NOT_FOUND',
		});
		expect(await licenseRows(alice, bobDevice, bob)).toHaveLength(0);
	});

	it('refuses a grant to a non-friend (one-way follow or none)', async () => {
		for (const grantee of [carol, eve]) {
			await expect(licenseService.grant(alice, tablet, grantee)).rejects.toMatchObject({
				statusCode: 400,
				code: 'NOT_FRIENDS',
			});
			expect(await licenseRows(alice, tablet, grantee)).toHaveLength(0);
		}
	});

	it('lists the licensed device of a friend with access "license"', async () => {
		const result = await licenseService.listControllable(bob, alice);

		expect(result.allDevices).toBe(false);
		expect(result.devices).toHaveLength(1);
		expect(result.devices[0]).toMatchObject({ deviceId: phone, access: 'license' });
	});

	it('lists every device with access "all-devices" when the switch is on', async () => {
		const result = await licenseService.listControllable(dave, alice);

		expect(result.allDevices).toBe(true);
		expect(result.devices.map(d => d.deviceId)).toEqual([phone, tablet]);
		expect(result.devices.every(d => d.access === 'all-devices')).toBe(true);
	});

	it('answers the empty shape when not mutual friends, despite a stale switch or license', async () => {
		// carol follows alice, so the 015 foreign key allows a license row.
		const { error } = await supabaseAdmin
			.from('device_control_licenses')
			.insert({ owner_id: alice, device_id: tablet, grantee_id: carol });
		if (error) throw error;

		expect(await licenseService.listControllable(carol, alice)).toEqual({
			allDevices: false,
			devices: [],
		});
		expect(await licenseService.listControllable(eve, alice)).toEqual({
			allDevices: false,
			devices: [],
		});

		// The owner still sees the stale license so they can revoke it.
		const myTablet = (await deviceService.listMyDevices(alice)).find(d => d.deviceId === tablet);
		expect(myTablet?.licenses.map(l => l.user.id)).toEqual([carol]);
	});

	it("refuses a revoke on another user's device and leaves its license untouched", async () => {
		await licenseService.grant(bob, bobDevice, alice);

		await expect(licenseService.revoke(alice, bobDevice, alice)).rejects.toMatchObject({
			statusCode: 404,
			code: 'DEVICE_NOT_FOUND',
		});
		expect(await licenseRows(bob, bobDevice, alice)).toHaveLength(1);
	});

	it('revokes an existing license', async () => {
		await licenseService.revoke(alice, phone, bob);

		expect(await licenseRows(alice, phone, bob)).toHaveLength(0);
		expect((await licenseService.listControllable(bob, alice)).devices).toEqual([]);
	});

	it('revokes without error when there is no license (none, self, non-friend)', async () => {
		await expect(licenseService.revoke(alice, phone, bob)).resolves.toBeUndefined();
		await expect(licenseService.revoke(alice, phone, alice)).resolves.toBeUndefined();
		await expect(licenseService.revoke(alice, phone, eve)).resolves.toBeUndefined();
	});
});

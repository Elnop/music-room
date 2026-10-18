import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { DeviceService } from '@/features/music-control/services/device.service.js';
import { DeviceLicenseService } from '@/features/music-control/services/device-license.service.js';
import { ControllableDevicesService } from '@/features/music-control/services/controllable-devices.service.js';

// Renaming a device (#352) against the local Supabase stack: devices.custom_name
// (026) is shown in place of the system name and survives reconnections.

const deviceService = new DeviceService();
const licenseService = new DeviceLicenseService();
const pickerService = new ControllableDevicesService();

const SYSTEM_NAME = 'sdk_gphone64_x86_64';

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
		.insert({ id, username: `int_${id.slice(0, 8)}` });
	if (profileError) throw profileError;
	return id;
}

function connection(deviceId: string, deviceName = SYSTEM_NAME) {
	return { deviceId, deviceName, platform: 'android', model: 'Pixel Test' };
}

async function storedRow(userId: string, deviceId: string) {
	const { data, error } = await supabaseAdmin
		.from('devices')
		.select('device_name, custom_name')
		.eq('user_id', userId)
		.eq('device_id', deviceId)
		.single();
	if (error) throw error;
	return data;
}

describe('device rename (#352)', () => {
	// alice owns the device; bob is her mutual friend with "all my devices".
	let alice: string;
	let bob: string;
	let phone: string;
	let bobDevice: string;

	beforeAll(async () => {
		[alice, bob] = await Promise.all([createUser(), createUser()]);
		const { error } = await supabaseAdmin.from('follows').insert([
			{ follower_id: alice, following_id: bob },
			{ follower_id: bob, following_id: alice, can_control_music: true },
		]);
		if (error) throw error;

		phone = `dev-${randomUUID()}`;
		bobDevice = `dev-${randomUUID()}`;
		await deviceService.recordConnection(alice, connection(phone));
		await deviceService.recordConnection(bob, connection(bobDevice));
	});

	afterAll(async () => {
		// Cascades to profiles, follows and devices.
		for (const id of [alice, bob]) {
			if (id) await supabaseAdmin.auth.admin.deleteUser(id);
		}
	});

	it('renames my device and shows the chosen name', async () => {
		const device = await deviceService.renameDevice(alice, phone, 'Salon');

		expect(device).toMatchObject({ deviceId: phone, deviceName: 'Salon' });
		expect(await storedRow(alice, phone)).toEqual({
			device_name: SYSTEM_NAME,
			custom_name: 'Salon',
		});
		const mine = await deviceService.listMyDevices(alice);
		expect(mine.find(d => d.deviceId === phone)?.deviceName).toBe('Salon');
	});

	it("shows the chosen name in a friend's views", async () => {
		const controllable = await licenseService.listControllable(bob, alice);
		expect(controllable.devices.find(d => d.deviceId === phone)?.deviceName).toBe('Salon');

		const picker = await pickerService.list(bob);
		const aliceOwner = picker.owners.find(o => o.ownerId === alice);
		expect(aliceOwner?.devices.find(d => d.deviceId === phone)?.deviceName).toBe('Salon');
	});

	it('keeps the chosen name when the device connects again', async () => {
		const shown = await deviceService.recordConnection(alice, connection(phone, 'new_system'));

		expect(shown).toBe('Salon');
		expect(await storedRow(alice, phone)).toEqual({
			device_name: 'new_system',
			custom_name: 'Salon',
		});
	});

	it('goes back to the system name with null', async () => {
		const device = await deviceService.renameDevice(alice, phone, null);

		expect(device.deviceName).toBe('new_system');
		expect((await storedRow(alice, phone)).custom_name).toBeNull();
		await expect(
			deviceService.recordConnection(alice, connection(phone, 'new_system'))
		).resolves.toBe('new_system');
	});

	it("refuses another user's device with 404 DEVICE_NOT_FOUND and leaves it alone", async () => {
		await expect(deviceService.renameDevice(alice, bobDevice, 'Mine')).rejects.toMatchObject({
			statusCode: 404,
			code: 'DEVICE_NOT_FOUND',
		});
		expect((await storedRow(bob, bobDevice)).custom_name).toBeNull();
	});

	it('refuses an unknown device with 404 DEVICE_NOT_FOUND', async () => {
		await expect(
			deviceService.renameDevice(alice, `dev-${randomUUID()}`, 'Ghost')
		).rejects.toMatchObject({ statusCode: 404, code: 'DEVICE_NOT_FOUND' });
	});

	it('the database refuses a custom name outside 1 to 40 characters', async () => {
		for (const name of ['', 'x'.repeat(41)]) {
			const { error } = await supabaseAdmin
				.from('devices')
				.update({ custom_name: name })
				.eq('user_id', alice)
				.eq('device_id', phone);
			expect(error?.code).toBe('23514');
		}
	});
});

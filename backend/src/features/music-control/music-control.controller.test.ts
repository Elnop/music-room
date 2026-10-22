import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import * as permissions from '@/features/music-control/music-control.controller.js';
import * as devices from '@/features/music-control/music-control-devices.controller.js';
import * as licenses from '@/features/music-control/music-control-licenses.controller.js';
import { mockResponse } from '@/test/mock-response.js';

const svc = vi.hoisted(() => ({
	grantControl: vi.fn(),
	revokeControl: vi.fn(),
	getGrantedPermissions: vi.fn(),
	canControl: vi.fn(),
	listMyDevices: vi.fn(),
	renameDevice: vi.fn(),
	list: vi.fn(),
	grant: vi.fn(),
	revoke: vi.fn(),
	listControllable: vi.fn(),
	setDeviceName: vi.fn(),
}));
vi.mock('@/features/music-control/services/control-switch.service.js', () => ({
	grantControl: svc.grantControl,
	revokeControl: svc.revokeControl,
}));
vi.mock('@/features/music-control/services/control-permissions.service.js', () => ({
	getGrantedPermissions: svc.getGrantedPermissions,
	canControl: svc.canControl,
}));
vi.mock('@/features/music-control/services/device.service.js', () => ({
	listMyDevices: svc.listMyDevices,
	renameDevice: svc.renameDevice,
}));
vi.mock('@/features/music-control/services/controllable-devices.service.js', () => ({
	list: svc.list,
}));
vi.mock('@/features/music-control/services/device-license.service.js', () => ({
	grant: svc.grant,
	revoke: svc.revoke,
	listControllable: svc.listControllable,
}));
vi.mock('@/realtime/emitters/control.emitters.js', () => ({ setDeviceName: svc.setDeviceName }));

const ME = '11111111-1111-4111-8111-111111111111';
const FRIEND = '22222222-2222-4222-8222-222222222222';
const DEVICE = {
	deviceId: 'tv',
	deviceName: 'Salon',
	platform: 'android',
	model: 'X',
	lastSeenAt: '',
};

async function call(
	handler: (req: Request, res: Response) => Promise<void>,
	fields: Record<string, unknown> = {}
) {
	const res = mockResponse();
	const req = { user: { id: ME }, params: {}, body: undefined, ...fields } as unknown as Request;
	await handler(req, res as unknown as Response);
	return res;
}

beforeEach(() => {
	for (const fn of Object.values(svc)) fn.mockReset().mockResolvedValue(undefined);
});

describe('music-control.controller (permissions)', () => {
	it('getMyPermissions answers the friends I granted control', async () => {
		svc.getGrantedPermissions.mockResolvedValue([FRIEND]);

		const res = await call(permissions.getMyPermissions);

		expect(svc.getGrantedPermissions).toHaveBeenCalledWith(ME);
		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({ success: true, data: { allowedUserIds: [FRIEND] } });
	});

	it.each([
		['grantControl', permissions.grantControl, svc.grantControl],
		['revokeControl', permissions.revokeControl, svc.revokeControl],
	] as const)('%s acts on :userId and echoes it', async (_, handler, service) => {
		const res = await call(handler, { params: { userId: FRIEND } });

		expect(service).toHaveBeenCalledWith(ME, FRIEND);
		expect(res.body).toMatchObject({ data: { success: true, allowedUserId: FRIEND } });
	});

	it('checkCanControl answers whether the target granted me control', async () => {
		svc.canControl.mockResolvedValue(true);

		const res = await call(permissions.checkCanControl, { params: { userId: FRIEND } });

		expect(svc.canControl).toHaveBeenCalledWith(ME, FRIEND);
		expect(res.body).toMatchObject({ data: { canControl: true, targetUserId: FRIEND } });
	});

	it.each([
		['grantControl', permissions.grantControl],
		['revokeControl', permissions.revokeControl],
		['checkCanControl', permissions.checkCanControl],
	] as const)('%s refuses a :userId that is not a UUID v4 with INVALID_USER_ID', async (_, h) => {
		for (const userId of ['alice', '11111111-1111-1111-8111-111111111111']) {
			await expect(call(h, { params: { userId } })).rejects.toMatchObject({
				statusCode: 400,
				code: 'INVALID_USER_ID',
				message: 'Invalid user ID format',
			});
		}
		expect(svc.grantControl).not.toHaveBeenCalled();
		expect(svc.revokeControl).not.toHaveBeenCalled();
		expect(svc.canControl).not.toHaveBeenCalled();
	});
});

describe('music-control-devices.controller', () => {
	it('getMyDevices answers my devices', async () => {
		svc.listMyDevices.mockResolvedValue([{ ...DEVICE, licenses: [] }]);

		const res = await call(devices.getMyDevices);

		expect(svc.listMyDevices).toHaveBeenCalledWith(ME);
		expect(res.body).toMatchObject({ data: { devices: [{ deviceId: 'tv', licenses: [] }] } });
	});

	it('renameDevice renames, updates the connected socket and answers the device', async () => {
		svc.renameDevice.mockResolvedValue(DEVICE);

		const res = await call(devices.renameDevice, {
			params: { deviceId: 'tv' },
			body: { name: '  Salon ' },
		});

		expect(svc.renameDevice).toHaveBeenCalledWith(ME, 'tv', 'Salon');
		expect(svc.setDeviceName).toHaveBeenCalledWith(ME, 'tv', 'Salon');
		expect(res.body).toMatchObject({ data: { device: DEVICE } });
	});

	it('renameDevice rejects a body without name', async () => {
		await expect(
			call(devices.renameDevice, { params: { deviceId: 'tv' }, body: {} })
		).rejects.toBeInstanceOf(ZodError);
		expect(svc.renameDevice).not.toHaveBeenCalled();
	});

	it('getDevicePicker answers the device picker', async () => {
		const picker = { owners: [] };
		svc.list.mockResolvedValue(picker);

		const res = await call(devices.getDevicePicker);

		expect(svc.list).toHaveBeenCalledWith(ME);
		expect(res.body).toMatchObject({ data: picker });
	});
});

describe('music-control-licenses.controller', () => {
	const params = { deviceId: 'tv', userId: FRIEND };

	it('grantDeviceLicense answers the new license', async () => {
		const result = { deviceId: 'tv', license: { grantedAt: '' } };
		svc.grant.mockResolvedValue(result);

		const res = await call(licenses.grantDeviceLicense, { params });

		expect(svc.grant).toHaveBeenCalledWith(ME, 'tv', FRIEND);
		expect(res.body).toMatchObject({ data: result });
	});

	it('revokeDeviceLicense answers a message', async () => {
		const res = await call(licenses.revokeDeviceLicense, { params });

		expect(svc.revoke).toHaveBeenCalledWith(ME, 'tv', FRIEND);
		expect(res.body).toMatchObject({ data: { message: 'Device license revoked successfully' } });
	});

	it('getControllableDevices answers the devices of a friend I can control', async () => {
		const result = { allDevices: false, devices: [] };
		svc.listControllable.mockResolvedValue(result);

		const res = await call(licenses.getControllableDevices, { params: { userId: FRIEND } });

		expect(svc.listControllable).toHaveBeenCalledWith(ME, FRIEND);
		expect(res.body).toMatchObject({ data: result });
	});

	it.each([
		['grantDeviceLicense', licenses.grantDeviceLicense],
		['revokeDeviceLicense', licenses.revokeDeviceLicense],
		['getControllableDevices', licenses.getControllableDevices],
	] as const)('%s rejects a userId that is not a UUID', async (_, handler) => {
		await expect(
			call(handler, { params: { deviceId: 'tv', userId: 'bob' } })
		).rejects.toBeInstanceOf(ZodError);
	});
});

import { apiRequest, authRequest } from '@/shared/services/api';
import { musicControlApi } from './musicControlApi';

jest.mock('@/shared/services/api', () => ({
	apiRequest: jest.fn(),
	authRequest: jest.fn(),
}));

describe('musicControlApi', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('getMyPermissions calls apiRequest or authRequest', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce({ allowedUserIds: ['u1'] });
		const result = await musicControlApi.getMyPermissions();
		expect(apiRequest).toHaveBeenCalledWith('/api/music-control/permissions', {});
		expect(result).toEqual(['u1']);

		jest.mocked(authRequest).mockResolvedValueOnce({ allowedUserIds: ['u2'] });
		const resultToken = await musicControlApi.getMyPermissions('tok');
		expect(authRequest).toHaveBeenCalledWith('/api/music-control/permissions', 'tok', {});
		expect(resultToken).toEqual(['u2']);
	});

	it('grantControl sends POST', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce({ success: true, allowedUserId: 'u1' });
		await musicControlApi.grantControl('u1');
		expect(apiRequest).toHaveBeenCalledWith('/api/music-control/permissions/u1', {
			method: 'POST',
		});
	});

	it('revokeControl sends DELETE', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce({ success: true, allowedUserId: 'u1' });
		await musicControlApi.revokeControl('u1');
		expect(apiRequest).toHaveBeenCalledWith('/api/music-control/permissions/u1', {
			method: 'DELETE',
		});
	});

	it('canControl returns boolean and handles error', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce({ canControl: true, targetUserId: 'u1' });
		const res1 = await musicControlApi.canControl('u1');
		expect(res1).toBe(true);

		jest.mocked(apiRequest).mockRejectedValueOnce(new Error('fail'));
		const res2 = await musicControlApi.canControl('u1');
		expect(res2).toBe(false);
	});

	it('getMyDevices returns devices array', async () => {
		const devices = [{ deviceId: 'd1', deviceName: 'D1' }];
		jest.mocked(apiRequest).mockResolvedValueOnce({ devices });
		const res = await musicControlApi.getMyDevices();
		expect(apiRequest).toHaveBeenCalledWith('/api/music-control/devices', {});
		expect(res).toEqual(devices);
	});

	it('renameDevice sends PATCH with name or null', async () => {
		const device = { deviceId: 'd1', deviceName: 'Salon' };
		jest.mocked(apiRequest).mockResolvedValueOnce({ device });
		const res = await musicControlApi.renameDevice('d1', 'Salon');
		expect(apiRequest).toHaveBeenCalledWith('/api/music-control/devices/d1', {
			method: 'PATCH',
			body: JSON.stringify({ name: 'Salon' }),
		});
		expect(res).toEqual(device);
	});

	it('getControllableDevices calls user devices endpoint', async () => {
		const payload = { allDevices: true, devices: [] };
		jest.mocked(apiRequest).mockResolvedValueOnce(payload);
		const res = await musicControlApi.getControllableDevices('u1');
		expect(apiRequest).toHaveBeenCalledWith('/api/music-control/users/u1/devices', {});
		expect(res).toEqual(payload);
	});

	it('getDevicePicker calls controllable-devices endpoint', async () => {
		const payload = { myDevices: [], friendDevices: [] };
		jest.mocked(apiRequest).mockResolvedValueOnce(payload);
		const res = await musicControlApi.getDevicePicker();
		expect(apiRequest).toHaveBeenCalledWith('/api/music-control/controllable-devices', {});
		expect(res).toEqual(payload);
	});

	it('grantDeviceLicense and revokeDeviceLicense send POST and DELETE', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce({ success: true });
		await musicControlApi.grantDeviceLicense('d1', 'u1');
		expect(apiRequest).toHaveBeenCalledWith('/api/music-control/devices/d1/licenses/u1', {
			method: 'POST',
		});

		jest.mocked(apiRequest).mockResolvedValueOnce({ success: true });
		await musicControlApi.revokeDeviceLicense('d1', 'u1');
		expect(apiRequest).toHaveBeenCalledWith('/api/music-control/devices/d1/licenses/u1', {
			method: 'DELETE',
		});
	});
});

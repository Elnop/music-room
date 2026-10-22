import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	assertCanManageQueue,
	resolvePlaybackDevice,
} from '@/features/queue/permissions/queue.permissions.js';

const { canControlAnyDevice, canControlDevice, isDeviceOnline } = vi.hoisted(() => ({
	canControlAnyDevice: vi.fn(),
	canControlDevice: vi.fn(),
	isDeviceOnline: vi.fn(),
}));

vi.mock('@/features/music-control/services/control-access.service.js', () => ({
	canControlAnyDevice,
	canControlDevice,
}));

vi.mock('@/realtime/index.js', () => ({
	realtime: { isDeviceOnline },
}));

beforeEach(() => {
	vi.clearAllMocks();
	canControlAnyDevice.mockResolvedValue(false);
	canControlDevice.mockResolvedValue(false);
	isDeviceOnline.mockReturnValue(true);
});

describe('assertCanManageQueue', () => {
	it('lets the owner manage their queue without any lookup', async () => {
		await expect(assertCanManageQueue('owner', 'owner')).resolves.toBeUndefined();
		expect(canControlAnyDevice).not.toHaveBeenCalled();
	});

	it('lets a friend who controls at least one device manage the queue', async () => {
		canControlAnyDevice.mockResolvedValue(true);
		await expect(assertCanManageQueue('friend', 'owner')).resolves.toBeUndefined();
		expect(canControlAnyDevice).toHaveBeenCalledWith('friend', 'owner');
	});

	it('refuses anyone else with 403 QUEUE_ACCESS_DENIED', async () => {
		await expect(assertCanManageQueue('stranger', 'owner')).rejects.toMatchObject({
			statusCode: 403,
			code: 'QUEUE_ACCESS_DENIED',
		});
	});
});

describe('resolvePlaybackDevice', () => {
	it('lets the owner play on the calling device when no deviceId is sent', async () => {
		await expect(resolvePlaybackDevice('owner', 'owner', undefined)).resolves.toBeNull();
	});

	it('requires a deviceId from a delegate', async () => {
		canControlAnyDevice.mockResolvedValue(true);
		await expect(resolvePlaybackDevice('friend', 'owner', undefined)).rejects.toMatchObject({
			statusCode: 400,
			code: 'DEVICE_ID_REQUIRED',
		});
	});

	it('returns a licensed, online device of the owner', async () => {
		canControlDevice.mockResolvedValue(true);
		await expect(resolvePlaybackDevice('friend', 'owner', 'tv')).resolves.toBe('tv');
		expect(canControlDevice).toHaveBeenCalledWith('friend', 'owner', 'tv');
		expect(isDeviceOnline).toHaveBeenCalledWith('owner', 'tv');
	});

	it('refuses a device the actor holds no license on with 403', async () => {
		await expect(resolvePlaybackDevice('friend', 'owner', 'tv')).rejects.toMatchObject({
			statusCode: 403,
			code: 'QUEUE_ACCESS_DENIED',
		});
		expect(isDeviceOnline).not.toHaveBeenCalled();
	});

	it('refuses an offline device with 409 DEVICE_OFFLINE', async () => {
		canControlDevice.mockResolvedValue(true);
		isDeviceOnline.mockReturnValue(false);
		await expect(resolvePlaybackDevice('owner', 'owner', 'tablet')).rejects.toMatchObject({
			statusCode: 409,
			code: 'DEVICE_OFFLINE',
		});
	});

	it("checks the device under the owner's id, so another user's device is offline", async () => {
		canControlDevice.mockResolvedValue(true);
		isDeviceOnline.mockImplementation((userId: string) => userId === 'someone-else');
		await expect(resolvePlaybackDevice('owner', 'owner', 'their-device')).rejects.toMatchObject({
			code: 'DEVICE_OFFLINE',
		});
	});
});

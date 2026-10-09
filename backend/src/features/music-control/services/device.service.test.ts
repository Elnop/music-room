import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeviceService } from '@/features/music-control/services/device.service.js';
import { AppError } from '@/shared/middleware/error-handler.js';

const { from, upsert } = vi.hoisted(() => {
	const upsert = vi.fn();
	return { upsert, from: vi.fn(() => ({ upsert })) };
});

vi.mock('@/shared/config/supabase.js', () => ({
	supabaseAdmin: { from },
}));

vi.mock('@/shared/utils/logger.js', () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const NOW = new Date('2026-10-09T12:00:00.000Z');

const device = {
	deviceId: 'device-1',
	deviceName: 'Pixel',
	platform: 'android',
	model: 'Pixel 8',
};

describe('DeviceService.recordConnection', () => {
	const service = new DeviceService();

	beforeEach(() => {
		from.mockClear();
		upsert.mockReset().mockResolvedValue({ error: null });
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('upserts the device on (user_id, device_id) with last_seen_at = now', async () => {
		await service.recordConnection('user-1', device);

		expect(from).toHaveBeenCalledWith('devices');
		expect(upsert).toHaveBeenCalledTimes(1);
		expect(upsert).toHaveBeenCalledWith(
			{
				user_id: 'user-1',
				device_id: 'device-1',
				device_name: 'Pixel',
				platform: 'android',
				model: 'Pixel 8',
				last_seen_at: NOW.toISOString(),
			},
			{ onConflict: 'user_id,device_id' }
		);
	});

	it('leaves created_at out of the payload so an existing row keeps it', async () => {
		await service.recordConnection('user-1', device);

		const [payload] = upsert.mock.calls[0] as [Record<string, unknown>];
		expect(payload).not.toHaveProperty('created_at');
	});

	it('throws DEVICE_REGISTRATION_FAILED when Supabase returns an error', async () => {
		upsert.mockResolvedValue({ error: { message: 'boom', code: '500' } });

		const error: unknown = await service
			.recordConnection('user-1', device)
			.catch((e: unknown) => e);
		expect(error).toBeInstanceOf(AppError);
		expect(error).toMatchObject({ code: 'DEVICE_REGISTRATION_FAILED' });
	});
});

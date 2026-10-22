import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as service from '@/features/music-control/services/device.service.js';
import { AppError } from '@/shared/middleware/error-handler.js';

const { from, upsert, single, update, maybeSingle, eq, select } = vi.hoisted(() => {
	// upsert(...).select('custom_name').single()
	const single = vi.fn();
	const upsert = vi.fn(() => ({ select: () => ({ single }) }));
	// update(...).eq().eq().select(...).maybeSingle()
	const maybeSingle = vi.fn();
	const select = vi.fn(() => ({ maybeSingle }));
	const eq = vi.fn();
	const chain = { eq, select };
	eq.mockReturnValue(chain);
	const update = vi.fn(() => chain);
	return {
		upsert,
		single,
		update,
		maybeSingle,
		eq,
		select,
		from: vi.fn(() => ({ upsert, update })),
	};
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

describe('device.service recordConnection', () => {
	beforeEach(() => {
		from.mockClear();
		upsert.mockClear();
		single.mockReset().mockResolvedValue({ data: { custom_name: null }, error: null });
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

		const [payload] = upsert.mock.calls[0] as unknown as [Record<string, unknown>];
		expect(payload).not.toHaveProperty('created_at');
	});

	it('leaves custom_name out of the payload so a chosen name survives (#352)', async () => {
		await service.recordConnection('user-1', device);

		const [payload] = upsert.mock.calls[0] as unknown as [Record<string, unknown>];
		expect(payload).not.toHaveProperty('custom_name');
	});

	it('returns the system name when the owner chose none', async () => {
		await expect(service.recordConnection('user-1', device)).resolves.toBe('Pixel');
	});

	it("returns the owner's custom name when set (#352)", async () => {
		single.mockResolvedValue({ data: { custom_name: 'Salon' }, error: null });

		await expect(service.recordConnection('user-1', device)).resolves.toBe('Salon');
	});

	it('throws DEVICE_REGISTRATION_FAILED when Supabase returns an error', async () => {
		single.mockResolvedValue({ data: null, error: { message: 'boom', code: '500' } });

		const error: unknown = await service
			.recordConnection('user-1', device)
			.catch((e: unknown) => e);
		expect(error).toBeInstanceOf(AppError);
		expect(error).toMatchObject({ code: 'DEVICE_REGISTRATION_FAILED' });
	});
});

describe('device.service renameDevice (#352)', () => {
	const row = {
		device_id: 'device-1',
		device_name: 'sdk_gphone64_x86_64',
		custom_name: 'Salon',
		platform: 'android',
		model: 'Pixel 8',
		last_seen_at: NOW.toISOString(),
	};

	beforeEach(() => {
		from.mockClear();
		update.mockClear();
		eq.mockClear();
		select.mockClear();
		maybeSingle.mockReset().mockResolvedValue({ data: row, error: null });
	});

	it("updates custom_name on the owner's device only and shows the chosen name", async () => {
		const result = await service.renameDevice('user-1', 'device-1', 'Salon');

		expect(from).toHaveBeenCalledWith('devices');
		expect(update).toHaveBeenCalledWith({ custom_name: 'Salon' });
		expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
		expect(eq).toHaveBeenCalledWith('device_id', 'device-1');
		expect(result).toEqual({
			deviceId: 'device-1',
			deviceName: 'Salon',
			platform: 'android',
			model: 'Pixel 8',
			lastSeenAt: NOW.toISOString(),
		});
	});

	it('goes back to the system name with null', async () => {
		maybeSingle.mockResolvedValue({ data: { ...row, custom_name: null }, error: null });

		const result = await service.renameDevice('user-1', 'device-1', null);

		expect(update).toHaveBeenCalledWith({ custom_name: null });
		expect(result.deviceName).toBe('sdk_gphone64_x86_64');
	});

	it('throws 404 DEVICE_NOT_FOUND when no device of the owner matches', async () => {
		maybeSingle.mockResolvedValue({ data: null, error: null });

		const error: unknown = await service
			.renameDevice('user-1', 'someone-elses', 'Salon')
			.catch((e: unknown) => e);
		expect(error).toBeInstanceOf(AppError);
		expect(error).toMatchObject({ statusCode: 404, code: 'DEVICE_NOT_FOUND' });
	});

	it('throws DEVICE_RENAME_ERROR when Supabase returns an error', async () => {
		maybeSingle.mockResolvedValue({ data: null, error: { message: 'boom', code: '500' } });

		await expect(service.renameDevice('user-1', 'device-1', 'Salon')).rejects.toMatchObject({
			code: 'DEVICE_RENAME_ERROR',
		});
	});
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ControlAccessService } from '@/features/music-control/services/control-access.service.js';

type Result = { data: unknown; error: { message: string; code?: string } | null };

/** Results served in call order: follows(controller→owner), follows(owner→controller), licenses */
const { from, results } = vi.hoisted(() => {
	const results: { follows: Result[]; device_control_licenses: Result[] } = {
		follows: [],
		device_control_licenses: [],
	};
	const from = vi.fn((table: keyof typeof results) => {
		const next = () => results[table].shift() ?? { data: null, error: null };
		const builder: Record<string, unknown> = {};
		builder.select = () => builder;
		builder.eq = () => builder;
		builder.maybeSingle = () => Promise.resolve(next());
		builder.then = (resolve: (r: Result) => unknown, reject: (e: unknown) => unknown) =>
			Promise.resolve(next()).then(resolve, reject);
		return builder;
	});
	return { from, results };
});

vi.mock('@/shared/config/supabase.js', () => ({
	supabaseAdmin: { from },
}));

const logError = vi.hoisted(() => vi.fn());

vi.mock('@/shared/utils/logger.js', () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: logError, debug: vi.fn() },
}));

const ok = (data: unknown): Result => ({ data, error: null });
const dbError: Result = { data: null, error: { message: 'connection reset', code: '08006' } };

describe('ControlAccessService', () => {
	const service = new ControlAccessService();

	beforeEach(() => {
		from.mockClear();
		logError.mockClear();
		results.follows = [];
		results.device_control_licenses = [];
	});

	it('gives the owner every one of their own devices, without any query', async () => {
		const access = await service.getAccess('owner', 'owner');
		expect(access).toEqual({ isFriend: false, allDevices: true, licensedDeviceIds: [] });
		expect(from).not.toHaveBeenCalled();
		expect(await service.canControlDevice('owner', 'owner', 'any-device')).toBe(true);
		expect(await service.canControlAnyDevice('owner', 'owner')).toBe(true);
	});

	it('allows the licensed device only, between mutual friends with the switch off', async () => {
		const serve = () => {
			results.follows = [ok({ can_control_music: false }), ok({ follower_id: 'owner' })];
			results.device_control_licenses = [ok([{ device_id: 'A' }])];
		};
		serve();
		expect(await service.canControlDevice('bob', 'alice', 'A')).toBe(true);
		serve();
		expect(await service.canControlDevice('bob', 'alice', 'B')).toBe(false);
	});

	it('refuses a stale switch when the owner does not follow back', async () => {
		results.follows = [ok({ can_control_music: true }), ok(null)];
		expect(await service.canControlAnyDevice('bob', 'alice')).toBe(false);
	});

	it.each([
		['the follows query', () => (results.follows = [dbError, ok({ follower_id: 'owner' })])],
		[
			'the licenses query',
			() => {
				results.follows = [ok({ can_control_music: false }), ok({ follower_id: 'owner' })];
				results.device_control_licenses = [dbError];
			},
		],
	])('refuses and logs on a database error in %s', async (_label, serve) => {
		serve();
		expect(await service.canControlDevice('bob', 'alice', 'A')).toBe(false);
		serve();
		expect(await service.canControlAnyDevice('bob', 'alice')).toBe(false);
		expect(logError).toHaveBeenCalled();
	});

	it('refuses when the client throws', async () => {
		from.mockImplementationOnce(() => {
			throw new Error('boom');
		});
		expect(await service.canControlAnyDevice('bob', 'alice')).toBe(false);
		expect(logError).toHaveBeenCalled();
	});

	it('getAccess throws a 500 DEVICE_FETCH_ERROR on a database error', async () => {
		results.follows = [dbError, ok(null)];
		await expect(service.getAccess('bob', 'alice')).rejects.toMatchObject({
			statusCode: 500,
			code: 'DEVICE_FETCH_ERROR',
		});
	});
});

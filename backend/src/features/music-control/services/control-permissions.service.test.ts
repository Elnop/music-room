import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as controlPermissions from '@/features/music-control/services/control-permissions.service.js';

type Result = { data: unknown; error: { message: string; code?: string } | null };

const m = vi.hoisted(() => {
	const results: Result[] = [];
	const builder: Record<string, unknown> = {};
	for (const step of ['select', 'eq']) builder[step] = () => builder;
	builder.single = () => Promise.resolve(results.shift());
	builder.then = (resolve: (r: unknown) => unknown, reject: (e: unknown) => unknown) =>
		Promise.resolve(results.shift()).then(resolve, reject);
	return { results, from: vi.fn(() => builder), error: vi.fn() };
});

vi.mock('@/shared/config/supabase.js', () => ({ supabaseAdmin: { from: m.from } }));
vi.mock('@/shared/utils/logger.js', () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: m.error, debug: vi.fn() },
}));

const ok = (data: unknown): Result => ({ data, error: null });
const dbError: Result = { data: null, error: { message: 'connection reset', code: '08006' } };

beforeEach(() => {
	vi.clearAllMocks();
	m.results.length = 0;
});

describe('control-permissions.service', () => {
	it('getGrantedPermissions lists the users the switch is on for', async () => {
		m.results.push(ok([{ follower_id: 'bob' }, { follower_id: 'dave' }]));
		await expect(controlPermissions.getGrantedPermissions('alice')).resolves.toEqual([
			'bob',
			'dave',
		]);

		m.results.push(ok(null));
		await expect(controlPermissions.getGrantedPermissions('alice')).resolves.toEqual([]);
	});

	it('getGrantedPermissions answers 500 GET_PERMISSIONS_ERROR on any failure', async () => {
		m.results.push(dbError);
		await expect(controlPermissions.getGrantedPermissions('alice')).rejects.toMatchObject({
			code: 'GET_PERMISSIONS_ERROR',
		});

		m.from.mockImplementationOnce(() => {
			throw new Error('boom');
		});
		await expect(controlPermissions.getGrantedPermissions('alice')).rejects.toMatchObject({
			statusCode: 500,
			code: 'GET_PERMISSIONS_ERROR',
		});
	});

	it('canControl reads the switch and fails closed', async () => {
		m.results.push(ok({ can_control_music: true }));
		expect(await controlPermissions.canControl('bob', 'alice')).toBe(true);

		m.results.push({ data: null, error: { message: 'no row', code: 'PGRST116' } });
		expect(await controlPermissions.canControl('bob', 'alice')).toBe(false);
		expect(m.error).not.toHaveBeenCalled();

		m.results.push(dbError);
		expect(await controlPermissions.canControl('bob', 'alice')).toBe(false);
		expect(m.error).toHaveBeenCalledTimes(1);

		m.from.mockImplementationOnce(() => {
			throw new Error('boom');
		});
		expect(await controlPermissions.canControl('bob', 'alice')).toBe(false);
	});
});

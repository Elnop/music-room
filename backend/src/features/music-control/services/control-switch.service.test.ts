import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as controlSwitch from '@/features/music-control/services/control-switch.service.js';

type Result = { data: unknown; error: { message: string; code?: string } | null };

const m = vi.hoisted(() => {
	const results: Result[] = [];
	const builder: Record<string, unknown> = {};
	const update = vi.fn(() => builder);
	for (const step of ['select', 'eq']) builder[step] = () => builder;
	builder.update = update;
	builder.single = () => Promise.resolve(results.shift());
	builder.then = (resolve: (r: unknown) => unknown, reject: (e: unknown) => unknown) =>
		Promise.resolve(results.shift()).then(resolve, reject);
	return {
		results,
		update,
		from: vi.fn(() => builder),
		getFollowStatus: vi.fn(),
		notifyPermissionChange: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
	};
});

vi.mock('@/shared/config/supabase.js', () => ({ supabaseAdmin: { from: m.from } }));
vi.mock('@/shared/utils/logger.js', () => ({
	logger: { info: vi.fn(), warn: m.warn, error: m.error, debug: vi.fn() },
}));
vi.mock('@/features/friends/services/friends.service.js', () => ({
	FriendsService: class {
		getFollowStatus = m.getFollowStatus;
	},
}));
vi.mock('@/realtime/index.js', () => ({
	realtime: { notifyPermissionChange: m.notifyPermissionChange },
}));

const ok = (data: unknown): Result => ({ data, error: null });
const dbError: Result = { data: null, error: { message: 'connection reset', code: '08006' } };

beforeEach(() => {
	vi.clearAllMocks();
	m.results.length = 0;
	m.getFollowStatus.mockResolvedValue({ isFriend: true });
	m.notifyPermissionChange.mockResolvedValue(undefined);
});

describe('control-switch.service grantControl', () => {
	it('turns the switch on and tells the friend', async () => {
		m.results.push(ok([{ follower_id: 'bob' }]));

		await controlSwitch.grantControl('alice', 'bob');

		expect(m.update).toHaveBeenCalledWith({ can_control_music: true });
		expect(m.notifyPermissionChange).toHaveBeenCalledWith('bob', 'alice', true);
	});

	it('refuses a user who is not a mutual friend with 400 NOT_FRIENDS', async () => {
		m.getFollowStatus.mockResolvedValue({ isFriend: false });

		await expect(controlSwitch.grantControl('alice', 'bob')).rejects.toMatchObject({
			statusCode: 400,
			code: 'NOT_FRIENDS',
		});
		expect(m.from).not.toHaveBeenCalled();
	});

	it('answers 400 FOLLOW_NOT_FOUND when no row was updated', async () => {
		m.results.push(ok([]));

		await expect(controlSwitch.grantControl('alice', 'bob')).rejects.toMatchObject({
			statusCode: 400,
			code: 'FOLLOW_NOT_FOUND',
		});
		expect(m.notifyPermissionChange).not.toHaveBeenCalled();
	});

	it('answers 500 GRANT_CONTROL_ERROR on a database error or an unexpected throw', async () => {
		m.results.push(dbError);
		await expect(controlSwitch.grantControl('alice', 'bob')).rejects.toMatchObject({
			statusCode: 500,
			code: 'GRANT_CONTROL_ERROR',
		});

		m.getFollowStatus.mockRejectedValue(new Error('boom'));
		await expect(controlSwitch.grantControl('alice', 'bob')).rejects.toMatchObject({
			statusCode: 500,
			code: 'GRANT_CONTROL_ERROR',
			message: 'Failed to grant control',
		});
		expect(m.error).toHaveBeenCalledWith('Unexpected error granting music control', {
			error: expect.any(Error),
		});
	});
});

describe('control-switch.service revokeControl', () => {
	it('turns the switch off and tells the user, even without a row', async () => {
		m.results.push(ok([]));

		await controlSwitch.revokeControl('alice', 'bob');

		expect(m.update).toHaveBeenCalledWith({ can_control_music: false });
		expect(m.warn).toHaveBeenCalled();
		expect(m.notifyPermissionChange).toHaveBeenCalledWith('bob', 'alice', false);
	});

	it('answers 500 REVOKE_CONTROL_ERROR on a database error or an unexpected throw', async () => {
		m.results.push(dbError);
		await expect(controlSwitch.revokeControl('alice', 'bob')).rejects.toMatchObject({
			code: 'REVOKE_CONTROL_ERROR',
		});

		m.results.push(ok([{}]));
		m.notifyPermissionChange.mockRejectedValue(new Error('boom'));
		await expect(controlSwitch.revokeControl('alice', 'bob')).rejects.toMatchObject({
			statusCode: 500,
			code: 'REVOKE_CONTROL_ERROR',
		});
	});
});

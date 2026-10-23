import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as follow from '@/features/friends/services/follow.service.js';
import { AppError } from '@/shared/middleware/error-handler.js';

type Result = { data?: unknown; error: { message: string; code?: string } | null };

// Each `from()` takes the next queued result; the builder resolves to it.
const m = vi.hoisted(() => {
	const results: Result[] = [];
	const insert = vi.fn();
	const from = vi.fn(() => {
		const result = results.shift();
		const builder: Record<string, unknown> = {};
		for (const step of ['select', 'eq', 'delete']) builder[step] = () => builder;
		builder.insert = (row: unknown) => {
			insert(row);
			return builder;
		};
		builder.maybeSingle = () => Promise.resolve(result);
		builder.then = (resolve: (r: unknown) => unknown) => Promise.resolve(result).then(resolve);
		return builder;
	});
	return {
		results,
		from,
		insert,
		getFollowStatus: vi.fn(),
		revalidateListeningAccess: vi.fn(),
		error: vi.fn(),
	};
});

vi.mock('@/shared/config/supabase.js', () => ({ supabaseAdmin: { from: m.from } }));
vi.mock('@/shared/utils/logger.js', () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: m.error, debug: vi.fn() },
}));
vi.mock('@/features/friends/services/follow-status.service.js', () => ({
	getFollowStatus: m.getFollowStatus,
}));
vi.mock('@/features/friends/utils/listening-access.js', () => ({
	revalidateListeningAccess: m.revalidateListeningAccess,
}));

const STATUS = { isFriend: false };
const ok = (data: unknown = null): Result => ({ data, error: null });

beforeEach(() => {
	vi.clearAllMocks();
	m.results.length = 0;
	m.getFollowStatus.mockResolvedValue(STATUS);
	m.revalidateListeningAccess.mockResolvedValue(undefined);
});

describe('follow.service followUser', () => {
	it('refuses a self-follow with 400 SELF_FOLLOW_ERROR before any query', async () => {
		const error = await follow.followUser('a', 'a').catch((e: unknown) => e);

		expect(error).toBeInstanceOf(AppError);
		expect(error).toMatchObject({ statusCode: 400, code: 'SELF_FOLLOW_ERROR' });
		expect(m.from).not.toHaveBeenCalled();
	});

	it('follows the user and answers the new status', async () => {
		m.results.push(ok({ id: 'b' }), ok());

		await expect(follow.followUser('a', 'b')).resolves.toEqual({ success: true, status: STATUS });
		expect(m.insert).toHaveBeenCalledWith({ follower_id: 'a', following_id: 'b' });
		expect(m.getFollowStatus).toHaveBeenCalledWith('a', 'b');
	});

	it.each([
		['unknown', ok(null)],
		['failing', { data: null, error: { message: 'boom' } }],
	])('answers 404 USER_NOT_FOUND for an %s target lookup', async (_, lookup) => {
		m.results.push(lookup);

		await expect(follow.followUser('a', 'b')).rejects.toMatchObject({
			statusCode: 404,
			code: 'USER_NOT_FOUND',
		});
	});

	it('treats an existing follow (23505) as done', async () => {
		m.results.push(ok({ id: 'b' }), { error: { message: 'dup', code: '23505' } });

		await expect(follow.followUser('a', 'b')).resolves.toEqual({ success: true, status: STATUS });
		expect(m.error).not.toHaveBeenCalled();
	});

	it('answers another insert error as 500 FOLLOW_ERROR', async () => {
		m.results.push(ok({ id: 'b' }), { error: { message: 'boom', code: '08006' } });

		await expect(follow.followUser('a', 'b')).rejects.toMatchObject({
			statusCode: 500,
			code: 'FOLLOW_ERROR',
		});
	});

	it('answers an unexpected exception as 500 FOLLOW_ERROR', async () => {
		m.from.mockImplementationOnce(() => {
			throw new Error('network');
		});

		await expect(follow.followUser('a', 'b')).rejects.toMatchObject({
			statusCode: 500,
			code: 'FOLLOW_ERROR',
		});
	});
});

describe('follow.service unfollowUser', () => {
	it('unfollows, revalidates listening access both ways and answers the new status', async () => {
		m.results.push(ok());

		await expect(follow.unfollowUser('a', 'b')).resolves.toEqual({
			success: true,
			status: STATUS,
		});
		expect(m.revalidateListeningAccess).toHaveBeenCalledWith('a', 'b');
		expect(m.revalidateListeningAccess).toHaveBeenCalledWith('b', 'a');
	});

	it('answers a failed delete as 500 UNFOLLOW_ERROR', async () => {
		m.results.push({ error: { message: 'boom' } });

		await expect(follow.unfollowUser('a', 'b')).rejects.toMatchObject({
			statusCode: 500,
			code: 'UNFOLLOW_ERROR',
		});
		expect(m.revalidateListeningAccess).not.toHaveBeenCalled();
	});

	it('answers an unexpected exception as 500 UNFOLLOW_ERROR', async () => {
		m.getFollowStatus.mockRejectedValue(new Error('network'));
		m.results.push(ok());

		await expect(follow.unfollowUser('a', 'b')).rejects.toMatchObject({
			statusCode: 500,
			code: 'UNFOLLOW_ERROR',
		});
	});
});

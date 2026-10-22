import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as followStatus from '@/features/friends/services/follow-status.service.js';

type Result = { data?: unknown; count?: number | null; error: { message: string } | null };

// Each `from()` takes the next queued result; the builder resolves to it.
const m = vi.hoisted(() => {
	const results: Result[] = [];
	const from = vi.fn(() => {
		const result = results.shift();
		const builder: Record<string, unknown> = {};
		for (const step of ['select', 'eq']) builder[step] = () => builder;
		builder.maybeSingle = () => Promise.resolve(result);
		builder.then = (resolve: (r: unknown) => unknown) => Promise.resolve(result).then(resolve);
		return builder;
	});
	return { results, from, error: vi.fn() };
});

vi.mock('@/shared/config/supabase.js', () => ({ supabaseAdmin: { from: m.from } }));
vi.mock('@/shared/utils/logger.js', () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: m.error, debug: vi.fn() },
}));

const row = (data: unknown): Result => ({ data, error: null });
const count = (n: number | null): Result => ({ count: n, error: null });
const dbError: Result = { data: null, error: { message: 'boom' } };

beforeEach(() => {
	vi.clearAllMocks();
	m.results.length = 0;
});

describe('follow-status.service getFollowStatus', () => {
	it('reports a mutual follow as a friendship, with the target’s counts', async () => {
		m.results.push(row({ follower_id: 'a' }), row({ follower_id: 'b' }), count(3), count(4));

		await expect(followStatus.getFollowStatus('a', 'b')).resolves.toEqual({
			isFollowing: true,
			isFollowedBy: true,
			isFriend: true,
			followersCount: 3,
			followingCount: 4,
		});
	});

	it('a one-way follow is no friendship; missing counts are 0', async () => {
		m.results.push(row({ follower_id: 'a' }), row(null), count(null), count(null));

		await expect(followStatus.getFollowStatus('a', 'b')).resolves.toEqual({
			isFollowing: true,
			isFollowedBy: false,
			isFriend: false,
			followersCount: 0,
			followingCount: 0,
		});
	});

	it.each([
		['following', [dbError, row(null)]],
		['followed-by', [row(null), dbError]],
	])('answers 500 FOLLOW_STATUS_ERROR when the %s lookup fails', async (_, lookups) => {
		m.results.push(...lookups, count(0), count(0));

		await expect(followStatus.getFollowStatus('a', 'b')).rejects.toMatchObject({
			statusCode: 500,
			code: 'FOLLOW_STATUS_ERROR',
		});
		expect(m.error).toHaveBeenCalled();
	});

	it('answers an unexpected exception as 500 FOLLOW_STATUS_ERROR', async () => {
		m.from.mockImplementationOnce(() => {
			throw new Error('network');
		});

		await expect(followStatus.getFollowStatus('a', 'b')).rejects.toMatchObject({
			statusCode: 500,
			code: 'FOLLOW_STATUS_ERROR',
		});
	});
});

describe('follow-status.service getMyStats', () => {
	it('answers the caller’s follower and following counts', async () => {
		m.results.push(count(2), count(null));

		await expect(followStatus.getMyStats('a')).resolves.toEqual({
			followersCount: 2,
			followingCount: 0,
		});
	});

	it('answers an unexpected exception as 500 STATS_ERROR', async () => {
		m.from.mockImplementationOnce(() => {
			throw new Error('network');
		});

		await expect(followStatus.getMyStats('a')).rejects.toMatchObject({
			statusCode: 500,
			code: 'STATS_ERROR',
		});
	});
});

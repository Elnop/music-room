import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as mutualFriends from '@/features/friends/services/mutual-friends.service.js';

type Result = { data: unknown; error: { message: string } | null };

// Each `from()` takes the next queued result; the builder resolves to it.
const m = vi.hoisted(() => {
	const results: Result[] = [];
	const from = vi.fn(() => {
		const result = results.shift();
		const builder: Record<string, unknown> = {};
		for (const step of ['select', 'eq', 'in']) builder[step] = () => builder;
		builder.then = (resolve: (r: unknown) => unknown) => Promise.resolve(result).then(resolve);
		return builder;
	});
	return { results, from, error: vi.fn() };
});

vi.mock('@/shared/config/supabase.js', () => ({ supabaseAdmin: { from: m.from } }));
vi.mock('@/shared/utils/logger.js', () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: m.error, debug: vi.fn() },
}));

const ok = (data: unknown): Result => ({ data, error: null });
const dbError: Result = { data: null, error: { message: 'boom' } };

beforeEach(() => {
	vi.clearAllMocks();
	m.results.length = 0;
});

describe('mutual-friends.service getMutualFriends', () => {
	it('answers the profiles of the users who follow back', async () => {
		m.results.push(
			ok([{ following_id: 'b' }, { following_id: 'c' }]),
			ok([{ follower_id: 'b' }]),
			ok([{ id: 'b', username: 'bob', display_name: null, avatar_url: 'https://x/b.png' }])
		);

		await expect(mutualFriends.getMutualFriends('a')).resolves.toEqual([
			{ id: 'b', username: 'bob', displayName: undefined, avatarUrl: 'https://x/b.png' },
		]);
	});

	it.each([
		['the user follows nobody', [ok([])]],
		['nobody follows back', [ok([{ following_id: 'b' }]), ok(null)]],
	])('answers [] when %s', async (_, results) => {
		m.results.push(...results);

		await expect(mutualFriends.getMutualFriends('a')).resolves.toEqual([]);
	});

	it.each([
		['following list', [dbError]],
		['mutual follows', [ok([{ following_id: 'b' }]), dbError]],
		['profiles', [ok([{ following_id: 'b' }]), ok([{ follower_id: 'b' }]), dbError]],
	])('answers 500 FRIENDS_ERROR when the %s query fails', async (_, results) => {
		m.results.push(...results);

		await expect(mutualFriends.getMutualFriends('a')).rejects.toMatchObject({
			statusCode: 500,
			code: 'FRIENDS_ERROR',
		});
		expect(m.error).toHaveBeenCalled();
	});

	it('answers an unexpected exception as 500 FRIENDS_ERROR', async () => {
		m.from.mockImplementationOnce(() => {
			throw new Error('network');
		});

		await expect(mutualFriends.getMutualFriends('a')).rejects.toMatchObject({
			statusCode: 500,
			code: 'FRIENDS_ERROR',
		});
	});
});

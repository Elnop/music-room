import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FriendsService } from '@/features/friends/services/friends.service.js';
import { AppError } from '@/shared/middleware/error-handler.js';

const { from } = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock('@/shared/config/supabase.js', () => ({
	supabaseAdmin: { from },
}));

vi.mock('@/shared/utils/logger.js', () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('FriendsService.followUser', () => {
	const service = new FriendsService();

	beforeEach(() => {
		from.mockReset();
	});

	it('refuses a self-follow with 400 SELF_FOLLOW_ERROR before any query', async () => {
		const error = await service.followUser('user-1', 'user-1').catch((e: unknown) => e);

		expect(error).toBeInstanceOf(AppError);
		expect(error).toMatchObject({ statusCode: 400, code: 'SELF_FOLLOW_ERROR' });
		expect(from).not.toHaveBeenCalled();
	});
});

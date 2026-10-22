import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as friends from '@/features/friends/friends.controller.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { mockResponse } from '@/test/mock-response.js';

const svc = vi.hoisted(() => ({
	getFollowStatus: vi.fn(),
	getMyStats: vi.fn(),
	followUser: vi.fn(),
	unfollowUser: vi.fn(),
	getMutualFriends: vi.fn(),
}));
vi.mock('@/features/friends/services/follow-status.service.js', () => ({
	getFollowStatus: svc.getFollowStatus,
	getMyStats: svc.getMyStats,
}));
vi.mock('@/features/friends/services/follow.service.js', () => ({
	followUser: svc.followUser,
	unfollowUser: svc.unfollowUser,
}));
vi.mock('@/features/friends/services/mutual-friends.service.js', () => ({
	getMutualFriends: svc.getMutualFriends,
}));

const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';

async function call(
	handler: (req: Request, res: Response) => Promise<void>,
	params: Record<string, string> = {}
) {
	const res = mockResponse();
	const req = { user: { id: ME }, params } as unknown as Request;
	await handler(req, res as unknown as Response);
	return res;
}

beforeEach(() => {
	for (const fn of Object.values(svc)) fn.mockReset().mockResolvedValue('result');
});

describe('friends.controller', () => {
	it.each([
		['getMutualFriends', friends.getMutualFriends, svc.getMutualFriends],
		['getMyStats', friends.getMyStats, svc.getMyStats],
	] as const)('%s answers the caller’s own data', async (_, handler, service) => {
		const res = await call(handler);

		expect(service).toHaveBeenCalledWith(ME);
		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({ success: true, data: 'result' });
	});

	it.each([
		['getFollowStatus', friends.getFollowStatus, svc.getFollowStatus],
		['followUser', friends.followUser, svc.followUser],
		['unfollowUser', friends.unfollowUser, svc.unfollowUser],
	] as const)('%s acts on :userId', async (_, handler, service) => {
		const res = await call(handler, { userId: OTHER });

		expect(service).toHaveBeenCalledWith(ME, OTHER);
		expect(res.body).toMatchObject({ success: true, data: 'result' });
	});

	it('accepts an id of any UUID version, as the uuid column does', async () => {
		await call(friends.getFollowStatus, { userId: '00000000-0000-0000-0000-000000000001' });

		expect(svc.getFollowStatus).toHaveBeenCalled();
	});

	it.each([
		['getFollowStatus', friends.getFollowStatus, svc.getFollowStatus, 500, 'FOLLOW_STATUS_ERROR'],
		['followUser', friends.followUser, svc.followUser, 404, 'USER_NOT_FOUND'],
		['unfollowUser', friends.unfollowUser, svc.unfollowUser, 500, 'UNFOLLOW_ERROR'],
	] as const)(
		'%s answers a malformed id as the database did (%i %s), without a lookup',
		async (_, handler, service, statusCode, code) => {
			const error = await call(handler, { userId: 'not-a-uuid' }).catch((e: unknown) => e);

			expect(error).toBeInstanceOf(AppError);
			expect(error).toMatchObject({ statusCode, code });
			expect(service).not.toHaveBeenCalled();
		}
	);
});

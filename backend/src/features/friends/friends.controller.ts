import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { sendSuccess } from '@/shared/utils/send-success.js';
import * as followStatusService from '@/features/friends/services/follow-status.service.js';
import * as followService from '@/features/friends/services/follow.service.js';
import * as mutualFriendsService from '@/features/friends/services/mutual-friends.service.js';
import { friendUserParamsSchema } from '@/features/friends/friends.validators.js';

const userOf = (req: Request) => (req as AuthenticatedRequest).user.id;

/** A malformed `:userId` is answered with `invalid`, as the database lookup did before validation existed. */
function targetOf(req: Request, invalid: () => AppError): string {
	const parsed = friendUserParamsSchema.safeParse(req.params);
	if (!parsed.success) throw invalid();
	return parsed.data.userId;
}

export async function getMutualFriends(req: Request, res: Response) {
	sendSuccess(res, await mutualFriendsService.getMutualFriends(userOf(req)));
}

export async function getMyStats(req: Request, res: Response) {
	sendSuccess(res, await followStatusService.getMyStats(userOf(req)));
}

export async function getFollowStatus(req: Request, res: Response) {
	const userId = targetOf(
		req,
		() => new AppError(500, 'Failed to get follow status', 'FOLLOW_STATUS_ERROR')
	);
	sendSuccess(res, await followStatusService.getFollowStatus(userOf(req), userId));
}

export async function followUser(req: Request, res: Response) {
	const userId = targetOf(req, () => new AppError(404, 'User not found', 'USER_NOT_FOUND'));
	sendSuccess(res, await followService.followUser(userOf(req), userId));
}

export async function unfollowUser(req: Request, res: Response) {
	const userId = targetOf(
		req,
		() => new AppError(500, 'Failed to unfollow user', 'UNFOLLOW_ERROR')
	);
	sendSuccess(res, await followService.unfollowUser(userOf(req), userId));
}

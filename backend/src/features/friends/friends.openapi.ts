import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
	followActionSchema,
	followStatusSchema,
	friendSchema,
	friendStatsSchema,
	friendUserParamsSchema,
} from '@/features/friends/friends.validators.js';
import { bearerAuth, describeParams, nameSchemas, ok } from '@/shared/config/swagger.schemas.js';
import { fail, shared } from '@/shared/config/swagger.errors.js';

/** Registers the /api/friends routes. */
export function registerFriendsOpenapi(registry: OpenAPIRegistry): void {
	const common = { tags: ['Friends'], security: bearerAuth };
	const unauthorized = shared('UnauthorizedError');
	const user = (description: string) =>
		describeParams(friendUserParamsSchema, { userId: description });
	nameSchemas({
		Friend: friendSchema,
		FriendStats: friendStatsSchema,
		FollowStatus: followStatusSchema,
	});

	registry.registerPath({
		...common,
		method: 'get',
		path: '/api/friends',
		summary: 'Get user friends list',
		description: 'Returns your mutual friends: the users you follow who follow you back',
		operationId: 'getFriends',
		responses: { 200: ok('Friends list retrieved', z.array(friendSchema)), 401: unauthorized },
	});

	registry.registerPath({
		...common,
		method: 'get',
		path: '/api/friends/stats/me',
		summary: 'Get user friend statistics',
		description: 'Returns follower and following counts for authenticated user',
		operationId: 'getFriendStats',
		responses: { 200: ok('Stats retrieved', friendStatsSchema), 401: unauthorized },
	});

	registry.registerPath({
		...common,
		method: 'get',
		path: '/api/friends/status/{userId}',
		summary: 'Check follow status with a user',
		description: 'Returns whether authenticated user follows target user and vice versa',
		operationId: 'checkFollowStatus',
		request: { params: user('User ID to check follow status with') },
		responses: { 200: ok('Follow status retrieved', followStatusSchema), 401: unauthorized },
	});

	registry.registerPath({
		...common,
		method: 'post',
		path: '/api/friends/follow/{userId}',
		summary: 'Follow a user',
		description:
			'Start following another user. Creates one-way follow relationship. Idempotent: following a user you already follow answers 200.',
		operationId: 'followUser',
		request: { params: user('User ID to follow') },
		responses: {
			200: ok('User followed successfully', followActionSchema),
			400: fail('Cannot follow yourself', ['SELF_FOLLOW_ERROR', 'Cannot follow yourself']),
			401: unauthorized,
			404: fail('No user has this ID', ['USER_NOT_FOUND', 'User not found']),
		},
	});

	registry.registerPath({
		...common,
		method: 'delete',
		path: '/api/friends/follow/{userId}',
		summary: 'Unfollow a user',
		description:
			'Stop following a user. Removes follow relationship. Idempotent: answers 200 when you did not follow the user.',
		operationId: 'unfollowUser',
		request: { params: user('User ID to unfollow') },
		responses: { 200: ok('User unfollowed successfully', followActionSchema), 401: unauthorized },
	});
}

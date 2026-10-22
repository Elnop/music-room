import { z } from 'zod';

/**
 * Friends schemas. The routes read `:userId` with `routeParam` (any non-empty
 * segment); the schemas below document the API in /api-docs.
 */

/** Path segment of the /status, /follow routes: the other user. */
export const friendUserParamsSchema = z.object({
	userId: z.uuid().meta({ param: { description: 'ID of the other user' } }),
});

/** A mutual friend (GET /api/friends); displayName and avatarUrl are absent when unset. */
export const friendSchema = z.object({
	id: z.uuid(),
	username: z.string(),
	displayName: z.string().optional(),
	avatarUrl: z.url().optional(),
});

/** GET /api/friends/stats/me */
export const friendStatsSchema = z.object({
	followersCount: z.int().meta({ description: 'Number of users following you' }),
	followingCount: z.int().meta({ description: 'Number of users you follow' }),
});

/** Follow relation between the caller and another user, with that user's counts. */
export const followStatusSchema = z.object({
	isFollowing: z.boolean().meta({ description: 'True if you follow the user' }),
	isFollowedBy: z.boolean().meta({ description: 'True if the user follows you' }),
	isFriend: z.boolean().meta({ description: 'True if both follow each other (mutual friends)' }),
	followersCount: z.int().meta({ description: "Number of the user's followers" }),
	followingCount: z.int().meta({ description: 'Number of users the user follows' }),
});

/** POST and DELETE /api/friends/follow/:userId */
export const followActionSchema = z.object({
	success: z.literal(true),
	status: followStatusSchema,
});

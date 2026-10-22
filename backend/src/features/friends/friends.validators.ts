import { z } from 'zod';

/** Friends schemas: path parameters, and the responses documented in /api-docs. */

/**
 * Path segment of the /status, /follow routes: the other user, in any input
 * form of the Postgres `uuid` type (hyphens optional after any group of 4 hex
 * digits, optional braces), since the lookup used to accept them all.
 */
export const friendUserParamsSchema = z.object({
	userId: z
		.string()
		.regex(/^(\{[0-9a-fA-F]{4}(-?[0-9a-fA-F]{4}){7}\}|[0-9a-fA-F]{4}(-?[0-9a-fA-F]{4}){7})$/)
		.meta({ format: 'uuid', param: { description: 'ID of the other user' } }),
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

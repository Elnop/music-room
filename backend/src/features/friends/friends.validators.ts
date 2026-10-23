import { z } from 'zod';

/** Accepts every input form of the Postgres `uuid` type (optional hyphens and braces), as the lookup used to. */
export const friendUserParamsSchema = z.object({
	userId: z
		.string()
		.regex(/^(\{[0-9a-fA-F]{4}(-?[0-9a-fA-F]{4}){7}\}|[0-9a-fA-F]{4}(-?[0-9a-fA-F]{4}){7})$/)
		.meta({ format: 'uuid', param: { description: 'ID of the other user' } }),
});

/** displayName and avatarUrl are absent when unset. */
export const friendSchema = z.object({
	id: z.uuid(),
	username: z.string(),
	displayName: z.string().optional(),
	avatarUrl: z.url().optional(),
});

export const friendStatsSchema = z.object({
	followersCount: z.int().meta({ description: 'Number of users following you' }),
	followingCount: z.int().meta({ description: 'Number of users you follow' }),
});

export const followStatusSchema = z.object({
	isFollowing: z.boolean().meta({ description: 'True if you follow the user' }),
	isFollowedBy: z.boolean().meta({ description: 'True if the user follows you' }),
	isFriend: z.boolean().meta({ description: 'True if both follow each other (mutual friends)' }),
	followersCount: z.int().meta({ description: "Number of the user's followers" }),
	followingCount: z.int().meta({ description: 'Number of users the user follows' }),
});

export const followActionSchema = z.object({
	success: z.literal(true),
	status: followStatusSchema,
});

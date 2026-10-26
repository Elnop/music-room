import { z } from 'zod';

/** displayName and avatarUrl are absent when unset. */
export const userSummarySchema = z.object({
	id: z.uuid(),
	username: z.string(),
	displayName: z.string().optional(),
	avatarUrl: z.url().optional(),
});

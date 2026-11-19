import { z } from 'zod';

export const userSummarySchema = z.object({
	id: z.uuid(),
	username: z.string(),
	displayName: z.string().optional(),
	avatarUrl: z.url().optional(),
});

import { z } from 'zod';

/**
 * Validation schema for SoundCloud search query
 */
export const soundcloudSearchSchema = z.object({
	q: z.string().min(1, 'Search query is required').max(200, 'Query too long'),
	limit: z.coerce.number().int().min(1).max(50).optional().default(20),
	offset: z.coerce.number().int().min(0).optional().default(0),
});

export type SoundCloudSearchInput = z.infer<typeof soundcloudSearchSchema>;

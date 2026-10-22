import type { z } from 'zod';
import type {
	followActionSchema,
	followStatusSchema,
	friendSchema,
	friendStatsSchema,
} from '@/features/friends/friends.validators.js';

/** A mutual friend (GET /api/friends). */
export type Friend = z.infer<typeof friendSchema>;

/** The caller's own counts (GET /api/friends/stats/me). */
export type FriendStats = z.infer<typeof friendStatsSchema>;

/** Follow relation between the caller and another user, with that user's counts. */
export type FollowStatus = z.infer<typeof followStatusSchema>;

/** Answer of a follow or an unfollow. */
export type FollowActionResponse = z.infer<typeof followActionSchema>;

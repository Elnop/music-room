import type { z } from 'zod';
import type {
	followActionSchema,
	followStatusSchema,
	friendSchema,
	friendStatsSchema,
} from '@/features/friends/friends.validators.js';

export type Friend = z.infer<typeof friendSchema>;

export type FriendStats = z.infer<typeof friendStatsSchema>;

export type FollowStatus = z.infer<typeof followStatusSchema>;

export type FollowActionResponse = z.infer<typeof followActionSchema>;

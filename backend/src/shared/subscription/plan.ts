import { z } from 'zod';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';

export const planSchema = z.enum(['free', 'premium']);

export type Plan = z.infer<typeof planSchema>;

/** What the premium plan unlocks; the free plan has none of it. */
export const PREMIUM_FEATURES = ['playlist_cover'] as const;

export async function getPlan(userId: string): Promise<Plan> {
	const { data, error } = await supabaseAdmin
		.from('user_profiles')
		.select('plan')
		.eq('id', userId)
		.single();

	if (error) {
		if (error.code === 'PGRST116') throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
		logger.error('Failed to fetch subscription plan', { userId, error });
		throw new AppError(500, 'Failed to fetch subscription plan', 'SUBSCRIPTION_FETCH_ERROR');
	}

	return planSchema.parse(data.plan);
}

/** Throws 403 PREMIUM_REQUIRED unless the user is on the premium plan. */
export async function assertPremium(userId: string): Promise<void> {
	if ((await getPlan(userId)) === 'premium') return;
	throw new AppError(403, 'This feature requires the Premium plan', 'PREMIUM_REQUIRED', undefined, {
		why: `User ${userId} is on the free plan`,
		fix: 'Switch to Premium with PUT /api/subscription { "plan": "premium" }',
	});
}

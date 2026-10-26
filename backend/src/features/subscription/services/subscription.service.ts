import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { getPlan, PREMIUM_FEATURES, type Plan } from '@/shared/subscription/plan.js';
import type { Subscription } from '@/features/subscription/subscription.types.js';

function toSubscription(plan: Plan): Subscription {
	return { plan, premiumFeatures: [...PREMIUM_FEATURES] };
}

export async function getSubscription(userId: string): Promise<Subscription> {
	return toSubscription(await getPlan(userId));
}

/** Simulated: no payment, the switch takes effect at once. A downgrade deletes nothing. */
export async function changePlan(userId: string, plan: Plan): Promise<Subscription> {
	const { error } = await supabaseAdmin
		.from('user_profiles')
		.update({ plan, plan_changed_at: new Date().toISOString() })
		.eq('id', userId)
		.select('id')
		.single();

	if (error) {
		if (error.code === 'PGRST116') throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
		logger.error('Failed to change subscription plan', { userId, plan, error });
		throw new AppError(500, 'Failed to change subscription plan', 'SUBSCRIPTION_UPDATE_ERROR');
	}

	logger.info('Subscription plan changed', { userId, plan });
	return toSubscription(plan);
}

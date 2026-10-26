import { z } from 'zod';
import { PREMIUM_FEATURES, planSchema } from '@/shared/subscription/plan.js';

export const changePlanSchema = z.object({
	plan: planSchema.meta({ description: 'The plan to switch to; takes effect at once' }),
});

export const subscriptionSchema = z.object({
	plan: planSchema,
	premiumFeatures: z
		.array(z.enum(PREMIUM_FEATURES))
		.meta({ description: 'What the premium plan unlocks, whatever the current plan' }),
});

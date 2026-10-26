import type { z } from 'zod';
import type { subscriptionSchema } from '@/features/subscription/subscription.validators.js';

export type Subscription = z.infer<typeof subscriptionSchema>;

import { apiRequest } from '@/shared/backend/lib/api';
import type { Plan, Subscription } from '@/features/subscription/lib/subscription';

export const subscriptionApi = {
	getSubscription: () => apiRequest<Subscription>('/api/subscription'),

	changePlan: (plan: Plan) =>
		apiRequest<Subscription>('/api/subscription', {
			method: 'PUT',
			body: JSON.stringify({ plan }),
		}),
};

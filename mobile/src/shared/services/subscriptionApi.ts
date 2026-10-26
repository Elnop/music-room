import { apiRequest } from '@/shared/services/api';
import type { Plan, Subscription } from '@/shared/types/subscription';

export const subscriptionApi = {
	getSubscription: () => apiRequest<Subscription>('/api/subscription'),

	/** Simulated on the backend: no payment, the plan changes at once. */
	changePlan: (plan: Plan) =>
		apiRequest<Subscription>('/api/subscription', {
			method: 'PUT',
			body: JSON.stringify({ plan }),
		}),
};

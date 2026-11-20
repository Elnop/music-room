import { apiRequest } from '@/shared/backend/lib/api';
import type { Plan, Subscription } from './subscription';

export const subscriptionApi = {
	getSubscription: () => apiRequest<Subscription>('/api/subscription'),

	/** Simulated on the backend: no payment, the plan changes at once. */
	changePlan: (plan: Plan) =>
		apiRequest<Subscription>('/api/subscription', {
			method: 'PUT',
			body: JSON.stringify({ plan }),
		}),
};

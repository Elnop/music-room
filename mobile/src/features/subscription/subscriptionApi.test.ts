import { apiRequest } from '@/shared/backend/lib/api';
import { subscriptionApi } from '@/features/subscription/subscriptionApi';

jest.mock('@/shared/backend/lib/api', () => ({ apiRequest: jest.fn() }));

describe('subscriptionApi', () => {
	beforeEach(() => jest.clearAllMocks());

	it('getSubscription calls GET /api/subscription', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce({ plan: 'free', premiumFeatures: [] });
		await subscriptionApi.getSubscription();
		expect(apiRequest).toHaveBeenCalledWith('/api/subscription');
	});

	it('changePlan calls PUT /api/subscription with the plan', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce({ plan: 'premium', premiumFeatures: [] });
		await subscriptionApi.changePlan('premium');
		expect(apiRequest).toHaveBeenCalledWith('/api/subscription', {
			method: 'PUT',
			body: JSON.stringify({ plan: 'premium' }),
		});
	});
});

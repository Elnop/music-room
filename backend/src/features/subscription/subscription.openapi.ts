import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
	changePlanSchema,
	subscriptionSchema,
} from '@/features/subscription/subscription.validators.js';
import { bearerAuth, jsonBody, nameSchemas, ok } from '@/shared/config/swagger.schemas.js';
import { shared } from '@/shared/config/swagger.errors.js';

export function registerSubscriptionOpenapi(registry: OpenAPIRegistry): void {
	const common = { tags: ['Subscription'], security: bearerAuth };
	nameSchemas({ Subscription: subscriptionSchema, ChangePlanRequest: changePlanSchema });

	registry.registerPath({
		...common,
		method: 'get',
		path: '/api/subscription',
		summary: "Get the current user's plan",
		description: 'A new account is on the free plan.',
		operationId: 'getSubscription',
		responses: {
			200: ok('Current plan', subscriptionSchema),
			401: shared('UnauthorizedError'),
			404: shared('NotFoundError'),
		},
	});

	registry.registerPath({
		...common,
		method: 'put',
		path: '/api/subscription',
		summary: 'Switch between the free and the premium plan',
		description:
			'Simulated: there is no payment and the switch takes effect at once. Going back to free deletes nothing created on Premium.',
		operationId: 'changePlan',
		request: { body: jsonBody(changePlanSchema, { plan: 'premium' }) },
		responses: {
			200: ok('Plan switched', subscriptionSchema),
			400: shared('ValidationError'),
			401: shared('UnauthorizedError'),
			404: shared('NotFoundError'),
			429: shared('RateLimitError'),
			503: shared('RateLimitUnavailable'),
		},
	});
}

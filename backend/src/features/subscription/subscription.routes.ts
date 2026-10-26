import { Router, type RequestHandler } from 'express';
import * as subscription from '@/features/subscription/subscription.controller.js';
import { subscriptionRateLimiter } from '@/shared/security/http-rate-limit.js';

/** `auth` is authMiddleware, passed in by app/routes.ts since a feature never imports another one. */
export function createSubscriptionRouter(auth: RequestHandler): Router {
	const router = Router();

	router.use(auth);

	router.get('/', subscription.getSubscription);
	router.put('/', subscriptionRateLimiter, subscription.changePlan);

	return router;
}

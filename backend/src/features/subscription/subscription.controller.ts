import type { Request, Response } from 'express';
import * as subscriptionService from '@/features/subscription/services/subscription.service.js';
import { changePlanSchema } from '@/features/subscription/subscription.validators.js';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';
import { sendSuccess } from '@/shared/utils/send-success.js';

export async function getSubscription(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	sendSuccess(res, await subscriptionService.getSubscription(userId));
}

export async function changePlan(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const { plan } = changePlanSchema.parse(req.body);
	sendSuccess(res, await subscriptionService.changePlan(userId, plan));
}

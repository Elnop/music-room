import type { Request, Response } from 'express';
import {
	registerSchema,
	loginSchema,
	refreshTokenSchema,
} from '@/features/auth/auth.validators.js';
import * as registrationService from '@/features/auth/services/registration.service.js';
import * as loginService from '@/features/auth/services/login.service.js';
import * as sessionService from '@/features/auth/services/session.service.js';
import { getUserProfile } from '@/features/auth/utils/auth.helpers.js';
import { requestIp } from '@/shared/security/request-ip.js';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';
import { logger } from '@/shared/utils/logger.js';
import { sendSuccess } from '@/shared/utils/send-success.js';
import * as accountLockout from '@/shared/security/account-lockout.js';
import * as ipReputation from '@/shared/security/ip-reputation.js';

// No try/catch: Express 5 forwards rejected promises to the shared error handler.

export async function register(req: Request, res: Response) {
	const validated = registerSchema.parse(req.body);
	const result = await registrationService.register(validated);
	logger.debug('Registration successful', { userId: result.user.id });
	sendSuccess(res, result, 201);
}

/** Every failure, a validation error included, counts toward the account lockout; a success resets it. */
export async function login(req: Request, res: Response) {
	const body = req.body as { email?: string } | undefined;
	const email = body?.email || 'unknown';
	const ip = requestIp(req);

	try {
		const validated = loginSchema.parse(req.body);
		logger.info('Login request received', { email: validated.email, ip });

		const result = await loginService.login(validated);
		await accountLockout.resetFailedAttempts(email, ip);

		logger.info('Login successful', { userId: result.user.id, ip });
		sendSuccess(res, result);
	} catch (error) {
		const lockStatus = await accountLockout.recordFailedAttempt(email, ip);
		await ipReputation.recordIPActivity(ip);

		logger.warn('Login failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			email,
			ip,
			failedAttempts: lockStatus.failedAttempts,
			remainingAttempts: lockStatus.remainingAttempts,
		});
		throw error;
	}
}

export async function me(req: Request, res: Response) {
	const profile = await getUserProfile((req as AuthenticatedRequest).user.id);
	sendSuccess(res, { user: profile });
}

export async function logout(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	// authMiddleware already checked the header is "Bearer <token>".
	const token = (req.headers.authorization ?? '').replace('Bearer ', '');

	await sessionService.logout(token, userId);

	logger.info('User logout', { userId });
	sendSuccess(res, { message: 'Logged out successfully' });
}

export async function refreshToken(req: Request, res: Response) {
	const validated = refreshTokenSchema.parse(req.body);
	const result = await sessionService.refreshToken(validated.refreshToken);
	logger.info('Token refresh successful', { userId: result.user.id });
	sendSuccess(res, result);
}

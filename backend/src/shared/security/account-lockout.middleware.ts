import { Request, Response, NextFunction } from 'express';
import { logger } from '@/shared/utils/logger.js';
import { AppError, sendError } from '@/shared/middleware/error-handler.js';
import * as accountLockout from '@/shared/security/account-lockout.js';
import * as ipReputation from '@/shared/security/ip-reputation.js';
import { requestIp } from '@/shared/security/request-ip.js';

// Apply to the login endpoint after rate limiting.

export async function checkAccountLockout(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	const email = (req.body as { email?: string } | undefined)?.email;
	const ip = requestIp(req);

	if (!email) {
		// Let validation report the missing email.
		return next();
	}

	try {
		const lockStatus = await accountLockout.checkLockout(email, ip);

		if (lockStatus.isLocked) {
			logger.warn('Login attempt on locked account', {
				email,
				ip,
				lockedUntil: lockStatus.lockedUntil?.toISOString(),
				failedAttempts: lockStatus.failedAttempts,
			});

			sendError(
				req,
				res,
				new AppError(
					429,
					'Account temporarily locked due to too many failed login attempts. Please try again later.',
					'ACCOUNT_LOCKED',
					{
						lockedUntil: lockStatus.lockedUntil?.toISOString(),
						remainingTime: lockStatus.remainingSeconds,
					},
					{ why: `${lockStatus.failedAttempts} failed login attempts for this email and IP` }
				)
			);
			return;
		}

		if (lockStatus.failedAttempts >= 3) {
			logger.info('User approaching lockout threshold', {
				email,
				ip,
				failedAttempts: lockStatus.failedAttempts,
				remainingAttempts: lockStatus.remainingAttempts,
			});
		}

		next();
	} catch (error) {
		logger.error('Error in account lockout middleware', {
			error: error instanceof Error ? error.message : 'Unknown error',
			email,
			ip,
		});

		// On error, let the attempt proceed: the controller records the failure.
		next();
	}
}

export async function checkIPBlacklist(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	const ip = requestIp(req);

	try {
		const isBlacklisted = await ipReputation.isIPBlacklisted(ip);

		if (isBlacklisted) {
			logger.error('Request from blacklisted IP', {
				ip,
				endpoint: req.path,
				userAgent: req.get('user-agent'),
			});

			sendError(
				req,
				res,
				new AppError(
					403,
					'Access temporarily restricted due to suspicious activity from this IP address.',
					'IP_BLOCKED',
					undefined,
					{ why: `IP ${ip} is blacklisted by the brute-force service` }
				)
			);
			return;
		}

		next();
	} catch (error) {
		logger.error('Error in IP blacklist middleware', {
			error: error instanceof Error ? error.message : 'Unknown error',
			ip,
		});

		next();
	}
}

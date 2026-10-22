import { Request, Response, NextFunction } from 'express';
import { logger } from '@/shared/utils/logger.js';
import { AppError, sendError } from '@/shared/middleware/error-handler.js';
import * as accountLockout from '@/shared/security/account-lockout.js';
import * as ipReputation from '@/shared/security/ip-reputation.js';
import { requestIp } from '@/shared/security/request-ip.js';

/**
 * Account Lockout Middleware
 * Checks if an account is locked before allowing login attempts
 * Should be applied to the login endpoint AFTER rate limiting
 */

export async function checkAccountLockout(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	const email = (req.body as { email?: string } | undefined)?.email;
	const ip = requestIp(req);

	if (!email) {
		// Email is required - let validation handle this
		return next();
	}

	try {
		// Check if account is currently locked
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

		// Check if approaching lockout threshold (3+ failed attempts)
		if (lockStatus.failedAttempts >= 3) {
			logger.info('User approaching lockout threshold', {
				email,
				ip,
				failedAttempts: lockStatus.failedAttempts,
				remainingAttempts: lockStatus.remainingAttempts,
			});
		}

		// Account not locked, proceed to login handler
		next();
	} catch (error) {
		logger.error('Error in account lockout middleware', {
			error: error instanceof Error ? error.message : 'Unknown error',
			email,
			ip,
		});

		// On error, allow login attempt to proceed
		// The failure will be recorded in the controller
		next();
	}
}

/**
 * IP Blacklist Middleware
 * Checks if an IP is blacklisted before allowing any auth requests
 * Can be applied globally to all auth routes or specific endpoints
 */
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

		// On error, allow request to proceed
		next();
	}
}

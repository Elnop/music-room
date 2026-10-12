import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/features/auth/auth.service.js';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import {
	TokenVerifyLimitError,
	verifyTokenLimited,
} from '@/features/auth/utils/token-verify-limiter.js';

const authService = new AuthService();
const verify = (token: string) => authService.verifyToken(token);

// Same client IP as the rate limiters (rate-limit.middleware.ts).
function clientIp(req: Request): string {
	return req.ip || req.socket?.remoteAddress || 'unknown';
}

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header and attaches user to request
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader) {
			return res.status(401).json({
				success: false,
				error: {
					message: 'No authorization header provided',
					code: 'NO_AUTH_HEADER',
				},
				meta: {
					timestamp: new Date().toISOString(),
				},
			});
		}

		if (!authHeader.startsWith('Bearer ')) {
			return res.status(401).json({
				success: false,
				error: {
					message: 'Invalid authorization header format. Expected: Bearer <token>',
					code: 'INVALID_AUTH_FORMAT',
				},
				meta: {
					timestamp: new Date().toISOString(),
				},
			});
		}

		const token = authHeader.replace('Bearer ', '');

		if (!token) {
			return res.status(401).json({
				success: false,
				error: {
					message: 'No token provided',
					code: 'NO_TOKEN',
				},
				meta: {
					timestamp: new Date().toISOString(),
				},
			});
		}

		// Verify token with Supabase, unless this IP failed too often (429)
		const user = await verifyTokenLimited(token, clientIp(req), verify);

		// Attach user to request
		(req as AuthenticatedRequest).user = user;

		next();
	} catch (error: unknown) {
		if (error instanceof TokenVerifyLimitError) {
			return res.status(429).json({
				success: false,
				error: {
					message: error.message,
					code: error.code,
					retryAfter: new Date(Date.now() + error.retryAfterMs).toISOString(),
				},
				meta: {
					timestamp: new Date().toISOString(),
				},
			});
		}

		const err = error as Error & { code?: string };
		// Keep an AppError's status (503 REVOCATION_UNAVAILABLE); anything else is 401.
		const status = error instanceof AppError ? error.statusCode : 401;
		logger.warn('Authentication failed', { error: err.message, status });
		return res.status(status).json({
			success: false,
			error: {
				message: err.message || 'Authentication failed',
				code: err.code || 'AUTH_FAILED',
			},
			meta: {
				timestamp: new Date().toISOString(),
			},
		});
	}
}

/**
 * Optional authentication middleware
 * Similar to authMiddleware but doesn't fail if no token is provided
 * Useful for endpoints that work differently for authenticated/unauthenticated users
 */
export async function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return next();
		}

		const token = authHeader.replace('Bearer ', '');

		if (!token) {
			return next();
		}

		// A blocked IP continues anonymously, without calling Supabase.
		const user = await verifyTokenLimited(token, clientIp(req), verify);
		(req as AuthenticatedRequest).user = user;

		next();
	} catch {
		// Don't fail, just continue without user
		next();
	}
}

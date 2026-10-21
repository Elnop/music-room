import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/features/auth/auth.service.js';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';
import { AppError, sendError } from '@/shared/middleware/error-handler.js';
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
			return sendError(
				req,
				res,
				new AppError(401, 'No authorization header provided', 'NO_AUTH_HEADER', undefined, {
					fix: 'Send Authorization: Bearer <access token>',
				})
			);
		}

		if (!authHeader.startsWith('Bearer ')) {
			return sendError(
				req,
				res,
				new AppError(
					401,
					'Invalid authorization header format. Expected: Bearer <token>',
					'INVALID_AUTH_FORMAT'
				)
			);
		}

		const token = authHeader.replace('Bearer ', '');

		if (!token) {
			return sendError(req, res, new AppError(401, 'No token provided', 'NO_TOKEN'));
		}

		// Verify token with Supabase, unless this IP failed too often (429)
		const user = await verifyTokenLimited(token, clientIp(req), verify);

		// Attach user to request
		(req as AuthenticatedRequest).user = user;

		next();
	} catch (error: unknown) {
		if (error instanceof TokenVerifyLimitError) {
			const retryAfter = new Date(Date.now() + error.retryAfterMs).toISOString();
			return sendError(
				req,
				res,
				new AppError(
					429,
					error.message,
					error.code,
					{ retryAfter },
					{
						why: 'Too many failed token verifications from this IP',
					}
				)
			);
		}

		// Keep an AppError (503 REVOCATION_UNAVAILABLE); anything else is 401.
		if (error instanceof AppError) return sendError(req, res, error);
		const err = error as Error & { code?: string };
		return sendError(
			req,
			res,
			new AppError(401, err.message || 'Authentication failed', err.code || 'AUTH_FAILED')
		);
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

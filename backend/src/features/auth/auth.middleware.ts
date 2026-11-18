import type { Request, Response, NextFunction } from 'express';
import * as sessionService from '@/features/auth/services/session.service.js';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';
import { AppError, sendError } from '@/shared/middleware/error-handler.js';
import { TokenVerifyLimitError, verifyTokenLimited } from '@/shared/security/token-verify-limit.js';
import { requestIp } from '@/shared/security/request-ip.js';

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

		const user = await verifyTokenLimited(token, requestIp(req), sessionService.verifyToken);

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

		// An AppError keeps its status: a revocation outage is a 503, not a 401.
		if (error instanceof AppError) return sendError(req, res, error);
		const err = error as Error & { code?: string };
		return sendError(
			req,
			res,
			new AppError(401, err.message || 'Authentication failed', err.code || 'AUTH_FAILED')
		);
	}
}

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

		const user = await verifyTokenLimited(token, requestIp(req), sessionService.verifyToken);
		(req as AuthenticatedRequest).user = user;

		next();
	} catch {
		// A blocked IP or an invalid token continues anonymously.
		next();
	}
}

import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { rateLimitConfig } from '@/shared/config/rate-limit.config.js';
import { logger } from '@/shared/utils/logger.js';
import { AppError, sendError } from '@/shared/middleware/error-handler.js';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';
import { createRateLimitStore } from '@/shared/security/rate-limit-store.js';
import { requestIp } from '@/shared/security/request-ip.js';

// Fail closed with 503 RATE_LIMIT_UNAVAILABLE while Redis is down, never in memory.
// Skipped when RATE_LIMIT_ENABLED=false and for RATE_LIMIT_WHITELIST_IPS.
interface LimiterSpec {
	/** Redis keys are `rl:<store>:<key>`. */
	store: string;
	limits: { windowMs: number; max: number };
	key: (req: Request) => string;
	message: (req: Request) => string;
	log: string;
	logFields: (req: Request) => Record<string, unknown>;
	skipSuccessfulRequests?: boolean;
}

function sendRateLimited(req: Request, res: Response, message: string): void {
	const retryAfter = new Date(req.rateLimit?.resetTime?.getTime() || 0).toISOString();
	sendError(
		req,
		res,
		new AppError(
			429,
			message,
			'RATE_LIMIT_EXCEEDED',
			{ retryAfter },
			{
				why: `Rate limit of ${req.rateLimit?.limit} requests per window reached`,
				fix: 'Wait for retryAfter, or raise the RATE_LIMIT_* variables in backend/.env',
			}
		)
	);
}

function skip(req: Request): boolean {
	if (!rateLimitConfig.enabled) return true;
	return rateLimitConfig.whitelist.includes(req.ip || '');
}

function createLimiter(spec: LimiterSpec) {
	return rateLimit({
		standardHeaders: true, // `RateLimit-*` headers
		legacyHeaders: false, // no `X-RateLimit-*` headers
		windowMs: spec.limits.windowMs,
		max: spec.limits.max,
		skip,
		skipSuccessfulRequests: spec.skipSuccessfulRequests ?? false,
		keyGenerator: spec.key,
		store: createRateLimitStore(spec.store),
		handler: (req: Request, res: Response) => {
			logger.warn(spec.log, spec.logFields(req));
			sendRateLimited(req, res, spec.message(req));
		},
	});
}

if (!rateLimitConfig.enabled) {
	logger.info('Rate limiting disabled (RATE_LIMIT_ENABLED=false)');
}

const emailOf = (req: Request) => (req.body as { email?: string } | undefined)?.email;
const userIdOf = (req: Request) => (req as AuthenticatedRequest).user.id;
const isGoogle = (req: Request) => req.path.includes('google');
const signInFields = (req: Request) => ({
	ip: req.ip,
	email: emailOf(req),
	userAgent: req.get('user-agent'),
});
const perUserFields = (req: Request) => ({ endpoint: req.path, userId: userIdOf(req), ip: req.ip });

/** Failed attempts only, per email and IP. */
export const loginRateLimiter = createLimiter({
	store: 'auth:login',
	limits: rateLimitConfig.login,
	key: req => `login:${emailOf(req) || 'unknown'}:${requestIp(req)}`,
	skipSuccessfulRequests: true,
	message: () => 'Too many login attempts. Please try again later.',
	log: 'Login rate limit exceeded',
	logFields: req => ({ ...signInFields(req), remainingAttempts: 0 }),
});

/** Per IP. */
export const registerRateLimiter = createLimiter({
	store: 'auth:register',
	limits: rateLimitConfig.register,
	key: req => `register:${requestIp(req)}`,
	message: () => 'Too many registration attempts. Please try again later.',
	log: 'Registration rate limit exceeded',
	logFields: signInFields,
});

/** Per provider and IP. */
export const oauthRateLimiter = createLimiter({
	store: 'auth:oauth',
	limits: rateLimitConfig.oauth,
	key: req => `oauth:${isGoogle(req) ? 'google' : 'facebook'}:${requestIp(req)}`,
	message: req =>
		`Too many ${isGoogle(req) ? 'Google' : 'Facebook'} login attempts. Please try again later.`,
	log: 'OAuth rate limit exceeded',
	logFields: req => ({
		provider: isGoogle(req) ? 'Google' : 'Facebook',
		ip: req.ip,
		userAgent: req.get('user-agent'),
	}),
});

/** Safety net on every /api/auth/* route, per IP. */
export const globalAuthRateLimiter = createLimiter({
	store: 'auth:global',
	limits: rateLimitConfig.global,
	key: req => `auth:global:${requestIp(req)}`,
	message: () => 'Too many authentication requests. Please try again later.',
	log: 'Global auth rate limit exceeded',
	logFields: req => ({ endpoint: req.path, ip: req.ip, userAgent: req.get('user-agent') }),
});

/** Per signed-in user; after authMiddleware. */
export const soundcloudRateLimiter = createLimiter({
	store: 'soundcloud',
	limits: rateLimitConfig.soundcloud,
	key: req => `soundcloud:${userIdOf(req)}`,
	message: () => 'Too many SoundCloud requests. Please try again later.',
	log: 'SoundCloud rate limit exceeded',
	logFields: perUserFields,
});

/** Per signed-in user; after authMiddleware. */
export const avatarRateLimiter = createLimiter({
	store: 'profile:avatar',
	limits: rateLimitConfig.avatar,
	key: req => `avatar:${userIdOf(req)}`,
	message: () => 'Too many profile photo changes. Please try again later.',
	log: 'Avatar rate limit exceeded',
	logFields: perUserFields,
});

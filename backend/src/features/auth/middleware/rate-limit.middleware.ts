import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { RedisRateLimitStore } from '@/features/auth/utils/redis-rate-limit-store.js';
import { rateLimitConfig } from '@/shared/config/rate-limit.config.js';
import { logger } from '@/shared/utils/logger.js';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';

// Helper function to get IP address (handles both IPv4 and IPv6)
const getClientIp = (req: Request): string => {
	// Express sets req.ip based on trust proxy settings
	// This properly handles X-Forwarded-For headers
	return req.ip || req.socket.remoteAddress || 'unknown';
};

/**
 * Base rate limiter configuration
 * Used as foundation for endpoint-specific limiters
 */
const baseRateLimitConfig = {
	standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	handler: (req: Request, res: Response) => {
		const body = req.body as { email?: string };
		logger.warn('Rate limit exceeded', {
			endpoint: req.path,
			ip: req.ip,
			email: body.email,
			userAgent: req.get('user-agent'),
		});

		res.status(429).json({
			success: false,
			error: {
				message: 'Too many requests. Please try again later.',
				code: 'RATE_LIMIT_EXCEEDED',
				retryAfter: new Date(
					Date.now() + (req.rateLimit?.resetTime?.getTime() || 0) - Date.now()
				).toISOString(),
			},
			meta: {
				timestamp: new Date().toISOString(),
			},
		});
	},
	skip: (req: Request) => {
		// Disabled mode: skip every request, no store is touched
		if (!rateLimitConfig.enabled) return true;

		// Skip rate limiting for whitelisted IPs
		if (rateLimitConfig.whitelist.length > 0) {
			const clientIp = req.ip || '';
			return rateLimitConfig.whitelist.includes(clientIp);
		}
		return false;
	},
};

/**
 * Redis store for one limiter, prefix `rl:<name>:`.
 *
 * Redis only, no in-memory fallback: the store is created on first use once
 * Redis is ready, whatever the startup order, and requests fail closed (503
 * RATE_LIMIT_UNAVAILABLE) while Redis is down. When rate limiting is disabled,
 * `skip` short-circuits every request, so the store is never used.
 */
function getStore(name: string): RedisRateLimitStore {
	return new RedisRateLimitStore(name);
}

if (!rateLimitConfig.enabled) {
	logger.info('Rate limiting disabled (RATE_LIMIT_ENABLED=false)');
}

/**
 * Login Rate Limiter
 * Most restrictive: 5 attempts per 15 minutes per email+IP combination
 */
export const loginRateLimiter = rateLimit({
	...baseRateLimitConfig,
	windowMs: rateLimitConfig.login.windowMs,
	max: rateLimitConfig.login.max,
	keyGenerator: (req: Request) => {
		// Combine email + IP for granular tracking
		const body = req.body as { email?: string };
		const email = body.email || 'unknown';
		const ip = getClientIp(req);
		return `login:${email}:${ip}`;
	},
	skipSuccessfulRequests: true, // Only count failed login attempts
	store: getStore('auth:login'),
	handler: (req: Request, res: Response) => {
		const body = req.body as { email?: string };
		logger.warn('Login rate limit exceeded', {
			ip: req.ip,
			email: body.email,
			userAgent: req.get('user-agent'),
			remainingAttempts: 0,
		});

		res.status(429).json({
			success: false,
			error: {
				message: 'Too many login attempts. Please try again later.',
				code: 'RATE_LIMIT_EXCEEDED',
				retryAfter: new Date(
					Date.now() + (req.rateLimit?.resetTime?.getTime() || 0) - Date.now()
				).toISOString(),
			},
			meta: {
				timestamp: new Date().toISOString(),
			},
		});
	},
});

/**
 * Register Rate Limiter
 * Strict: 3 registrations per hour per IP
 */
export const registerRateLimiter = rateLimit({
	...baseRateLimitConfig,
	windowMs: rateLimitConfig.register.windowMs,
	max: rateLimitConfig.register.max,
	keyGenerator: (req: Request) => {
		return `register:${getClientIp(req)}`;
	},
	store: getStore('auth:register'),
	handler: (req: Request, res: Response) => {
		const body = req.body as { email?: string };
		logger.warn('Registration rate limit exceeded', {
			ip: req.ip,
			email: body.email,
			userAgent: req.get('user-agent'),
		});

		res.status(429).json({
			success: false,
			error: {
				message: 'Too many registration attempts. Please try again later.',
				code: 'RATE_LIMIT_EXCEEDED',
				retryAfter: new Date(
					Date.now() + (req.rateLimit?.resetTime?.getTime() || 0) - Date.now()
				).toISOString(),
			},
			meta: {
				timestamp: new Date().toISOString(),
			},
		});
	},
});

/**
 * OAuth Rate Limiter
 * More lenient: 10 attempts per 15 minutes per provider+IP
 */
export const oauthRateLimiter = rateLimit({
	...baseRateLimitConfig,
	windowMs: rateLimitConfig.oauth.windowMs,
	max: rateLimitConfig.oauth.max,
	keyGenerator: (req: Request) => {
		// Determine provider from path (google or facebook)
		const provider = req.path.includes('google') ? 'google' : 'facebook';
		return `oauth:${provider}:${getClientIp(req)}`;
	},
	store: getStore('auth:oauth'),
	handler: (req: Request, res: Response) => {
		const provider = req.path.includes('google') ? 'Google' : 'Facebook';

		logger.warn('OAuth rate limit exceeded', {
			provider,
			ip: req.ip,
			userAgent: req.get('user-agent'),
		});

		res.status(429).json({
			success: false,
			error: {
				message: `Too many ${provider} login attempts. Please try again later.`,
				code: 'RATE_LIMIT_EXCEEDED',
				retryAfter: new Date(
					Date.now() + (req.rateLimit?.resetTime?.getTime() || 0) - Date.now()
				).toISOString(),
			},
			meta: {
				timestamp: new Date().toISOString(),
			},
		});
	},
});

/**
 * Global Auth Rate Limiter
 * Safety net: 20 requests per 15 minutes to all /api/auth/* endpoints per IP
 * Applied to all auth routes as the first middleware
 */
export const globalAuthRateLimiter = rateLimit({
	...baseRateLimitConfig,
	windowMs: rateLimitConfig.global.windowMs,
	max: rateLimitConfig.global.max,
	keyGenerator: (req: Request) => {
		return `auth:global:${getClientIp(req)}`;
	},
	store: getStore('auth:global'),
	handler: (req: Request, res: Response) => {
		logger.warn('Global auth rate limit exceeded', {
			endpoint: req.path,
			ip: req.ip,
			userAgent: req.get('user-agent'),
		});

		res.status(429).json({
			success: false,
			error: {
				message: 'Too many authentication requests. Please try again later.',
				code: 'RATE_LIMIT_EXCEEDED',
				retryAfter: new Date(
					Date.now() + (req.rateLimit?.resetTime?.getTime() || 0) - Date.now()
				).toISOString(),
			},
			meta: {
				timestamp: new Date().toISOString(),
			},
		});
	},
});

/**
 * SoundCloud Rate Limiter
 * Per signed-in user: 120 requests per minute by default to /api/soundcloud/*.
 * Must run after `authMiddleware`, which sets `req.user`.
 */
export const soundcloudRateLimiter = rateLimit({
	...baseRateLimitConfig,
	windowMs: rateLimitConfig.soundcloud.windowMs,
	max: rateLimitConfig.soundcloud.max,
	keyGenerator: (req: Request) => {
		return `soundcloud:${(req as AuthenticatedRequest).user.id}`;
	},
	store: getStore('soundcloud'),
	handler: (req: Request, res: Response) => {
		logger.warn('SoundCloud rate limit exceeded', {
			endpoint: req.path,
			userId: (req as AuthenticatedRequest).user.id,
			ip: req.ip,
		});

		res.status(429).json({
			success: false,
			error: {
				message: 'Too many SoundCloud requests. Please try again later.',
				code: 'RATE_LIMIT_EXCEEDED',
				retryAfter: new Date(
					Date.now() + (req.rateLimit?.resetTime?.getTime() || 0) - Date.now()
				).toISOString(),
			},
			meta: {
				timestamp: new Date().toISOString(),
			},
		});
	},
});

/**
 * Avatar Rate Limiter
 * Per signed-in user: 10 profile photo uploads or removals per hour by default
 * (PUT and DELETE /api/profile/avatar). Must run after `authMiddleware`.
 */
export const avatarRateLimiter = rateLimit({
	...baseRateLimitConfig,
	windowMs: rateLimitConfig.avatar.windowMs,
	max: rateLimitConfig.avatar.max,
	keyGenerator: (req: Request) => {
		return `avatar:${(req as AuthenticatedRequest).user.id}`;
	},
	store: getStore('profile:avatar'),
	handler: (req: Request, res: Response) => {
		logger.warn('Avatar rate limit exceeded', {
			endpoint: req.path,
			userId: (req as AuthenticatedRequest).user.id,
			ip: req.ip,
		});

		res.status(429).json({
			success: false,
			error: {
				message: 'Too many profile photo changes. Please try again later.',
				code: 'RATE_LIMIT_EXCEEDED',
				retryAfter: new Date(
					Date.now() + (req.rateLimit?.resetTime?.getTime() || 0) - Date.now()
				).toISOString(),
			},
			meta: {
				timestamp: new Date().toISOString(),
			},
		});
	},
});

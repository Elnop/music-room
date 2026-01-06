import { env } from './env.js';

/**
 * Rate limiting configuration
 * All values are configurable via environment variables
 */
export const rateLimitConfig = {
	// Global toggle
	enabled: env.RATE_LIMIT_ENABLED !== 'false',

	// Redis connection
	redis: {
		host: env.REDIS_HOST || 'redis',
		port: parseInt(env.REDIS_PORT || '6379'),
		password: env.REDIS_PASSWORD || undefined,
		db: parseInt(env.REDIS_DB || '0'),
	},

	// Login endpoint rate limits
	login: {
		windowMs: parseInt(env.RATE_LIMIT_LOGIN_WINDOW_MS || '900000'), // 15 minutes
		max: parseInt(env.RATE_LIMIT_LOGIN_MAX || '5'), // 5 attempts
	},

	// Registration endpoint rate limits
	register: {
		windowMs: parseInt(env.RATE_LIMIT_REGISTER_WINDOW_MS || '3600000'), // 1 hour
		max: parseInt(env.RATE_LIMIT_REGISTER_MAX || '3'), // 3 registrations
	},

	// OAuth endpoints rate limits
	oauth: {
		windowMs: parseInt(env.RATE_LIMIT_OAUTH_WINDOW_MS || '900000'), // 15 minutes
		max: parseInt(env.RATE_LIMIT_OAUTH_MAX || '10'), // 10 attempts
	},

	// Global auth rate limits (safety net)
	global: {
		windowMs: parseInt(env.RATE_LIMIT_AUTH_WINDOW_MS || '900000'), // 15 minutes
		max: parseInt(env.RATE_LIMIT_AUTH_MAX || '20'), // 20 total requests
	},

	// Account lockout configuration
	lockout: {
		enabled: env.ACCOUNT_LOCKOUT_ENABLED !== 'false',
		threshold: parseInt(env.ACCOUNT_LOCKOUT_THRESHOLD || '5'), // 5 failed attempts
		durationSoft: parseInt(env.ACCOUNT_LOCKOUT_DURATION_SOFT || '900'), // 15 min (seconds)
		durationHard: parseInt(env.ACCOUNT_LOCKOUT_DURATION_HARD || '3600'), // 1 hour
		durationSevere: parseInt(env.ACCOUNT_LOCKOUT_DURATION_SEVERE || '86400'), // 24 hours
	},

	// IP reputation thresholds
	ipReputation: {
		throttleThreshold: parseInt(env.IP_THROTTLE_THRESHOLD || '10'), // 10 failed logins
		blockThreshold: parseInt(env.IP_BLOCK_THRESHOLD || '20'), // 20 failed logins
		blacklistThreshold: parseInt(env.IP_BLACKLIST_THRESHOLD || '50'), // 50+ failed logins
	},

	// IP whitelist (comma-separated IPs that bypass rate limiting)
	whitelist: env.RATE_LIMIT_WHITELIST_IPS
		? env.RATE_LIMIT_WHITELIST_IPS.split(',').map(ip => ip.trim())
		: [],
};

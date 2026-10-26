import { env } from './env.js';

export const rateLimitConfig = {
	enabled: env.RATE_LIMIT_ENABLED !== 'false',

	redis: {
		host: env.REDIS_HOST || 'redis',
		port: parseInt(env.REDIS_PORT || '6379'),
		password: env.REDIS_PASSWORD || undefined,
		db: parseInt(env.REDIS_DB || '0'),
	},

	login: {
		windowMs: parseInt(env.RATE_LIMIT_LOGIN_WINDOW_MS || '900000'), // 15 minutes
		max: parseInt(env.RATE_LIMIT_LOGIN_MAX || '5'),
	},

	register: {
		windowMs: parseInt(env.RATE_LIMIT_REGISTER_WINDOW_MS || '3600000'), // 1 hour
		max: parseInt(env.RATE_LIMIT_REGISTER_MAX || '3'),
	},

	oauth: {
		windowMs: parseInt(env.RATE_LIMIT_OAUTH_WINDOW_MS || '900000'), // 15 minutes
		max: parseInt(env.RATE_LIMIT_OAUTH_MAX || '10'),
	},

	global: {
		windowMs: parseInt(env.RATE_LIMIT_AUTH_WINDOW_MS || '900000'), // 15 minutes
		max: parseInt(env.RATE_LIMIT_AUTH_MAX || '20'),
	},

	// Failed access token verifications per IP (HTTP auth and socket handshake).
	token: {
		windowMs: env.RATE_LIMIT_TOKEN_WINDOW_MS,
		max: env.RATE_LIMIT_TOKEN_MAX,
	},

	// Per authenticated user.
	soundcloud: {
		windowMs: env.RATE_LIMIT_SOUNDCLOUD_WINDOW_MS,
		max: env.RATE_LIMIT_SOUNDCLOUD_MAX,
	},

	// Per authenticated user.
	avatar: {
		windowMs: env.RATE_LIMIT_AVATAR_WINDOW_MS,
		max: env.RATE_LIMIT_AVATAR_MAX,
	},

	// Per authenticated user.
	subscription: {
		windowMs: env.RATE_LIMIT_SUBSCRIPTION_WINDOW_MS,
		max: env.RATE_LIMIT_SUBSCRIPTION_MAX,
	},

	lockout: {
		enabled: env.ACCOUNT_LOCKOUT_ENABLED !== 'false',
		threshold: parseInt(env.ACCOUNT_LOCKOUT_THRESHOLD || '5'),
		durationSoft: parseInt(env.ACCOUNT_LOCKOUT_DURATION_SOFT || '900'), // 15 min (seconds)
		durationHard: parseInt(env.ACCOUNT_LOCKOUT_DURATION_HARD || '3600'), // 1 hour
		durationSevere: parseInt(env.ACCOUNT_LOCKOUT_DURATION_SEVERE || '86400'), // 24 hours
	},

	ipReputation: {
		throttleThreshold: parseInt(env.IP_THROTTLE_THRESHOLD || '10'),
		blockThreshold: parseInt(env.IP_BLOCK_THRESHOLD || '20'),
		blacklistThreshold: parseInt(env.IP_BLACKLIST_THRESHOLD || '50'),
	},

	// Comma-separated IPs that bypass rate limiting.
	whitelist: env.RATE_LIMIT_WHITELIST_IPS
		? env.RATE_LIMIT_WHITELIST_IPS.split(',').map(ip => ip.trim())
		: [],
};

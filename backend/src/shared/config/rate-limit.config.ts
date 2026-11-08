import { env } from './env.js';

export const rateLimitConfig = {
	enabled: env.RATE_LIMIT_ENABLED !== 'false',

	login: {
		windowMs: parseInt(env.RATE_LIMIT_LOGIN_WINDOW_MS || '900000'),
		max: parseInt(env.RATE_LIMIT_LOGIN_MAX || '5'),
	},

	register: {
		windowMs: parseInt(env.RATE_LIMIT_REGISTER_WINDOW_MS || '3600000'),
		max: parseInt(env.RATE_LIMIT_REGISTER_MAX || '3'),
	},

	oauth: {
		windowMs: parseInt(env.RATE_LIMIT_OAUTH_WINDOW_MS || '900000'),
		max: parseInt(env.RATE_LIMIT_OAUTH_MAX || '10'),
	},

	global: {
		windowMs: parseInt(env.RATE_LIMIT_AUTH_WINDOW_MS || '900000'),
		max: parseInt(env.RATE_LIMIT_AUTH_MAX || '20'),
	},

	token: {
		windowMs: env.RATE_LIMIT_TOKEN_WINDOW_MS,
		max: env.RATE_LIMIT_TOKEN_MAX,
	},

	soundcloud: {
		windowMs: env.RATE_LIMIT_SOUNDCLOUD_WINDOW_MS,
		max: env.RATE_LIMIT_SOUNDCLOUD_MAX,
	},

	avatar: {
		windowMs: env.RATE_LIMIT_AVATAR_WINDOW_MS,
		max: env.RATE_LIMIT_AVATAR_MAX,
	},

	playlistCover: {
		windowMs: env.RATE_LIMIT_PLAYLIST_COVER_WINDOW_MS,
		max: env.RATE_LIMIT_PLAYLIST_COVER_MAX,
	},

	subscription: {
		windowMs: env.RATE_LIMIT_SUBSCRIPTION_WINDOW_MS,
		max: env.RATE_LIMIT_SUBSCRIPTION_MAX,
	},

	events: {
		windowMs: env.RATE_LIMIT_EVENTS_WINDOW_MS,
		max: env.RATE_LIMIT_EVENTS_MAX,
	},

	geocode: {
		windowMs: env.RATE_LIMIT_GEOCODE_WINDOW_MS,
		max: env.RATE_LIMIT_GEOCODE_MAX,
	},

	lockout: {
		enabled: env.ACCOUNT_LOCKOUT_ENABLED !== 'false',
		threshold: parseInt(env.ACCOUNT_LOCKOUT_THRESHOLD || '5'),
		durationSoft: parseInt(env.ACCOUNT_LOCKOUT_DURATION_SOFT || '900'),
		durationHard: parseInt(env.ACCOUNT_LOCKOUT_DURATION_HARD || '3600'),
		durationSevere: parseInt(env.ACCOUNT_LOCKOUT_DURATION_SEVERE || '86400'),
	},

	ipReputation: {
		throttleThreshold: parseInt(env.IP_THROTTLE_THRESHOLD || '10'),
		blockThreshold: parseInt(env.IP_BLOCK_THRESHOLD || '20'),
		blacklistThreshold: parseInt(env.IP_BLACKLIST_THRESHOLD || '50'),
	},

	whitelist: env.RATE_LIMIT_WHITELIST_IPS
		? env.RATE_LIMIT_WHITELIST_IPS.split(',').map(ip => ip.trim())
		: [],
};

import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '@/shared/utils/logger.js';

/** Auth fails closed without Redis (logout denylist), so the client reconnects forever with a capped backoff. */
const redisConfig = {
	host: env.REDIS_HOST || 'redis',
	port: parseInt(env.REDIS_PORT || '6379'),
	password: env.REDIS_PASSWORD || undefined,
	db: parseInt(env.REDIS_DB || '0'),
	maxRetriesPerRequest: 3,
	enableOfflineQueue: false, // Commands fail fast while disconnected (fail-closed)
	lazyConnect: true,
	autoResubscribe: false,
	autoResendUnfulfilledCommands: false,
	retryStrategy(times: number) {
		// Linear backoff capped at 2s, forever.
		return Math.min(times * 50, 2000);
	},
};

export const redisClient = new Redis(redisConfig);

let isConnected = false;
let isConnecting = false;
let hasLoggedError = false;

redisClient.on('connect', () => {
	isConnecting = true;
});

redisClient.on('ready', () => {
	isConnected = true;
	isConnecting = false;
	hasLoggedError = false;
	logger.info('Redis connection established', {
		host: redisConfig.host,
		port: redisConfig.port,
		db: redisConfig.db,
	});
});

redisClient.on('error', error => {
	// Log only the first error of an outage; 'ready' logs the recovery.
	if (hasLoggedError) return;
	hasLoggedError = true;
	logger.error('Redis connection failed, retrying until it is back', {
		host: redisConfig.host,
		port: redisConfig.port,
		error: error.message,
	});
});

redisClient.on('close', () => {
	isConnected = false;
	// No logging on close, to avoid spam.
});

redisClient.on('reconnecting', () => {
	// No logging on reconnect, to avoid spam.
});

export async function connectRedis(): Promise<void> {
	try {
		if (isConnected || isConnecting) {
			logger.info('Redis already connected or connecting');
			return;
		}

		await redisClient.connect();
		logger.info('Redis initialization successful');
	} catch (error) {
		logger.error('Failed to connect to Redis', {
			error: error instanceof Error ? error.message : 'Unknown error',
			note: 'Authenticated requests answer 503 REVOCATION_UNAVAILABLE until Redis is ready',
		});
		// Don't throw: the backend starts even when Redis is down.
	}
}

export async function disconnectRedis(): Promise<void> {
	try {
		if (!isConnected) {
			redisClient.disconnect();
			return;
		}

		await redisClient.quit();
		logger.info('Redis disconnected gracefully');
	} catch (error) {
		logger.error('Error disconnecting Redis', {
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
}

export function isRedisConnected(): boolean {
	return isConnected && redisClient.status === 'ready';
}

export async function checkRedisHealth(): Promise<boolean> {
	try {
		if (!isConnected) {
			return false;
		}

		const pong = await redisClient.ping();
		return pong === 'PONG';
	} catch (error) {
		logger.error('Redis health check failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		return false;
	}
}

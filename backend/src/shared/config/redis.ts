import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '@/shared/utils/logger.js';

/**
 * Redis client configuration
 * Used for session revocation, rate limiting and brute force protection.
 *
 * Redis is always required: the logout denylist lives in Redis and
 * authentication fails closed without it (503 REVOCATION_UNAVAILABLE). The
 * client therefore never gives up: it reconnects forever with a capped backoff,
 * so an outage ends as soon as Redis is back, without restarting the backend.
 */
const redisConfig = {
	host: env.REDIS_HOST || 'redis',
	port: parseInt(env.REDIS_PORT || '6379'),
	password: env.REDIS_PASSWORD || undefined,
	db: parseInt(env.REDIS_DB || '0'),
	maxRetriesPerRequest: 3,
	enableOfflineQueue: false, // Commands fail fast while disconnected (fail-closed)
	lazyConnect: true,
	autoResubscribe: false, // Disable automatic resubscription
	autoResendUnfulfilledCommands: false, // Don't resend commands on reconnect
	retryStrategy(times: number) {
		// Linear backoff: 50ms, 100ms, 150ms ... capped at 2s, forever
		return Math.min(times * 50, 2000);
	},
};

// Create Redis client instance
export const redisClient = new Redis(redisConfig);

// Track connection status
let isConnected = false;
let isConnecting = false;
let hasLoggedError = false;

// Connection event handlers
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
	// Log the first error of an outage only; 'ready' logs the recovery
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
	// No logging on close to avoid spam
});

redisClient.on('reconnecting', () => {
	// No logging on reconnecting to avoid spam
});

/**
 * Initialize Redis connection
 * Call this at application startup
 */
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
		// Don't throw - allow backend to start even if Redis fails
	}
}

/**
 * Gracefully disconnect Redis
 * Call this at application shutdown
 */
export async function disconnectRedis(): Promise<void> {
	try {
		if (!isConnected) {
			// Stop the endless reconnection attempts
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

/**
 * Check if Redis is connected and ready
 */
export function isRedisConnected(): boolean {
	return isConnected && redisClient.status === 'ready';
}

/**
 * Health check for Redis
 * Returns true if Redis is reachable
 */
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

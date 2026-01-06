import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '@/shared/utils/logger.js';

/**
 * Check if Redis is needed based on configuration
 */
const isRedisRequired = (): boolean => {
	const rateLimitEnabled = env.RATE_LIMIT_ENABLED !== 'false';
	const lockoutEnabled = env.ACCOUNT_LOCKOUT_ENABLED !== 'false';
	return rateLimitEnabled || lockoutEnabled;
};

/**
 * Redis client configuration
 * Used for rate limiting and brute force protection
 */
const redisConfig = {
	host: env.REDIS_HOST || 'redis',
	port: parseInt(env.REDIS_PORT || '6379'),
	password: env.REDIS_PASSWORD || undefined,
	db: parseInt(env.REDIS_DB || '0'),
	maxRetriesPerRequest: 3,
	enableOfflineQueue: false, // Disable offline queue to prevent infinite retries
	lazyConnect: true,
	autoResubscribe: false, // Disable automatic resubscription
	autoResendUnfulfilledCommands: false, // Don't resend commands on reconnect
	retryStrategy(times: number) {
		// If Redis is not required (dev mode), stop retrying after 3 attempts
		if (!isRedisRequired() && times > 3) {
			return null; // Stop retrying
		}

		// Production mode: retry with exponential backoff up to 10 attempts
		if (times > 10) {
			return null; // Stop after 10 attempts
		}

		// Exponential backoff: 50ms, 100ms, 200ms, 400ms, 800ms, max 2s
		const delay = Math.min(times * 50, 2000);
		return delay;
	},
};

// Create Redis client instance
export const redisClient = new Redis(redisConfig);

// Track connection status
let isConnected = false;
let isConnecting = false;
let retryAttempts = 0;
let hasStoppedRetrying = false;

// Connection event handlers
redisClient.on('connect', () => {
	isConnecting = true;
	// Only log first connection attempt
	if (retryAttempts === 0) {
		logger.info('Redis connecting...', {
			host: redisConfig.host,
			port: redisConfig.port,
		});
	}
});

redisClient.on('ready', () => {
	isConnected = true;
	isConnecting = false;
	retryAttempts = 0; // Reset on successful connection
	hasStoppedRetrying = false;
	logger.info('Redis connection established', {
		host: redisConfig.host,
		port: redisConfig.port,
		db: redisConfig.db,
	});
});

redisClient.on('error', error => {
	retryAttempts++;

	// Check if we should stop retrying
	const maxRetries = isRedisRequired() ? 10 : 3;
	if (retryAttempts >= maxRetries && !hasStoppedRetrying) {
		hasStoppedRetrying = true;
		const logLevel = isRedisRequired() ? 'error' : 'info';
		logger[logLevel](`Redis connection failed after ${retryAttempts} attempts, giving up`, {
			required: isRedisRequired(),
			host: redisConfig.host,
			port: redisConfig.port,
			lastError: error.message,
		});
		// Disconnect to prevent further retries
		redisClient.disconnect();
		return;
	}

	// Only log first error to avoid spam
	if (retryAttempts === 1) {
		logger.warn('Redis connection failed, retrying...', {
			error: error.message,
			maxRetries,
		});
	}
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

		// If Redis is not required (dev mode), skip connection attempt
		if (!isRedisRequired()) {
			logger.info('Redis connection skipped (rate limiting and lockout disabled)', {
				RATE_LIMIT_ENABLED: env.RATE_LIMIT_ENABLED,
				ACCOUNT_LOCKOUT_ENABLED: env.ACCOUNT_LOCKOUT_ENABLED,
			});
			return;
		}

		await redisClient.connect();
		logger.info('Redis initialization successful');
	} catch (error) {
		const redisNeeded = isRedisRequired();
		const logLevel = redisNeeded ? 'error' : 'info';

		logger[logLevel]('Failed to connect to Redis', {
			error: error instanceof Error ? error.message : 'Unknown error',
			required: redisNeeded,
			note: redisNeeded
				? 'Security protections will not function properly'
				: 'Security protections disabled, Redis not required',
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

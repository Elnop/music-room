import RedisStore from 'rate-limit-redis';
import type {
	ClientRateLimitInfo,
	IncrementResponse,
	Options as RateLimitOptions,
	Store,
} from 'express-rate-limit';
import { redisClient, isRedisConnected } from '@/shared/config/redis.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';

/**
 * express-rate-limit store backed by Redis, independent of startup order.
 *
 * The limiters are built when their module is imported, usually before
 * `connectRedis()` has finished. This store therefore creates the
 * `rate-limit-redis` store on first use, once Redis is ready, and sends no
 * command while the client is not ready (the client has no offline queue).
 *
 * Fail closed, never in memory: while Redis is unavailable, `get`,
 * `increment` and `resetKey` throw a 503 RATE_LIMIT_UNAVAILABLE, which
 * express-rate-limit forwards to the error handler (`passOnStoreError` stays
 * false). `decrement` runs after the response, outside any error handler, so it
 * only logs: throwing there would be an unhandled rejection.
 */
export class RedisRateLimitStore implements Store {
	/** Keys live in Redis, shared by every backend instance. */
	readonly localKeys = false;

	/** Full Redis key prefix, e.g. `rl:auth:login:`. */
	readonly prefix: string;

	private options?: RateLimitOptions;
	private delegate?: RedisStore;

	constructor(name: string) {
		this.prefix = `rl:${name}:`;
	}

	init(options: RateLimitOptions): void {
		// Keep the options; the Redis store is created on first use.
		this.options = options;
	}

	async get(key: string): Promise<ClientRateLimitInfo | undefined> {
		const store = this.requireStore();
		return this.wrap(() => store.get(key));
	}

	async increment(key: string): Promise<IncrementResponse> {
		const store = this.requireStore();
		return this.wrap(() => store.increment(key));
	}

	async decrement(key: string): Promise<void> {
		try {
			await this.requireStore().decrement(key);
		} catch (error) {
			logger.warn('Rate limit decrement skipped: Redis unavailable', {
				prefix: this.prefix,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	async resetKey(key: string): Promise<void> {
		const store = this.requireStore();
		return this.wrap(() => store.resetKey(key));
	}

	/**
	 * Returns the Redis store, creating it the first time Redis is ready.
	 * Throws while Redis is not ready, so no command is sent.
	 */
	private requireStore(): RedisStore {
		if (!isRedisConnected()) {
			throw this.unavailable();
		}

		if (!this.delegate) {
			const store = new RedisStore({
				// @ts-expect-error - RedisStore types don't match ioredis perfectly but it works
				sendCommand: (...args: string[]) => redisClient.call(...args),
				prefix: this.prefix,
			});
			// The constructor loads its scripts without awaiting them; get and
			// increment reload a script that failed. Mark the first attempts
			// handled so a failed load is never an unhandled rejection.
			store.incrementScriptSha.catch(() => undefined);
			store.getScriptSha.catch(() => undefined);
			if (this.options) store.init(this.options);
			this.delegate = store;
			logger.debug(`Using Redis store for rate limiting: ${this.prefix}`);
		}

		return this.delegate;
	}

	private async wrap<T>(operation: () => Promise<T>): Promise<T> {
		try {
			return await operation();
		} catch (error) {
			logger.error('Rate limiting failed: Redis command error', {
				prefix: this.prefix,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw this.unavailable();
		}
	}

	private unavailable(): AppError {
		return new AppError(503, 'Rate limiting is unavailable', 'RATE_LIMIT_UNAVAILABLE');
	}
}

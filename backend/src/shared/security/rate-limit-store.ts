import type {
	ClientRateLimitInfo,
	IncrementResponse,
	Options as RateLimitOptions,
	Store,
} from 'express-rate-limit';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import * as counter from '@/shared/security/counter.js';

/**
 * express-rate-limit store on the shared counter (counter.ts), one per
 * limiter, keys `rl:<name>:<key>`.
 *
 * The limiters are built when their module is imported, usually before
 * `connectRedis()` has finished; the store only reads `windowMs` at init and
 * sends nothing until a request comes, so the startup order does not matter.
 *
 * Fail closed, never in memory: while Redis is not ready, `get`, `increment`
 * and `resetKey` throw a 503 RATE_LIMIT_UNAVAILABLE without sending a command,
 * which express-rate-limit forwards to the error handler (`passOnStoreError`
 * stays false); a Redis command error gives the same 503. `decrement` runs
 * after the response, outside any error handler, so it only logs: throwing
 * there would be an unhandled rejection.
 */

export type RateLimitStore = Store & { readonly prefix: string; readonly localKeys: false };

function unavailable(): AppError {
	return new AppError(503, 'Rate limiting is unavailable', 'RATE_LIMIT_UNAVAILABLE');
}

function toInfo({ count, ttlMs }: counter.CounterState): IncrementResponse {
	return { totalHits: count, resetTime: new Date(Date.now() + ttlMs) };
}

export function createRateLimitStore(name: string): RateLimitStore {
	const prefix = `rl:${name}:`;
	let windowMs = 0;

	async function run<T>(operation: () => Promise<T>): Promise<T> {
		if (!counter.isReady()) throw unavailable();
		try {
			return await operation();
		} catch (error) {
			logger.error('Rate limiting failed: Redis command error', {
				prefix,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw unavailable();
		}
	}

	return {
		/** Keys live in Redis, shared by every backend instance. */
		localKeys: false,
		prefix,

		init(options: RateLimitOptions): void {
			windowMs = options.windowMs;
		},

		async get(key: string): Promise<ClientRateLimitInfo | undefined> {
			const state = await run(() => counter.peek(prefix + key));
			return state.ttlMs === -2 ? undefined : toInfo(state);
		},

		async increment(key: string): Promise<IncrementResponse> {
			return toInfo(await run(() => counter.hit(prefix + key, windowMs)));
		},

		async decrement(key: string): Promise<void> {
			try {
				if (!counter.isReady()) throw unavailable();
				await counter.release(prefix + key);
			} catch (error) {
				logger.warn('Rate limit decrement skipped: Redis unavailable', {
					prefix,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		},

		async resetKey(key: string): Promise<void> {
			await run(() => counter.clear(prefix + key));
		},
	};
}

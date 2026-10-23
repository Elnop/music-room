import { rateLimitConfig } from '@/shared/config/rate-limit.config.js';
import { logger } from '@/shared/utils/logger.js';
import * as counter from '@/shared/security/counter.js';

/**
 * How account lockout and IP reputation run a Redis operation: skipped when
 * ACCOUNT_LOCKOUT_ENABLED=false, and fail open (a safe default, logged) while
 * Redis is not ready or when a command fails. An accepted risk: the login
 * rate limiter, which runs first, fails closed (doc/security/threat-model.md).
 */
interface FailOpenOptions<T> {
	/** Debug log when lockout is disabled. */
	disabled: string;
	/** Log while Redis is not ready, at `unavailableLevel` (warn by default). */
	unavailable: string;
	unavailableLevel?: 'warn' | 'error';
	/** Error log when a command fails. */
	failed: string;
	/** Result when disabled (defaults to `fallback`). */
	whenDisabled?: T;
	/** Result while Redis is not ready or after an error. */
	fallback: T;
}

export async function failOpen<T>(
	options: FailOpenOptions<T>,
	context: Record<string, unknown>,
	run: () => Promise<T>
): Promise<T> {
	if (!rateLimitConfig.lockout.enabled) {
		logger.debug(options.disabled, context);
		return options.whenDisabled ?? options.fallback;
	}

	if (!counter.isReady()) {
		logger[options.unavailableLevel ?? 'warn'](options.unavailable, context);
		return options.fallback;
	}

	try {
		return await run();
	} catch (error) {
		logger.error(options.failed, {
			error: error instanceof Error ? error.message : 'Unknown error',
			...context,
		});
		return options.fallback;
	}
}

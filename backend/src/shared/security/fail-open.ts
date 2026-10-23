import { rateLimitConfig } from '@/shared/config/rate-limit.config.js';
import { logger } from '@/shared/utils/logger.js';
import * as counter from '@/shared/security/counter.js';

/** Accepted risk: fails open, but the login rate limiter that runs first fails closed (doc/security/threat-model.md). */
interface FailOpenOptions<T> {
	disabled: string;
	/** Logged at `unavailableLevel` (warn by default). */
	unavailable: string;
	unavailableLevel?: 'warn' | 'error';
	failed: string;
	/** Defaults to `fallback`. */
	whenDisabled?: T;
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

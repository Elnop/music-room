import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import * as counter from '@/shared/security/counter.js';

// One Redis key per upstream, shared by every user and backend instance: at most one call per
// interval reaches it. Fails closed while Redis is down, since the upstream's policy comes first.

const UPSTREAM_PREFIX = 'rl:upstream:';

interface SlotOptions {
	intervalMs: number;
	/** How long a request may queue for a slot before getting a 429. */
	maxWaitMs: number;
}

function unavailable(): AppError {
	return new AppError(503, 'Rate limiting is unavailable', 'RATE_LIMIT_UNAVAILABLE');
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function hit(key: string, intervalMs: number): Promise<counter.CounterState> {
	try {
		return await counter.hit(key, intervalMs);
	} catch (error) {
		logger.error('Upstream slot could not reach Redis', {
			key,
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		throw unavailable();
	}
}

/** Resolves once this caller owns the upstream's slot: the hit that opens a new window wins. */
export async function takeUpstreamSlot(upstream: string, options: SlotOptions): Promise<void> {
	if (!counter.isReady()) throw unavailable();
	const key = UPSTREAM_PREFIX + upstream;
	const deadline = Date.now() + options.maxWaitMs;

	for (;;) {
		const { count, ttlMs } = await hit(key, options.intervalMs);
		if (count === 1) return;
		const waitMs = ttlMs > 0 ? ttlMs : options.intervalMs;
		if (Date.now() + waitMs > deadline) {
			logger.warn('Upstream slot wait exceeded', { upstream, waitMs });
			throw new AppError(429, 'The service is busy. Please try again.', 'RATE_LIMIT_EXCEEDED', {
				retryAfter: new Date(Date.now() + waitMs).toISOString(),
			});
		}
		await sleep(waitMs);
	}
}

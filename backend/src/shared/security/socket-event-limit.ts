// In memory by design, not as a fallback: the counters belong to one connection, on one backend instance.
// Only the first refusal of a window logs a warning.

interface EventLimit {
	max: number;
	windowMs: number;
}

const DEFAULT_EVENT_LIMIT: EventLimit = { max: 30, windowMs: 10_000 };

/** Any other event name shares the default counter. */
const EVENT_LIMITS: Readonly<Record<string, EventLimit>> = {
	'listening:update': { max: 20, windowMs: 10_000 },
	'listening:subscribe': DEFAULT_EVENT_LIMIT,
	'listening:unsubscribe': DEFAULT_EVENT_LIMIT,
	'control:action': { max: 20, windowMs: 10_000 },
	'playlist:join': DEFAULT_EVENT_LIMIT,
	'playlist:leave': DEFAULT_EVENT_LIMIT,
};

export const RATE_LIMITED = {
	message: 'Too many events, slow down',
	code: 'RATE_LIMITED',
} as const;

/** `playlist:error` carries `playlistId`; none for other event names. */
export function rateLimitedErrorFor(
	eventName: string
): { event: string; payload: Record<string, unknown> } | null {
	const prefix = eventName.split(':')[0];
	if (prefix === 'playlist') {
		return { event: 'playlist:error', payload: { playlistId: null, ...RATE_LIMITED } };
	}
	if (prefix === 'listening' || prefix === 'control') {
		return { event: `${prefix}:error`, payload: { ...RATE_LIMITED } };
	}
	return null;
}

type LimitDecision = 'allowed' | 'limited' | 'still-limited';

/** Events without their own limit share one counter, so random event names cannot grow the map. */
export function createSocketEventLimiter(
	limits: Readonly<Record<string, EventLimit>> = EVENT_LIMITS,
	fallback: EventLimit = DEFAULT_EVENT_LIMIT,
	now: () => number = Date.now
): (eventName: string) => LimitDecision {
	const windows = new Map<string, { start: number; count: number }>();

	return eventName => {
		const own = Object.hasOwn(limits, eventName);
		const key = own ? eventName : '*';
		const { max, windowMs } = own ? limits[eventName] : fallback;
		const time = now();
		const window = windows.get(key);

		if (!window || time - window.start >= windowMs) {
			windows.set(key, { start: time, count: 1 });
			return 'allowed';
		}

		window.count += 1;
		if (window.count <= max) return 'allowed';
		return window.count === max + 1 ? 'limited' : 'still-limited';
	};
}

import { redisClient, isRedisConnected } from '@/shared/config/redis.js';

/**
 * The one Redis path of the anti-abuse module: every limiter counts and flags
 * through these functions, never through `redisClient` directly.
 *
 * Nothing here checks readiness or catches errors: each limiter decides what
 * Redis being down means for it (fail closed with a 503, or fail open), with
 * `isReady()` before a call and its own try/catch around it. There is no
 * in-memory fallback (doc/REDIS.md, "No In-Memory Fallback").
 */

export interface CounterState {
	/** Hits in the current window (0 when the key does not exist). */
	count: number;
	/** Milliseconds until the window ends (Redis PTTL: -2 missing, -1 no expiry). */
	ttlMs: number;
}

/**
 * One hit in a fixed window: a key without expiry (missing or expired) starts
 * a new window at 1 that ends `windowMs` later; otherwise the count goes up and
 * the window keeps its end. Atomic, so a parallel burst cannot pass the limit.
 */
const HIT_SCRIPT = `local ttl = redis.call('PTTL', KEYS[1])
if ttl <= 0 then
	redis.call('SET', KEYS[1], 1, 'PX', ARGV[1])
	return { 1, tonumber(ARGV[1]) }
end
return { redis.call('INCR', KEYS[1]), ttl }`;

/** The count and time left of a window, read together. */
const PEEK_SCRIPT = `return { redis.call('GET', KEYS[1]), redis.call('PTTL', KEYS[1]) }`;

/** DECR only while the key exists: never recreate an expired key without expiry. */
const RELEASE_SCRIPT =
	"if redis.call('EXISTS', KEYS[1]) == 1 then return redis.call('DECR', KEYS[1]) end return 0";

function toState(reply: unknown): CounterState {
	const [count, ttlMs] = reply as [unknown, unknown];
	return { count: Number(count ?? 0) || 0, ttlMs: Number(ttlMs) };
}

/** True when commands can be sent (the client has no offline queue). */
export function isReady(): boolean {
	return isRedisConnected();
}

/** Seconds left as Redis' TTL gives them (rounded), 0 when none. */
export function toSeconds(ttlMs: number): number {
	return ttlMs > 0 ? Math.floor((ttlMs + 500) / 1000) : 0;
}

/** Count one hit on `key` in a window of `windowMs`. */
export async function hit(key: string, windowMs: number): Promise<CounterState> {
	return toState(await redisClient.eval(HIT_SCRIPT, 1, key, String(windowMs)));
}

/** Read a counter without counting. */
export async function peek(key: string): Promise<CounterState> {
	return toState(await redisClient.eval(PEEK_SCRIPT, 1, key));
}

/** Give back one hit, if the window still exists. */
export async function release(key: string): Promise<void> {
	await redisClient.eval(RELEASE_SCRIPT, 1, key);
}

/** Delete a counter or a flag; the number of keys deleted (0 or 1). */
export async function clear(key: string): Promise<number> {
	return redisClient.del(key);
}

/** Set a flag (a lock, a blacklist entry) holding `value` for `ttlSeconds`. */
export async function setFlag(key: string, ttlSeconds: number, value: string): Promise<void> {
	await redisClient.setex(key, ttlSeconds, value);
}

/** Whether a flag is set, and its seconds left (Redis TTL: -1 when it has no expiry). */
export async function readFlag(key: string): Promise<{ isSet: boolean; ttlSeconds: number }> {
	const ttlSeconds = await redisClient.ttl(key);
	return { isSet: ttlSeconds !== -2, ttlSeconds };
}

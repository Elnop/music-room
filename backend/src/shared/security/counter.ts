import { redisClient, isRedisConnected } from '@/shared/config/redis.js';

export interface CounterState {
	count: number;
	ttlMs: number;
}

const HIT_SCRIPT = `local ttl = redis.call('PTTL', KEYS[1])
if ttl <= 0 then
	redis.call('SET', KEYS[1], 1, 'PX', ARGV[1])
	return { 1, tonumber(ARGV[1]) }
end
return { redis.call('INCR', KEYS[1]), ttl }`;

const PEEK_SCRIPT = `return { redis.call('GET', KEYS[1]), redis.call('PTTL', KEYS[1]) }`;

const RELEASE_SCRIPT =
	"if redis.call('EXISTS', KEYS[1]) == 1 then return redis.call('DECR', KEYS[1]) end return 0";

function toState(reply: unknown): CounterState {
	const [count, ttlMs] = reply as [unknown, unknown];
	return { count: Number(count ?? 0) || 0, ttlMs: Number(ttlMs) };
}

export function isReady(): boolean {
	return isRedisConnected();
}

export function toSeconds(ttlMs: number): number {
	return ttlMs > 0 ? Math.floor((ttlMs + 500) / 1000) : 0;
}

export async function hit(key: string, windowMs: number): Promise<CounterState> {
	return toState(await redisClient.eval(HIT_SCRIPT, 1, key, String(windowMs)));
}

export async function peek(key: string): Promise<CounterState> {
	return toState(await redisClient.eval(PEEK_SCRIPT, 1, key));
}

export async function release(key: string): Promise<void> {
	await redisClient.eval(RELEASE_SCRIPT, 1, key);
}

export async function clear(key: string): Promise<number> {
	return redisClient.del(key);
}

export async function setFlag(key: string, ttlSeconds: number, value: string): Promise<void> {
	await redisClient.setex(key, ttlSeconds, value);
}

export async function readFlag(key: string): Promise<{ isSet: boolean; ttlSeconds: number }> {
	const ttlSeconds = await redisClient.ttl(key);
	return { isSet: ttlSeconds !== -2, ttlSeconds };
}

/** Shared by search, track and stream lookups; each prefixes its keys (`search:`, `track:`, `stream:`). */

export const CACHE_TTL = {
	SEARCH: 3600,
	TRACK: 3600,
	// Stream URLs live STREAM_URL_LIFETIME_S; caching them for less guarantees a cached URL
	// still has 10 minutes left, and a renewal made 2 minutes before expiry misses the cache.
	STREAM: 1200,
} as const;

export const STREAM_URL_LIFETIME_S = 1800;

interface CacheEntry {
	data: unknown;
	expiry: number;
}

const entries = new Map<string, CacheEntry>();

/** Null when absent or expired; an expired entry is dropped on read. */
export function get<T>(key: string): T | null {
	const cached = entries.get(key);
	if (!cached) return null;

	if (Date.now() > cached.expiry) {
		entries.delete(key);
		return null;
	}

	return cached.data as T;
}

export function set(key: string, data: unknown, ttlSeconds: number): void {
	entries.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 });
}

export function clear(): void {
	entries.clear();
}

/** Expired entries count until read. */
export function size(): number {
	return entries.size;
}

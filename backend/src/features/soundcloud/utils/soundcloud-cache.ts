/**
 * In-memory cache with a TTL, shared by search, track and stream lookups (each
 * prefixes its keys: `search:`, `track:`, `stream:`).
 */

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
	SEARCH: 3600, // 1 hour for search results
	TRACK: 3600, // 1 hour for track details
	// Stream URLs live STREAM_URL_LIFETIME_S; caching them for less guarantees a cached URL
	// still has 10 minutes left, and a renewal made 2 minutes before expiry misses the cache.
	STREAM: 1200,
} as const;

/** Lifetime of a SoundCloud stream URL, in seconds */
export const STREAM_URL_LIFETIME_S = 1800;

interface CacheEntry {
	data: unknown;
	expiry: number;
}

const entries = new Map<string, CacheEntry>();

/** The cached value, or null when absent or expired (an expired entry is dropped). */
export function get<T>(key: string): T | null {
	const cached = entries.get(key);
	if (!cached) return null;

	if (Date.now() > cached.expiry) {
		entries.delete(key);
		return null;
	}

	return cached.data as T;
}

/** Store a value for ttlSeconds. */
export function set(key: string, data: unknown, ttlSeconds: number): void {
	entries.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 });
}

/** Drop every entry. */
export function clear(): void {
	entries.clear();
}

/** Number of entries, expired ones included until read. */
export function size(): number {
	return entries.size;
}

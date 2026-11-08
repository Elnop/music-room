export const CACHE_TTL = {
	SEARCH: 3600,
	TRACK: 3600,
} as const;

interface CacheEntry {
	data: unknown;
	expiry: number;
}

const entries = new Map<string, CacheEntry>();

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

export function size(): number {
	return entries.size;
}

/**
 * SoundCloud cache utilities
 */

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SEARCH: 3600, // 1 hour for search results
  TRACK: 3600, // 1 hour for track details
  STREAM: 1800, // 30 minutes for stream URLs (they can expire)
} as const;

export interface CacheEntry<T> {
  data: T;
  expiry: number;
}

/**
 * Simple in-memory cache with TTL support
 */
export class SoundCloudCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Get cached value if not expired
   */
  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Set cache with TTL in seconds
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

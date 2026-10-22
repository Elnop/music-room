import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/services/api';

/**
 * Named cache profiles: how long fetched data counts as fresh. A query hook
 * picks one (`staleTime: STALE.long`) instead of a number of its own.
 * - none: refetch on every mount (data another user changes often);
 * - short: the default, lists that move but not every second;
 * - long: data that rarely changes (genres, linked accounts, devices).
 */
export const STALE = {
	none: 0,
	short: 30_000,
	long: 5 * 60_000,
} as const;

const MAX_RETRIES = 2;

/**
 * Retries a failed query on a network error or a 5xx, never on a 4xx: the
 * same request would get the same answer (#377).
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
	if (failureCount >= MAX_RETRIES) return false;
	const status = error instanceof ApiError ? error.status : undefined;
	return status === undefined || status >= 500;
}

/** The app's QueryClient; created once by AppProviders (and per test). */
export function createQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: { staleTime: STALE.short, retry: shouldRetry },
			mutations: { retry: false },
		},
	});
}

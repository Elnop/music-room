import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/services/api';

// none: data other users change often; long: rarely changes (genres, accounts, devices).
export const STALE = {
	none: 0,
	short: 30_000,
	long: 5 * 60_000,
} as const;

const MAX_RETRIES = 2;

/** Never retries a 4xx: the same request would get the same answer. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
	if (failureCount >= MAX_RETRIES) return false;
	const status = error instanceof ApiError ? error.status : undefined;
	return status === undefined || status >= 500;
}

export function createQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: { staleTime: STALE.short, retry: shouldRetry },
			mutations: { retry: false },
		},
	});
}

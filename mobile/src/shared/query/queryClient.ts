import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/services/api';

export const STALE = {
	none: 0,
	short: 30_000,
	long: 5 * 60_000,
} as const;

const MAX_RETRIES = 2;

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

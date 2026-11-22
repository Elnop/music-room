import { ApiError } from '@/shared/backend/lib/ApiError';

const MAX_RETRIES = 2;

export function shouldRetry(failureCount: number, error: unknown): boolean {
	if (failureCount >= MAX_RETRIES) return false;
	const status = error instanceof ApiError ? error.status : undefined;
	return status === undefined || status >= 500;
}

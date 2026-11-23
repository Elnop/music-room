import type { DefaultOptions } from '@tanstack/react-query';
import { STALE } from '@/shared/backend/configs/staleQueryConfig';
import { shouldRetry } from '@/shared/backend/lib/shouldRetry';

export const QUERY_DEFAULTS: DefaultOptions = {
	queries: { staleTime: STALE.short, retry: shouldRetry },
	mutations: { retry: false },
};

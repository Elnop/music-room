import { QueryClient } from '@tanstack/react-query';
import { STALE } from '@/shared/backend/configs/staleQueryConfig';
import { shouldRetry } from '@/shared/backend/lib/shouldRetry';

export function createQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: { staleTime: STALE.short, retry: shouldRetry },
			mutations: { retry: false },
		},
	});
}

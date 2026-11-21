import { STALE } from '@/shared/backend/configs/staleQueryConfig';

export const ON_EVERY_VISIT = { staleTime: STALE.none, retry: false } as const;

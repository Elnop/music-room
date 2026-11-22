import { ApiError } from '@/shared/backend/lib/ApiError';
import type { LoadFailure } from '@/features/playlists/features/editor/features/detail/types/detailScreenTypes';

type DetailQuery = {
	error: unknown;
	data: unknown;
	isFetching: boolean;
};

export function loadFailure({ error, data, isFetching }: DetailQuery): LoadFailure {
	if (!error || data || isFetching) return null;
	const notFound = error instanceof ApiError && (error.status === 403 || error.status === 404);
	return notFound ? 'notFound' : 'error';
}

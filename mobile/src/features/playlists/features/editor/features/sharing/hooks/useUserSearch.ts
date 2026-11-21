import { useEffect } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import { useSession } from '@/shared/backend/hooks/useSession';
import { logger } from '@/shared/logging/logger';
import { useDebouncedText } from '@/features/playlists/features/editor/shared/debounced-text/useDebouncedText';
import { searchUsers } from '@/features/playlists/shared/playlist/lib/peopleApi';
import type { UserSearch } from '@/features/playlists/features/editor/features/sharing/sharingTypes';

export function useUserSearch(excludedIds: string[]): UserSearch {
	const search = useDebouncedText();
	const signedIn = useSession(session => session.isAuthenticated);
	const query = search.settled.trim();
	const found = useQuery({
		queryKey: queryKeys.friends.search(query),
		queryFn: () => searchUsers(query),
		enabled: signedIn && query !== '',
		placeholderData: keepPreviousData,
		retry: false,
	});

	useEffect(() => {
		if (found.error) logger.error('[PlaylistSharing] Search failed:', found.error);
	}, [found.error]);

	return {
		search,
		results: query ? (found.data ?? []).filter(user => !excludedIds.includes(user.id)) : [],
		isSearching: found.isFetching,
	};
}

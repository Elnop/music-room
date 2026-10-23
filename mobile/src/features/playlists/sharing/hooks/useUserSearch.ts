import { useEffect } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { useSession } from '@/shared/services/authSession';
import { logger } from '@/shared/utils/logger';
import { useDebouncedText, type DebouncedText } from '@/features/playlists/hooks/useDebouncedText';
import { searchUsers } from '@/features/playlists/services/usersApi';
import type { UserSummary } from '@/features/playlists/types';

export interface UserSearch {
	search: DebouncedText;
	/** Matching users, but the owner and the members already there. */
	results: UserSummary[];
	isSearching: boolean;
}

/** Finds the users to give access to; the previous results stay while the next search runs. */
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

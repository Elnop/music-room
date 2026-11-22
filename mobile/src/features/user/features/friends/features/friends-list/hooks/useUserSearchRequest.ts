import { useCallback, useState } from 'react';
import { runUserSearch } from '@/features/user/features/friends/features/friends-list/runUserSearch';
import type { UserSearchRequest } from '@/features/user/features/friends/features/friends-list/friendsListTypes';

const IDLE_REQUEST: UserSearchRequest = { results: [], isSearching: false, failed: false };

export function useUserSearchRequest() {
	const [request, setRequest] = useState<UserSearchRequest>(IDLE_REQUEST);
	const performSearch = useCallback(
		(query: string, isRefresh = false) => runUserSearch(query, isRefresh, setRequest),
		[],
	);
	return { request, setRequest, performSearch };
}

import type React from 'react';
import { showError } from '@/shared/theme/lib/toast';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { logger } from '@/shared/logging/logger';
import { friendsApi } from '@/features/user/features/friends/shared/follows/friendsApi';
import type { UserSearchRequest } from '@/features/user/features/friends/features/friends-list/friendsListTypes';

type SetRequest = React.Dispatch<React.SetStateAction<UserSearchRequest>>;

export async function runUserSearch(query: string, isRefresh: boolean, setRequest: SetRequest) {
	if (!query.trim()) {
		setRequest(request => ({ ...request, results: [] }));
		return;
	}
	setRequest(request => ({ ...request, isSearching: true, failed: isRefresh && request.failed }));
	try {
		const results = await friendsApi.searchUsers(query);
		setRequest(request => ({ ...request, results }));
	} catch (error) {
		logger.error('[FriendsList] User search failed:', error);
		showError(apiErrorMessage(error, 'La recherche a échoué'));
		if (!isRefresh) setRequest(request => ({ ...request, results: [], failed: true }));
	} finally {
		setRequest(request => ({ ...request, isSearching: false }));
	}
}

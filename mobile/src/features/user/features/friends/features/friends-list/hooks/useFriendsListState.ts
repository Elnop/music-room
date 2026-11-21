import { useFriendsList } from '@/features/user/features/friends/shared/follows/hooks/useFriendsQueries';
import { useFriendsRefresh } from '@/features/user/features/friends/features/friends-list/hooks/useFriendsRefresh';
import type { FriendProfile } from '@/features/user/features/friends/friendsTypes';
import type { FriendsListState } from '@/features/user/features/friends/features/friends-list/friendsListTypes';

const NO_FRIENDS: FriendProfile[] = [];

export function useFriendsListState(refetchPermissions: () => unknown) {
	const query = useFriendsList();
	const friends = query.data ?? NO_FRIENDS;
	const refresh = useFriendsRefresh(query.refetch, refetchPermissions);

	const friendsList: FriendsListState = {
		friends,
		isLoading: query.isPending,
		loadFailed: query.isError && friends.length === 0,
		onRetry: query.refetch,
		isRefreshing: refresh.isRefreshing,
		onRefresh: refresh.onRefresh,
	};
	return { friendsList, hasLoadedFriends: query.isSuccess };
}

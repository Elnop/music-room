import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import { useDebouncedUserSearch } from '@/features/user/features/friends/features/friends-list/hooks/useDebouncedUserSearch';
import { useFriendControl } from '@/features/user/features/friends/features/friends-list/hooks/useFriendControl';
import { useFriendsListState } from '@/features/user/features/friends/features/friends-list/hooks/useFriendsListState';
import { useFriendsTabs } from '@/features/user/features/friends/features/friends-list/hooks/useFriendsTabs';

export function useFriendsListScreen(onNavigateToProfile: (userId: string) => void) {
	const { control, refetchPermissions } = useFriendControl();
	const { friendsList, hasLoadedFriends } = useFriendsListState(refetchPermissions);
	const tabs = useFriendsTabs(friendsList.friends.length, hasLoadedFriends);

	return {
		tabs,
		friendsList,
		search: useDebouncedUserSearch(),
		control,
		onSelectUser: onNavigateToProfile,
		bottomPadding: useBottomPadding(),
	};
}

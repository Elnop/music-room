import { useEffect, useRef, useState } from 'react';
import type {
	FriendsTab,
	FriendsTabs,
} from '@/features/user/features/friends/features/friends-list/friendsListTypes';

export function useFriendsTabs(friendsCount: number, hasLoadedFriends: boolean): FriendsTabs {
	const [activeTab, setActiveTab] = useState<FriendsTab>('friends');
	const hasCheckedEmptyRef = useRef(false);

	useEffect(() => {
		if (hasLoadedFriends && friendsCount === 0 && !hasCheckedEmptyRef.current) {
			hasCheckedEmptyRef.current = true;
			setActiveTab('search');
		}
	}, [hasLoadedFriends, friendsCount]);

	return { activeTab, onTabChange: setActiveTab };
}

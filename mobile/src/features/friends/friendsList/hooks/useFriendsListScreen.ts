import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { usePlayerHeight } from '@/shared/services/playbackBridge';
import { showError } from '@/shared/utils/toast';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { logger } from '@/shared/utils/logger';
import { useFriendsList, useControlPermissions } from '@/features/friends/hooks/useFriendsQueries';
import { useToggleControlMutation } from '@/features/friends/hooks/useFriendsMutations';
import { useDebouncedUserSearch } from './useDebouncedUserSearch';

export function useFriendsListScreen(onNavigateToProfile: (userId: string) => void) {
	const playerHeight = usePlayerHeight();
	const {
		data: friends = [],
		isLoading: isLoadingFriends,
		refetch: refetchFriends,
	} = useFriendsList();
	const { data: permissions = [], refetch: refetchPermissions } = useControlPermissions();
	const toggleMutation = useToggleControlMutation();
	const search = useDebouncedUserSearch();

	const [activeTab, setActiveTab] = useState<'friends' | 'search'>('friends');
	const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
	const [isRefreshingFriends, setIsRefreshingFriends] = useState(false);

	const hasCheckedEmptyRef = useRef(false);
	useEffect(() => {
		if (!isLoadingFriends && friends.length === 0 && !hasCheckedEmptyRef.current) {
			hasCheckedEmptyRef.current = true;
			setActiveTab('search');
		}
	}, [isLoadingFriends, friends.length]);

	const handleToggleControl = useCallback(
		async (friendId: string, currentValue: boolean) => {
			setTogglingUserId(friendId);
			try {
				await toggleMutation.mutateAsync({ userId: friendId, shouldGrant: !currentValue });
			} catch (err) {
				logger.error('[FriendsList] Failed to toggle control:', err);
				showError(apiErrorMessage(err, 'Impossible de modifier les permissions'));
			} finally {
				setTogglingUserId(null);
			}
		},
		[toggleMutation]
	);

	const handleRefreshFriends = useCallback(async () => {
		setIsRefreshingFriends(true);
		try {
			await Promise.all([refetchFriends(), refetchPermissions()]);
		} finally {
			setIsRefreshingFriends(false);
		}
	}, [refetchFriends, refetchPermissions]);

	useFocusEffect(
		useCallback(() => {
			refetchFriends();
			refetchPermissions();
		}, [refetchFriends, refetchPermissions])
	);

	const permissionSet = useMemo(() => new Set(permissions), [permissions]);
	const canControl = useCallback((id: string) => permissionSet.has(id), [permissionSet]);

	return {
		activeTab,
		friends,
		isLoadingFriends,
		isRefreshingFriends,
		onRefreshFriends: handleRefreshFriends,
		...search,
		hasFriends: friends.length > 0,
		canControl,
		togglingUserId,
		onToggleControl: handleToggleControl,
		onSelectUser: onNavigateToProfile,
		onTabChange: setActiveTab,
		playerHeight,
	};
}

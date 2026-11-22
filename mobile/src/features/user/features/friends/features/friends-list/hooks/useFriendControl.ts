import { useCallback, useMemo } from 'react';
import { useControlPermissions } from '@/features/user/features/friends/shared/follows/hooks/useFriendsQueries';
import { useToggleControl } from '@/features/user/features/friends/features/friends-list/hooks/useToggleControl';
import type { FriendControl } from '@/features/user/features/friends/features/friends-list/friendsListTypes';

const NO_PERMISSIONS: string[] = [];

export function useFriendControl() {
	const permissions = useControlPermissions();
	const toggling = useToggleControl();
	const permissionSet = useMemo(
		() => new Set(permissions.data ?? NO_PERMISSIONS),
		[permissions.data],
	);
	const canControl = useCallback((id: string) => permissionSet.has(id), [permissionSet]);
	const control: FriendControl = { canControl, ...toggling };

	return { control, refetchPermissions: permissions.refetch };
}

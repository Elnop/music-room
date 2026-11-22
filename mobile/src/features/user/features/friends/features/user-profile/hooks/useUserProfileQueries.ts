import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import { useSession } from '@/shared/backend/hooks/useSession';
import { friendsApi } from '@/features/user/features/friends/shared/follows/friendsApi';
import { ON_EVERY_VISIT } from '@/features/user/features/friends/shared/follows/followsQueryConfig';

export function useFollowStatus(userId: string, enabled = true) {
	const signedIn = useSession((session) => session.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.friends.status(userId),
		queryFn: () => friendsApi.getFollowStatus(userId),
		enabled: signedIn && Boolean(userId) && enabled,
		...ON_EVERY_VISIT,
	});
}

export function useUserProfile(userId: string, enabled = true) {
	const signedIn = useSession((session) => session.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.profile.user(userId),
		queryFn: () => friendsApi.getProfile(userId),
		enabled: signedIn && Boolean(userId) && enabled,
		...ON_EVERY_VISIT,
	});
}

export function useUserPublicPlaylists(userId: string, enabled = true) {
	const signedIn = useSession((session) => session.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.playlists.user(userId),
		queryFn: () => friendsApi.getUserPublicPlaylists(userId),
		enabled: signedIn && Boolean(userId) && enabled,
		...ON_EVERY_VISIT,
	});
}

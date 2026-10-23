import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { STALE } from '@/shared/query/queryClient';
import { useSession } from '@/shared/services/authSession';
import { friendsApi } from '@/features/friends/services/friendsApi';

const ON_EVERY_VISIT = { staleTime: STALE.none, retry: false } as const;

export function useFriendsList(enabled = true) {
	const signedIn = useSession(session => session.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.friends.list(),
		queryFn: () => friendsApi.getFriends(),
		enabled: signedIn && enabled,
		...ON_EVERY_VISIT,
	});
}

export function useControlPermissions(enabled = true) {
	const signedIn = useSession(session => session.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.friends.permissions(),
		queryFn: () => friendsApi.getMyPermissions(),
		enabled: signedIn && enabled,
		...ON_EVERY_VISIT,
	});
}

export function useFollowStatus(userId: string, enabled = true) {
	const signedIn = useSession(session => session.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.friends.status(userId),
		queryFn: () => friendsApi.getFollowStatus(userId),
		enabled: signedIn && Boolean(userId) && enabled,
		...ON_EVERY_VISIT,
	});
}

export function useUserProfile(userId: string, enabled = true) {
	const signedIn = useSession(session => session.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.profile.user(userId),
		queryFn: () => friendsApi.getProfile(userId),
		enabled: signedIn && Boolean(userId) && enabled,
		...ON_EVERY_VISIT,
	});
}

export function useUserPublicPlaylists(userId: string, enabled = true) {
	const signedIn = useSession(session => session.isAuthenticated);
	return useQuery({
		queryKey: [...queryKeys.playlists.all, 'user', userId] as const,
		queryFn: () => friendsApi.getUserPublicPlaylists(userId),
		enabled: signedIn && Boolean(userId) && enabled,
		...ON_EVERY_VISIT,
	});
}

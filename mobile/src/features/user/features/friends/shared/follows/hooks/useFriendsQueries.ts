import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import { useSession } from '@/shared/backend/hooks/useSession';
import { friendsApi } from '@/features/user/features/friends/shared/follows/friendsApi';
import { ON_EVERY_VISIT } from '@/features/user/features/friends/shared/follows/followsQueryConfig';

export function useFriendsList(enabled = true) {
	const signedIn = useSession((session) => session.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.friends.list(),
		queryFn: () => friendsApi.getFriends(),
		enabled: signedIn && enabled,
		...ON_EVERY_VISIT,
	});
}

export function useControlPermissions(enabled = true) {
	const signedIn = useSession((session) => session.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.friends.permissions(),
		queryFn: () => friendsApi.getMyPermissions(),
		enabled: signedIn && enabled,
		...ON_EVERY_VISIT,
	});
}

export function useSimilarProfiles(enabled = true) {
	const signedIn = useSession((session) => session.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.friends.recommendations(),
		queryFn: () => friendsApi.getRecommendations(),
		enabled: signedIn && enabled,
	});
}

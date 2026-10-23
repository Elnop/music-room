import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { friendsApi } from '@/features/friends/services/friendsApi';

export function useToggleControlMutation() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: async ({ userId, shouldGrant }: { userId: string; shouldGrant: boolean }) => {
			if (shouldGrant) {
				await friendsApi.grantControl(userId);
			} else {
				await friendsApi.revokeControl(userId);
			}
			return { userId, shouldGrant };
		},
		onSuccess: ({ userId, shouldGrant }) => {
			client.setQueryData<string[]>(queryKeys.friends.permissions(), prev => {
				if (!prev) return shouldGrant ? [userId] : [];
				return shouldGrant ? [...prev, userId] : prev.filter(id => id !== userId);
			});
		},
	});
}

export function useFollowMutation() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: async ({ userId, shouldFollow }: { userId: string; shouldFollow: boolean }) => {
			if (shouldFollow) {
				return friendsApi.followUser(userId);
			}
			return friendsApi.unfollowUser(userId);
		},
		onSuccess: (data, { userId }) => {
			client.setQueryData(queryKeys.friends.status(userId), data.status);
			client.invalidateQueries({ queryKey: queryKeys.friends.list() });
			client.invalidateQueries({ queryKey: queryKeys.friends.stats() });
		},
	});
}

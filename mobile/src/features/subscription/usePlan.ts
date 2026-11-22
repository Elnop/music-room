import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import { STALE } from '@/shared/backend/configs/staleQueryConfig';
import { useSession } from '@/shared/backend/hooks/useSession';
import { subscriptionApi } from '@/features/subscription/subscriptionApi';
import type { Plan, Subscription } from '@/features/subscription/subscriptionTypes';

export function usePlan({ enabled = true }: { enabled?: boolean } = {}) {
	const authenticated = useSession(s => s.isAuthenticated);
	const query = useQuery({
		queryKey: queryKeys.subscription.plan(),
		queryFn: () => subscriptionApi.getSubscription(),
		enabled: authenticated && enabled,
		staleTime: STALE.short,
	});
	return { ...query, plan: query.data?.plan, isPremium: query.data?.plan === 'premium' };
}

export function useChangePlan() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (plan: Plan) => subscriptionApi.changePlan(plan),
		onMutate: async plan => {
			await queryClient.cancelQueries({ queryKey: queryKeys.subscription.plan() });
			const previous = queryClient.getQueryData<Subscription>(queryKeys.subscription.plan());
			if (previous) {
				queryClient.setQueryData<Subscription>(queryKeys.subscription.plan(), {
					...previous,
					plan,
				});
			}
			return { previous };
		},
		onError: (_error, _plan, context) => {
			if (context?.previous) {
				queryClient.setQueryData(queryKeys.subscription.plan(), context.previous);
			}
		},
		onSuccess: data => {
			queryClient.setQueryData(queryKeys.subscription.plan(), data);
		},
	});
}

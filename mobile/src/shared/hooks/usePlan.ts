import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { STALE } from '@/shared/query/queryClient';
import { useSession } from '@/shared/services/authSession';
import { subscriptionApi } from '@/shared/services/subscriptionApi';
import type { Plan, Subscription } from '@/shared/types/subscription';

export function usePlan() {
	const authenticated = useSession(s => s.isAuthenticated);
	const query = useQuery({
		queryKey: queryKeys.subscription.plan(),
		queryFn: () => subscriptionApi.getSubscription(),
		enabled: authenticated,
		staleTime: STALE.short,
	});
	return { ...query, plan: query.data?.plan, isPremium: query.data?.plan === 'premium' };
}

/** Optimistic: the cached plan changes at once and comes back on failure. */
export function useChangePlan() {
	const queryClient = useQueryClient();
	const key = queryKeys.subscription.plan();
	return useMutation({
		mutationFn: (plan: Plan) => subscriptionApi.changePlan(plan),
		onMutate: async plan => {
			await queryClient.cancelQueries({ queryKey: key });
			const previous = queryClient.getQueryData<Subscription>(key);
			if (previous) queryClient.setQueryData<Subscription>(key, { ...previous, plan });
			return { previous };
		},
		onError: (_error, _plan, context) => {
			if (context?.previous) queryClient.setQueryData(key, context.previous);
		},
		onSuccess: data => {
			queryClient.setQueryData(key, data);
		},
	});
}

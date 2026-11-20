import React, { type ReactNode } from 'react';
import { useChangePlan, usePlan } from '@/features/subscription/usePlan';
import type { PlanState } from '@/features/subscription/lib/subscription';

interface PlanContainerProps {
	children: (plan: PlanState) => ReactNode;
}

export function PlanContainer({ children }: PlanContainerProps) {
	const query = usePlan();
	const change = useChangePlan();
	return (
		<>
			{children({
				plan: query.plan,
				isPremium: query.isPremium,
				isChanging: change.isPending,
				changePlan: (plan, onError) => change.mutate(plan, { onError }),
				refetch: () => {
					void query.refetch();
				},
			})}
		</>
	);
}

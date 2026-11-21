export type Plan = 'free' | 'premium';

export type PremiumFeature = 'playlist_cover';

export interface Subscription {
	plan: Plan;
	premiumFeatures: PremiumFeature[];
}

export interface PlanState {
	plan: Plan | undefined;
	isPremium: boolean;
	isChanging: boolean;
	changePlan: (plan: Plan, onError: (error: unknown) => void) => void;
	refetch: () => void;
}

export type Plan = 'free' | 'premium';

export type PremiumFeature = 'playlist_cover';

export type Subscription = {
	plan: Plan;
	premiumFeatures: PremiumFeature[];
};

export type PlanState = {
	plan: Plan | undefined;
	isPremium: boolean;
	isChanging: boolean;
	changePlan: (plan: Plan, onError: (error: unknown) => void) => void;
	refetch: () => void;
};

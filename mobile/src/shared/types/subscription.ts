export type Plan = 'free' | 'premium';

export type PremiumFeature = 'playlist_cover';

export interface Subscription {
	plan: Plan;
	premiumFeatures: PremiumFeature[];
}

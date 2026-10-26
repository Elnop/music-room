/** Mirrors `GET /api/subscription` (backend `features/subscription/subscription.validators.ts`). */
export type Plan = 'free' | 'premium';

export type PremiumFeature = 'playlist_cover';

export interface Subscription {
	plan: Plan;
	/** What the premium plan unlocks, whatever the current plan. */
	premiumFeatures: PremiumFeature[];
}

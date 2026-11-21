import type { RecommendedProfile } from '@/features/user/features/friends/friendsTypes';

export type SimilarProfilesStatus = 'loading' | 'error' | 'needsPreferences' | 'empty' | 'ready';

export type SimilarProfilesSection = {
	status: SimilarProfilesStatus;
	profiles: RecommendedProfile[];
	openProfile: (userId: string) => void;
	openPreferences: () => void;
	retry: () => void;
};

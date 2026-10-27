import { useState } from 'react';
import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { showError } from '@/shared/utils/toast';
import { useSimilarProfiles } from '@/features/friends/hooks/useFriendsQueries';
import { useFollowMutation } from '@/features/friends/hooks/useFriendsMutations';
import type { RecommendedProfile } from '@/features/friends/types';

export type SimilarProfilesStatus = 'loading' | 'error' | 'needsPreferences' | 'empty' | 'ready';

export interface SimilarProfilesSection {
	status: SimilarProfilesStatus;
	profiles: RecommendedProfile[];
	/** The profile whose follow request is in flight. */
	followingId: string | null;
	follow: (userId: string) => void;
	openProfile: (userId: string) => void;
	openPreferences: () => void;
	retry: () => void;
}

function statusOf(query: ReturnType<typeof useSimilarProfiles>): SimilarProfilesStatus {
	if (query.data) {
		if (!query.data.hasPreferences) return 'needsPreferences';
		return query.data.profiles.length > 0 ? 'ready' : 'empty';
	}
	return query.isError ? 'error' : 'loading';
}

export function useSimilarProfilesSection(): SimilarProfilesSection {
	const navigation = useNavigation<NavigationProp<ParamListBase>>();
	const query = useSimilarProfiles();
	const followMutation = useFollowMutation();
	const [followingId, setFollowingId] = useState<string | null>(null);

	// The profiles live in other tabs; Home sits in a stack under the tab navigator.
	const tabs = () => navigation.getParent() ?? navigation;

	const follow = (userId: string) => {
		setFollowingId(userId);
		followMutation.mutate(
			{ userId, shouldFollow: true },
			{
				onError: error => showError(apiErrorMessage(error, 'Impossible de suivre ce profil')),
				onSettled: () => setFollowingId(null),
			}
		);
	};

	return {
		status: statusOf(query),
		profiles: query.data?.profiles ?? [],
		followingId,
		follow,
		openProfile: userId =>
			tabs().navigate('FriendsTab', { screen: 'UserProfile', params: { userId }, initial: false }),
		openPreferences: () =>
			tabs().navigate('ProfileTab', { screen: 'MusicPreferences', initial: false }),
		retry: () => void query.refetch(),
	};
}

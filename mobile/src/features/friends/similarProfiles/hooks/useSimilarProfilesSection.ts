import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { useSimilarProfiles } from '@/features/friends/hooks/useFriendsQueries';
import type { RecommendedProfile } from '@/features/friends/types';

export type SimilarProfilesStatus = 'loading' | 'error' | 'needsPreferences' | 'empty' | 'ready';

export interface SimilarProfilesSection {
	status: SimilarProfilesStatus;
	profiles: RecommendedProfile[];
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

	// The profiles live in other tabs; Home sits in a stack under the tab navigator.
	const tabs = () => navigation.getParent() ?? navigation;

	return {
		status: statusOf(query),
		profiles: query.data?.profiles ?? [],
		openProfile: userId =>
			tabs().navigate('FriendsTab', { screen: 'UserProfile', params: { userId }, initial: false }),
		openPreferences: () =>
			tabs().navigate('ProfileTab', { screen: 'MusicPreferences', initial: false }),
		retry: () => void query.refetch(),
	};
}

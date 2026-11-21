import { useNavigation } from '@react-navigation/native';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useSimilarProfiles } from '@/features/user/features/friends/shared/follows/hooks/useFriendsQueries';
import type {
	SimilarProfilesSection,
	SimilarProfilesStatus,
} from '@/features/user/features/friends/features/similar-profiles/similarProfilesTypes';

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

	function tabs() {
		return navigation.getParent() ?? navigation;
	}

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

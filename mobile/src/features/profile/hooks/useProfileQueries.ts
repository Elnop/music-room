import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { STALE } from '@/shared/query/queryClient';
import { useSession } from '@/shared/services/authSession';
import { privacyApi } from '@/features/profile/services/privacyApi';
import { profileApi } from '@/features/profile/services/profileApi';

export function useProfilePrivacy() {
	const authenticated = useSession(s => s.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.profile.privacy(),
		queryFn: () => privacyApi.getPrivacySettings(),
		enabled: authenticated,
		staleTime: STALE.none,
		refetchOnMount: 'always',
		retry: false,
	});
}

export function useUserMusicPreferences(options?: { refetchOnMount?: boolean | 'always' }) {
	const authenticated = useSession(s => s.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.profile.musicPreferences(),
		queryFn: () => privacyApi.getMusicPreferences(),
		enabled: authenticated,
		staleTime: STALE.short,
		refetchOnMount: options?.refetchOnMount ?? true,
		retry: false,
	});
}

export function useUserStats() {
	const authenticated = useSession(s => s.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.friends.stats(),
		queryFn: () => profileApi.getMyStats(),
		enabled: authenticated,
		staleTime: STALE.short,
		retry: false,
	});
}
